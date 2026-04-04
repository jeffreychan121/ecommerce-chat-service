import React from 'react';

// 正在输入指示器
export const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
      <span style={{ fontSize: '13px', color: '#8c8c8c', marginLeft: '8px' }}>
        AI 正在回复...
      </span>
    </div>
  );
};

export default TypingIndicator;