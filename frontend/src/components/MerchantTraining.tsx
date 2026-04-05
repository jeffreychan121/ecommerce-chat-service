import React, { useState, useEffect } from 'react';
import {
  uploadTrainingFile,
  getTrainingFiles,
  deleteTrainingFile,
  trainFile,
  chatWithKnowledge,
  getStoreStatus,
  createDataset,
  deleteDataset,
  CreateDatasetParams,
  enableFile,
  disableFile,
} from '../services/api';
import { formatAssistantMessage, isTableFormat, parseTable, isKeyValueFormat, parseKeyValue } from '../utils/formatMessage';

interface TrainingJob {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  enabled?: boolean;
  createdAt: string;
}

interface StoreStatus {
  storeId: string;
  storeName: string;
  hasDataset: boolean;
  datasetId: string | null;
  fileCount: number;
}

// AI消息内容渲染 - 使用格式化工具
const AIMessageContent: React.FC<{ content: string }> = ({ content }) => {
  // 先格式化文本，移除 markdown 残留
  const formattedText = formatAssistantMessage(content);

  // 将内容按段落分割
  const paragraphs = formattedText.split('\n\n').filter(p => p.trim());

  return (
    <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        // 检测表格格式
        if (isTableFormat(para)) {
          const rows = parseTable(para);
          if (rows.length > 0) {
            return (
              <div key={pIdx} style={{ marginBottom: '12px', overflowX: 'auto' }}>
                <table style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  fontSize: '13px',
                  border: '1px solid #dee2e6',
                }}>
                  <thead>
                    {rows.slice(0, 1).map((row, rIdx) => (
                      <tr key={`header-${rIdx}`} style={{ background: '#f8f9fa' }}>
                        {row.map((cell, cIdx) => (
                          <th key={cIdx} style={{
                            padding: '10px 12px',
                            border: '1px solid #dee2e6',
                            color: '#495057',
                            fontWeight: 600,
                            textAlign: 'left',
                          }}>
                            {cell}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {rows.slice(1).map((row, rIdx) => (
                      <tr key={`row-${rIdx}`}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            color: '#333',
                          }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 检测属性-值格式
        if (isKeyValueFormat(para)) {
          const items = parseKeyValue(para);
          if (items.length > 0) {
            return (
              <div key={pIdx} style={{ marginBottom: '8px' }}>
                {items.map((item, iIdx) => (
                  <div key={iIdx} style={{
                    display: 'flex',
                    marginBottom: '2px',
                    padding: '2px 0',
                  }}>
                    <span style={{
                      color: '#666',
                      fontWeight: 500,
                      minWidth: '80px',
                      flexShrink: 0,
                    }}>{item.key}</span>
                    <span style={{ color: '#333', wordBreak: 'break-word' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            );
          }
        }

        // 单行处理
        if (lines.length === 1) {
          const line = lines[0].trim();

          // 标题（无 # 但可能是标题格式）
          if (line.length < 50 && !line.includes(' ') && /^[A-Z\u4E00-\u9FA5]/.test(line)) {
            return (
              <div key={pIdx} style={{
                fontWeight: 600,
                fontSize: '15px',
                color: '#1a1a1a',
                marginBottom: '8px',
                marginTop: pIdx > 0 ? '12px' : '0',
              }}>
                {line}
              </div>
            );
          }

          // 列表项
          if (line.match(/^[-•·◆]\s+/) || line.match(/^\d+[.、]\s+/)) {
            const text = line.replace(/^[-•·◆\d.、]+\s*/, '');
            return (
              <div key={pIdx} style={{
                display: 'flex',
                marginBottom: '4px',
                paddingLeft: '4px',
              }}>
                <span style={{ color: '#667eea', marginRight: '8px', flexShrink: 0 }}>•</span>
                <span style={{ color: '#333' }}>{text}</span>
              </div>
            );
          }

          // 普通段落
          return (
            <div key={pIdx} style={{ color: '#333', marginBottom: '8px' }}>
              {line}
            </div>
          );
        }

        // 多行普通文本
        return (
          <div key={pIdx} style={{ marginBottom: '8px' }}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={lIdx} />;

              // 列表
              if (trimmed.match(/^[-•·◆]\s+/) || trimmed.match(/^\d+[.、]\s+/)) {
                const text = trimmed.replace(/^[-•·◆\d.、]+\s*/, '');
                return (
                  <div key={lIdx} style={{ display: 'flex', marginBottom: '2px', paddingLeft: '4px' }}>
                    <span style={{ color: '#667eea', marginRight: '8px', flexShrink: 0 }}>•</span>
                    <span style={{ color: '#333' }}>{text}</span>
                  </div>
                );
              }

              return (
                <div key={lIdx} style={{ color: '#333', marginBottom: '2px' }}>
                  {trimmed}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const MerchantTraining: React.FC<{
  storeId: string;
  storeName: string;
  onBack: () => void;
}> = ({ storeId, storeName, onBack }) => {
  console.log('[MerchantTraining] storeId:', storeId, 'storeName:', storeName);
  const [files, setFiles] = useState<TrainingJob[]>([]);
  const [messages, setMessages] = useState<{ id: string; content: string; position: 'left' | 'right' }[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'chat'>('upload');
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [datasetForm, setDatasetForm] = useState<CreateDatasetParams>({
    name: '',
    description: '',
    indexing_technique: 'high_quality',
    permission: 'only_me',
    search_method: 'semantic_search',
    top_k: 2,
    score_threshold_enabled: false,
    score_threshold: 0,
    doc_form: 'text_model',
  });

  useEffect(() => {
    if (!storeId) return;
    loadStatus();
  }, [storeId]);

  const loadStatus = async () => {
    if (!storeId) return;
    try {
      const res = await getStoreStatus(storeId);
      setStoreStatus(res.data);
      if (res.data.hasDataset) {
        loadFiles();
      }
    } catch (e) {
      console.error('获取状态失败:', e);
    }
  };

  const handleCreateDataset = async () => {
    setLoading(true);
    try {
      // 过滤空值，只发送用户填写的内容
      const params: CreateDatasetParams = {};
      if (datasetForm.name) params.name = datasetForm.name;
      if (datasetForm.description) params.description = datasetForm.description;
      if (datasetForm.indexing_technique && datasetForm.indexing_technique !== 'high_quality') params.indexing_technique = datasetForm.indexing_technique;
      if (datasetForm.permission && datasetForm.permission !== 'only_me') params.permission = datasetForm.permission;
      if (datasetForm.search_method && datasetForm.search_method !== 'semantic_search') params.search_method = datasetForm.search_method;
      if (datasetForm.top_k && datasetForm.top_k !== 2) params.top_k = datasetForm.top_k;
      if (datasetForm.score_threshold_enabled) params.score_threshold_enabled = true;
      if (datasetForm.score_threshold && datasetForm.score_threshold > 0) params.score_threshold = datasetForm.score_threshold;
      if (datasetForm.doc_form && datasetForm.doc_form !== 'text_model') params.doc_form = datasetForm.doc_form;

      await createDataset(storeId, params);
      await loadStatus();
      setShowCreateModal(false);
      // 重置表单
      setDatasetForm({
        name: '',
        description: '',
        indexing_technique: 'high_quality',
        permission: 'only_me',
        search_method: 'semantic_search',
        top_k: 2,
        score_threshold_enabled: false,
        score_threshold: 0,
        doc_form: 'text_model',
      });
    } catch (e) {
      console.error('创建知识库失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!confirm('确定要删除知识库吗？删除后所有训练文件将被清除。')) {
      return;
    }
    setLoading(true);
    try {
      await deleteDataset(storeId);
      await loadStatus();
      setFiles([]);
    } catch (e) {
      console.error('删除知识库失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!storeId) return;
    try {
      const res = await getTrainingFiles(storeId);
      setFiles(res.data || []);
    } catch (e) {
      console.error('加载文件失败:', e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await uploadTrainingFile(storeId, file);
      await loadFiles();
      setActiveTab('files');
    } catch (e) {
      console.error('上传失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    setLoading(true);
    try {
      await deleteTrainingFile(jobId);
      await loadFiles();
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async (jobId: string) => {
    setLoading(true);
    try {
      await trainFile(jobId);
      await loadFiles();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (jobId: string, enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        await enableFile(jobId);
      } else {
        await disableFile(jobId);
      }
      await loadFiles();
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      content: query,
      position: 'right' as const,
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    try {
      const res = await chatWithKnowledge(storeId, query);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        content: res.data?.answer || res.data?.message || '暂无回复',
        position: 'left' as const,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        content: '请求失败，请稍后重试',
        position: 'left' as const,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '待训练',
      PROCESSING: '训练中',
      COMPLETED: '已完成',
      FAILED: '失败',
    };
    return map[status] || status;
  };

  return (
    <div className="merchant-training">
      {/* 头部 */}
      <div className="mt-header">
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
        <div className="store-info">
          <h2>知识库训练</h2>
          <span className="store-name">{storeName}</span>
        </div>
      </div>

      {/* 知识库状态 */}
      <div className="dataset-status">
        {storeStatus?.hasDataset ? (
          <>
            <span className="status-badge ready">知识库已创建</span>
            <span className="dataset-id">ID: {storeStatus.datasetId}</span>
            <button
              className="delete-btn"
              onClick={handleDeleteDataset}
              disabled={loading}
              style={{
                marginLeft: '12px',
                padding: '6px 12px',
                background: 'rgba(255,77,79,0.2)',
                border: '1px solid rgba(255,77,79,0.5)',
                borderRadius: '6px',
                color: '#ff4d4f',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              删除知识库
            </button>
          </>
        ) : (
          <>
            <span className="status-badge not-ready">尚未创建知识库</span>
            <button className="create-btn" onClick={() => setShowCreateModal(true)} disabled={loading}>
              {loading ? '创建中...' : '创建知识库'}
            </button>
          </>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="mt-tabs">
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          上传文件
        </button>
        <button
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          文件管理 ({files.length})
        </button>
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          AI 测试
        </button>
      </div>

      {/* 上传文件 Tab */}
      {activeTab === 'upload' && (
        <div className="mt-section">
          <div className="upload-area">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.md"
              onChange={handleUpload}
              disabled={loading}
            />
            <label htmlFor="file-upload" className="upload-label">
              {loading ? '上传中...' : '选择文件'}
            </label>
            <p className="hint">支持 PDF、Word、Excel、MD 文件，最大 10MB</p>
          </div>
        </div>
      )}

      {/* 文件管理 Tab */}
      {activeTab === 'files' && (
        <div className="mt-section">
          <div className="file-list">
            {files.length === 0 ? (
              <div className="empty">暂无上传文件</div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <span className="file-name">{file.fileName}</span>
                    <span className={`status status-${file.status.toLowerCase()}`}>
                      {getStatusLabel(file.status)}
                    </span>
                    {file.status === 'COMPLETED' && (
                      <label style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={file.enabled !== false}
                          onChange={(e) => handleToggleEnabled(file.id, e.target.checked)}
                          disabled={loading}
                          style={{ marginRight: '6px' }}
                        />
                        {file.enabled !== false ? '启用' : '禁用'}
                      </label>
                    )}
                  </div>
                  <div className="file-actions">
                    <button
                      onClick={() => handleTrain(file.id)}
                      disabled={loading || file.status === 'PROCESSING' || file.status === 'COMPLETED'}
                    >
                      {file.status === 'COMPLETED' ? '已训练' : '训练'}
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={loading}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI 测试 Tab */}
      {activeTab === 'chat' && (
        <div className="mt-section">
          <div className="chat-window">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.position}`}
              >
                {msg.position === 'left' ? <AIMessageContent content={msg.content} /> : msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入问题测试..."
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            />
            <button onClick={handleChat} disabled={loading || !query.trim()}>
              发送
            </button>
          </div>
        </div>
      )}

      {/* 创建知识库弹窗 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>创建知识库</h3>

            {/* 基础设置 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>知识库名称</label>
              <input
                type="text"
                value={datasetForm.name}
                onChange={e => setDatasetForm({ ...datasetForm, name: e.target.value })}
                placeholder={`${storeName} 知识库`}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>描述</label>
              <textarea
                value={datasetForm.description}
                onChange={e => setDatasetForm({ ...datasetForm, description: e.target.value })}
                placeholder={`商家 ${storeName} 的知识库`}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* 高级设置折叠 */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: 0,
                }}
              >
                {showAdvanced ? '▼' : '▶'} 高级设置
              </button>
            </div>

            {showAdvanced && (
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                {/* 索引技术 */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>索引技术</label>
                  <select
                    value={datasetForm.indexing_technique}
                    onChange={e => setDatasetForm({ ...datasetForm, indexing_technique: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="high_quality">高质量 (high_quality)</option>
                    <option value="economy">经济 (economy)</option>
                  </select>
                </div>

                {/* 权限 */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>权限</label>
                  <select
                    value={datasetForm.permission}
                    onChange={e => setDatasetForm({ ...datasetForm, permission: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="only_me">仅自己 (only_me)</option>
                    <option value="all-team-members">所有团队成员</option>
                    <option value="partial">部分可见</option>
                  </select>
                </div>

                {/* 搜索方式 */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>搜索方式</label>
                  <select
                    value={datasetForm.search_method}
                    onChange={e => setDatasetForm({ ...datasetForm, search_method: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="semantic_search">语义搜索 (semantic_search)</option>
                    <option value="keyword_search">关键词搜索 (keyword_search)</option>
                    <option value="hybrid_search">混合搜索 (hybrid_search)</option>
                  </select>
                </div>

                {/* Top K */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>Top K (返回数量)</label>
                  <input
                    type="number"
                    value={datasetForm.top_k}
                    onChange={e => setDatasetForm({ ...datasetForm, top_k: parseInt(e.target.value) || 2 })}
                    min={1}
                    max={20}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 分数阈值 */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '14px', marginBottom: '6px' }}>
                    <input
                      type="checkbox"
                      checked={datasetForm.score_threshold_enabled}
                      onChange={e => setDatasetForm({ ...datasetForm, score_threshold_enabled: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    启用分数阈值
                  </label>
                  {datasetForm.score_threshold_enabled && (
                    <input
                      type="number"
                      value={datasetForm.score_threshold}
                      onChange={e => setDatasetForm({ ...datasetForm, score_threshold: parseFloat(e.target.value) || 0 })}
                      min={0}
                      max={1}
                      step={0.1}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>

                {/* 文档格式 */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#666', fontSize: '14px' }}>文档格式</label>
                  <select
                    value={datasetForm.doc_form}
                    onChange={e => setDatasetForm({ ...datasetForm, doc_form: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="text_model">文本 (text_model)</option>
                    <option value="qa_model">问答 (qa_model)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateDataset}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '14px',
                }}
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantTraining;
