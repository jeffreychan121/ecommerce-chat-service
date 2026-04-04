import React, { useState, useEffect } from 'react';
import {
  uploadTrainingFile,
  getTrainingFiles,
  deleteTrainingFile,
  trainFile,
  chatWithKnowledge,
} from '../services/api';

interface TrainingJob {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export const MerchantTraining: React.FC<{
  storeId: string;
  storeName: string;
  onBack: () => void;
}> = ({ storeId, storeName, onBack }) => {
  const [files, setFiles] = useState<TrainingJob[]>([]);
  const [messages, setMessages] = useState<{ id: string; content: string; position: 'left' | 'right' }[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'chat'>('upload');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
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
                  </div>
                  <div className="file-actions">
                    <button
                      onClick={() => handleTrain(file.id)}
                      disabled={loading || file.status === 'PROCESSING'}
                    >
                      训练
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
                {msg.content}
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
    </div>
  );
};

export default MerchantTraining;
