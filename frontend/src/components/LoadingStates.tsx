import React from 'react';

// 加载指示器
export const LoadingIndicator: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        color: '#999',
        fontSize: '13px',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          border: '2px solid #e8e8e8',
          borderTopColor: '#1677ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span>加载中...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// 正在输入指示器
export const TypingIndicator: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              background: '#1677ff',
              borderRadius: '50%',
              animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '13px', color: '#999', marginLeft: '8px' }}>
        AI 正在回复...
      </span>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default { LoadingIndicator, TypingIndicator };