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

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      zIndex: 3000,
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        padding: '24px 32px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          }}>
            💬
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 600 }}>客服工作台</h2>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
              {activeTab === 'pending' ? `待处理 ${queue.length} 个会话` : `历史会话 ${history.length} 条`}
            </div>
          </div>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
        >
          ← 返回
        </button>
      </div>

      {/* Tab */}
      <div style={{
        display: 'flex',
        padding: '20px 32px',
        gap: '12px',
      }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'pending'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'pending' ? 600 : 400,
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'pending' ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
          }}
        >
          <span style={{ marginRight: '8px' }}>📥</span>
          待处理
          <span style={{
            marginLeft: '8px',
            padding: '2px 8px',
            background: activeTab === 'pending' ? 'rgba(255,255,255,0.2)' : 'rgba(102, 126, 234, 0.3)',
            borderRadius: '12px',
            fontSize: '13px',
          }}>
            {queue.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'history'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'history' ? 600 : 400,
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'history' ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
          }}
        >
          <span style={{ marginRight: '8px' }}>📋</span>
          历史会话
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 32px' }}>
        {loading ? (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
          }}>
            加载中...
          </div>
        ) : activeTab === 'pending' ? (
          queue.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '60px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <div style={{ fontSize: '18px' }}>暂无待处理会话</div>
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>客户提交转人工请求后会显示在这里</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queue.map((item, index) => (
                <div
                  key={item.ticketId}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                    animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* 排队号 */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(250, 140, 22, 0.3)',
                  }}>
                    {item.queueNo}
                  </div>

                  {/* 用户信息 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                        {item.userPhone}
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        background: item.storeType === 'SELF' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(82, 196, 26, 0.2)',
                        color: item.storeType === 'SELF' ? '#40a9ff' : '#73d13d',
                      }}>
                        {item.storeName}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span>💬</span>
                      <span style={{
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.lastMessage || '暂无消息'}
                      </span>
                    </div>
                  </div>

                  {/* 时间 */}
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatTime(item.createdAt)}
                  </div>

                  {/* 操作 */}
                  <button
                    onClick={() => handleAccept(item.sessionId)}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    接入
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '60px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px' }}>暂无历史会话</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item, index) => (
                <div
                  key={item.ticketId}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                    animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                >
                  {/* 头像 */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: item.status === 'CLOSED'
                      ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                      : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {item.status === 'CLOSED' ? '✓' : '💬'}
                  </div>

                  {/* 用户信息 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                        {item.userPhone}
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        background: item.storeType === 'SELF' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(82, 196, 26, 0.2)',
                        color: item.storeType === 'SELF' ? '#40a9ff' : '#73d13d',
                      }}>
                        {item.storeName}
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        background: item.status === 'CLOSED' ? 'rgba(255, 77, 79, 0.2)' : 'rgba(82, 196, 26, 0.2)',
                        color: item.status === 'CLOSED' ? '#ff7875' : '#73d13d',
                      }}>
                        {item.status === 'CLOSED' ? '已关闭' : '已接听'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      接入时间: {item.agentJoinedAt ? new Date(item.agentJoinedAt).toLocaleString('zh-CN') : '-'}
                    </div>
                  </div>

                  {/* 操作 */}
                  <button
                    onClick={() => handleViewHistory(item.sessionId)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    查看
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AgentDashboard;