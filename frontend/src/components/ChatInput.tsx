import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = '请输入消息...',
}) => {
  const canSend = value.trim().length > 0 && !disabled;

  const handleSendClick = () => {
    if (canSend) {
      onSend();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="chat-input"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e8e8e8',
            borderRadius: '20px',
            outline: 'none',
            fontSize: '14px',
            lineHeight: 1.5,
            resize: 'none',
            fontFamily: 'inherit',
            background: disabled ? '#f5f5f5' : '#fff',
            color: disabled ? '#999' : '#333',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1677ff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e8e8e8';
          }}
        />

        <button
          onClick={handleSendClick}
          disabled={!canSend}
          className="send-button"
          style={{
            padding: '8px 20px',
            background: canSend ? '#1677ff' : '#e8e8e8',
            color: canSend ? '#fff' : '#999',
            border: 'none',
            borderRadius: '20px',
            cursor: canSend ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            marginLeft: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          发送
        </button>
      </div>

      <div className="input-tips" style={{
        padding: '8px 0',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center',
      }}>
        按 <kbd style={{
          padding: '2px 6px',
          background: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '11px',
          margin: '0 2px',
        }}>Enter</kbd> 发送，<kbd style={{
          padding: '2px 6px',
          background: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '11px',
          margin: '0 2px',
        }}>Shift+Enter</kbd> 换行
      </div>
    </div>
  );
};

export default ChatInput;