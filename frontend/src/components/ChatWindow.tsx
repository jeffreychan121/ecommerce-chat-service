import React, { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './LoadingStates';
import { EmptyState } from './EmptyState';
import type { ChatMsg } from '../types';
import type { Store } from '../services/api';

interface ChatWindowProps {
  messages: ChatMsg[];
  isHandoff: boolean;
  isLoading: boolean;
  onSend: (message: string) => void;
  onHandoff?: () => void;
  onReturnToAI?: () => void;
  title?: string;
  phone?: string;
  storeId?: string;
  storeName?: string;
  storeType?: 'SELF' | 'MERCHANT';
  stores?: Store[];
  onStoreChange?: (store: Store) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isHandoff,
  isLoading,
  onSend,
  onHandoff,
  onReturnToAI,
  title = '智能客服',
  phone,
  storeId,
  storeName,
  storeType,
  stores = [],
  onStoreChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    // 转人工后也可以发送消息（发送给人工客服）
    if (inputValue.trim() && !isLoading) {
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
        phone={phone}
        storeId={storeId}
        storeName={storeName}
        storeType={storeType}
        stores={stores}
        onStoreChange={onStoreChange}
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
        disabled={isLoading}
        placeholder={isHandoff ? '正在与人工客服对话中...' : '请输入消息...'}
      />
    </div>
  );
};

export default ChatWindow;