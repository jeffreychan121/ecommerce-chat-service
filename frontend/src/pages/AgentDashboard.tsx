import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface QueueItem {
  ticketId: string;
  queueNo: number;
  sessionId: string;
  userPhone: string;
  storeId: string;
  storeName: string;
  storeType: string;
  lastMessage: string;
  createdAt: string;
}

interface HistoryItem {
  ticketId: string;
  queueNo: number;
  sessionId: string;
  userPhone: string;
  storeId: string;
  storeName: string;
  storeType: string;
  lastMessage: string;
  createdAt: string;
  agentJoinedAt: string;
  closedAt: string;
  status: string;
}

interface AgentDashboardProps {
  onSelectSession: (sessionId: string) => void;
  onBack: () => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ onSelectSession, onBack }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchQueue();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    // WebSocket 监听队列更新
    const socket: Socket = io('http://localhost:3000', { path: '/ws/chat' });
    socket.on('handoff-queue-update', (data: QueueItem[]) => {
      setQueue(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/agent/queue');
      const data = await res.json();
      setQueue(data);
    } catch (e) {
      console.error('Failed to fetch queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/agent/history?page=1&limit=50');
      const data = await res.json();
      setHistory(data.items || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (sessionId: string) => {
    try {
      await fetch(`http://localhost:3000/api/agent/session/${sessionId}/accept`, { method: 'POST' });
      onSelectSession(sessionId);
    } catch (e) {
      console.error('Failed to accept session:', e);
    }
  };

  const handleViewHistory = (sessionId: string) => {
    onSelectSession(sessionId);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f5f5f5',
      zIndex: 3000,
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ margin: 0 }}>客服工作台</h2>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          返回
        </button>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', background: '#fff' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '14px 24px',
            border: 'none',
            background: activeTab === 'pending' ? '#1677ff' : 'transparent',
            color: activeTab === 'pending' ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
          }}
        >
          待处理 ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '14px 24px',
            border: 'none',
            background: activeTab === 'history' ? '#1677ff' : 'transparent',
            color: activeTab === 'history' ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
          }}
        >
          历史会话
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {activeTab === 'pending' ? (
            // 待处理队列
            <>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                待处理队列 ({queue.length})
              </h3>

              {loading ? (
                <p style={{ color: '#666' }}>加载中...</p>
              ) : queue.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                  暂无待处理会话
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>排队号</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>用户手机</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>店铺</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>最后消息</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>转人工时间</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map(item => (
                      <tr key={item.ticketId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#fff7e6',
                            color: '#fa8c16',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                          }}>
                            #{item.queueNo}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#333' }}>{item.userPhone}</td>
                        <td style={{ padding: '12px', color: '#333' }}>
                          <span style={{
                            padding: '2px 8px',
                            background: item.storeType === 'SELF' ? '#e6f7ff' : '#f6ffed',
                            color: item.storeType === 'SELF' ? '#1890ff' : '#52c41a',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}>
                            {item.storeName}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#666', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.lastMessage || '-'}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleAccept(item.sessionId)}
                            style={{
                              padding: '6px 16px',
                              background: '#1677ff',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            接入
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            // 历史会话
            <>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
                历史会话 ({history.length})
              </h3>

              {loading ? (
                <p style={{ color: '#666' }}>加载中...</p>
              ) : history.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                  暂无历史会话
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>排队号</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>用户手机</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>店铺</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>状态</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>接入时间</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.ticketId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#f0f0f0',
                            color: '#666',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                          }}>
                            #{item.queueNo}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#333' }}>{item.userPhone}</td>
                        <td style={{ padding: '12px', color: '#333' }}>
                          <span style={{
                            padding: '2px 8px',
                            background: item.storeType === 'SELF' ? '#e6f7ff' : '#f6ffed',
                            color: item.storeType === 'SELF' ? '#1890ff' : '#52c41a',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}>
                            {item.storeName}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: item.status === 'CLOSED' ? '#fff1f0' : '#f6ffed',
                            color: item.status === 'CLOSED' ? '#cf1322' : '#52c41a',
                          }}>
                            {item.status === 'CLOSED' ? '已关闭' : '已接听'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {item.agentJoinedAt ? new Date(item.agentJoinedAt).toLocaleString('zh-CN') : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleViewHistory(item.sessionId)}
                            style={{
                              padding: '6px 16px',
                              background: '#fff',
                              color: '#1677ff',
                              border: '1px solid #1677ff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;