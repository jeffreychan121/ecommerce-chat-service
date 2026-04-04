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