import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  quickReplies?: string[];
}

// 客户预制快速回复
const CUSTOMER_QUICK_REPLIES = [
  '我要下单',
  '查订单',
  '查物流',
  '转人工',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = '请输入消息...',
  quickReplies = CUSTOMER_QUICK_REPLIES,
}) => {
  const canSend = value.trim().length > 0 && !disabled;

  const handleSendClick = () => {
    if (canSend) {
      onSend();
    }
  };

  const handleQuickReply = (text: string) => {
    onChange(text);
    // 自动发送
    setTimeout(() => onSend(), 100);
  };

  return (
    <div className="chat-input-container">
      {/* 快速回复按钮 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleQuickReply(reply)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              background: disabled ? '#f0f0f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="chat-input-wrapper">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />

        <button
          className="send-button"
          onClick={handleSendClick}
          disabled={!canSend}
        >
          发送
        </button>
      </div>

      <div className="input-tips">
        按 <kbd>Enter</kbd> 发送，<kbd>Shift+Enter</kbd> 换行
      </div>
    </div>
  );
};

export default ChatInput;