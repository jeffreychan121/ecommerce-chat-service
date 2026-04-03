import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './LoadingStates';
import { EmptyState } from './EmptyState';
import type { ChatMsg } from '../types';

interface ChatWindowProps {
  messages: ChatMsg[];
  isHandoff: boolean;
  isLoading: boolean;
  onSend: (message: string) => void;
  onHandoff?: () => void;
  onReturnToAI?: () => void;
  title?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isHandoff,
  isLoading,
  onSend,
  onHandoff,
  onReturnToAI,
  title = '智能客服',
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (inputValue.trim() && !isHandoff && !isLoading) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 判断是否显示空状态
  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="chat-window">
      {/* 顶部栏 */}
      <ChatHeader
        title={title}
        isHandoff={isHandoff}
        onHandoff={onHandoff}
        onReturnToAI={onReturnToAI}
      />

      {/* 消息列表区域 */}
      <div className="chat-messages">
        {showEmptyState ? (
          <EmptyState />
        ) : (
          <MessageList
            messages={messages}
          />
        )}

        {/* 加载/输入中状态 */}
        {isLoading && (
          <div className="loading-container">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onKeyPress={handleKeyPress}
        disabled={isHandoff || isLoading}
        placeholder={isHandoff ? '已转接人工，请稍候...' : '请输入消息...'}
      />
    </div>
  );
};

export default ChatWindow;