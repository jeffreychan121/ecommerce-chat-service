import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMsg } from '../types';

interface MessageListProps {
  messages: ChatMsg[];
}

// 判断是否需要显示时间分隔
const shouldShowTimeDivider = (currentMsg: ChatMsg, prevMsg?: ChatMsg): boolean => {
  if (!prevMsg || !currentMsg.timestamp || !prevMsg.timestamp) return false;

  const timeDiff = currentMsg.timestamp - prevMsg.timestamp;
  // 超过5分钟显示时间分隔
  return timeDiff > 5 * 60 * 1000;
};

// 格式化时间分隔
const formatTimeDivider = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() >= today.getTime()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((msg, index) => {
        const prevMsg = index > 0 ? messages[index - 1] : undefined;
        const showTimeDivider = shouldShowTimeDivider(msg, prevMsg);

        return (
          <React.Fragment key={msg.id || index}>
            {showTimeDivider && (
              <div className="time-divider" style={{
                textAlign: 'center',
                margin: '16px 0',
                color: '#999',
                fontSize: '12px',
              }}>
                {formatTimeDivider(msg.timestamp!)}
              </div>
            )}
            <MessageBubble message={msg} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;