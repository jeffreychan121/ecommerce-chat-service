import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageBubble } from '../components/MessageBubble';

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        padding: '16px 24px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>会话详情</h2>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            {storeInfo && (
              <span style={{
                padding: '2px 8px',
                background: storeInfo.storeType === 'SELF'
                  ? 'rgba(24, 144, 255, 0.3)'
                  : 'rgba(82, 196, 26, 0.3)',
                borderRadius: '4px',
                marginRight: '8px',
                fontSize: '11px',
              }}>
                {storeInfo.name}
              </span>
            )}
            {userPhone && <span style={{ opacity: 0.9 }}>用户: {userPhone}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
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
            ← 返回队列
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
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
        padding: '20px 24px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '20px',
          minHeight: '100%',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px' }}>
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px' }}>
              暂无消息记录
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  width: '100%',
                  marginBottom: '16px',
                  animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                }}
              >
                <MessageBubble
                  message={{
                    id: msg.id,
                    content: msg.content,
                    type: 'text',
                    senderType: msg.senderType === 'USER' ? 'user' : msg.senderType === 'HUMAN' ? 'human' : 'ai',
                    position: msg.senderType === 'USER' ? 'right' : 'left',
                    timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : undefined,
                  }}
                  userPhone={userPhone}
                />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* 快速回复按钮 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '14px',
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
                padding: '8px 14px',
                background: 'rgba(102, 126, 234, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '20px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {reply.length > 12 ? reply.slice(0, 12) + '...' : reply}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            className="agent-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入回复内容..."
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: '14px 28px',
              background: input.trim()
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: input.trim() ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            发送
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .agent-input::placeholder {
          color: rgba(255,255,255,0.5);
        }
        .agent-input::-webkit-input-placeholder {
          color: rgba(255,255,255,0.5);
        }
        .agent-input::-moz-placeholder {
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
};

export default AgentChat;