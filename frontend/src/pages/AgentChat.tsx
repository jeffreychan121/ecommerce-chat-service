import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'USER' | 'AI' | 'HUMAN';
  content: string;
  createdAt: string;
}

interface AgentChatProps {
  sessionId: string;
  onBack: () => void;
}

const AgentChat: React.FC<AgentChatProps> = ({ sessionId, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ name: string; storeType: string } | null>(null);
  const [userPhone, setUserPhone] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 客服预制快速回复
  const AGENT_QUICK_REPLIES = [
    '您好，请问有什么可以帮您？',
    '好的，我帮您查一下',
    '请问还有其他问题吗？',
    '感谢您的咨询，祝您生活愉快',
    '订单已为您创建，请注意查收',
    '快递已发出，预计2-3天送达',
  ];

  // ... existing code ...

  useEffect(() => {
    // 加载会话详情
    setLoading(true);
    fetch(`http://localhost:3000/api/agent/session/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.store) {
          setStoreInfo(data.store);
        }
        if (data.user) {
          setUserPhone(data.user.phone);
        }
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load session:', e);
        setLoading(false);
      });

    // WebSocket 监听客户新消息
    socketRef.current = io('http://localhost:3000', { path: '/ws/chat' });
    socketRef.current.on('connect', () => {
      console.log('[AgentChat] WebSocket connected, joining session:', sessionId);
      socketRef.current?.emit('join-session', { sessionId });
    });
    socketRef.current.on('customer-message', (msg: Message & { sessionId: string }) => {
      if (msg.sessionId === sessionId) {
        console.log('[AgentChat] Received customer message:', msg);
        setMessages(prev => [...prev, { ...msg, sessionId: undefined }]);
      }
    });

    return () => {
      socketRef.current?.emit('leave-session', { sessionId });
      socketRef.current?.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/api/agent/session/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const handleClose = async () => {
    try {
      await fetch(`http://localhost:3000/api/agent/session/${sessionId}/close`, { method: 'POST' });
      onBack();
    } catch (e) {
      console.error('Failed to close session:', e);
    }
  };

  const getSenderLabel = (type: string) => {
    if (type === 'USER') return '客户';
    if (type === 'AI') return 'AI';
    if (type === 'HUMAN') return '我';
    return type;
  };

  const getSenderStyle = (type: string): React.CSSProperties => {
    if (type === 'USER') return { background: '#e6f7ff', alignSelf: 'flex-end' };
    if (type === 'HUMAN') return { background: '#f6ffed', alignSelf: 'flex-start' };
    return { background: '#fafafa', alignSelf: 'center' };
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
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 20px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>会话详情</h2>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            {storeInfo && (
              <span style={{
                padding: '2px 8px',
                background: storeInfo.storeType === 'SELF' ? 'rgba(24,144,255,0.2)' : 'rgba(82,196,26,0.2)',
                borderRadius: '4px',
                marginRight: '8px',
              }}>
                {storeInfo.name}
              </span>
            )}
            {userPhone && <span>用户: {userPhone}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
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
            返回队列
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              background: '#ff4d4f',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            结束会话
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '20px',
          minHeight: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
              暂无消息记录
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', marginBottom: '16px' }}>
                <div style={{
                  ...getSenderStyle(msg.senderType),
                  padding: '12px 16px',
                  borderRadius: '8px',
                  maxWidth: '70%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {getSenderLabel(msg.senderType)}
                  </div>
                  <div style={{ lineHeight: '1.5' }}>{msg.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderTop: '1px solid #eee',
      }}>
        {/* 快速回复按钮 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}>
          {AGENT_QUICK_REPLIES.map((reply, index) => (
            <button
              key={index}
              onClick={() => {
                setInput(reply);
                // 自动发送
                setTimeout(() => handleSend(), 100);
              }}
              style={{
                padding: '6px 12px',
                background: '#f0f5ff',
                color: '#1677ff',
                border: '1px solid #d9e4ff',
                borderRadius: '16px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e6f0ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0f5ff';
              }}
            >
              {reply.length > 15 ? reply.slice(0, 15) + '...' : reply}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入回复内容..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              background: input.trim() ? '#1677ff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;