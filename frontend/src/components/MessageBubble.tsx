import React from 'react';
import type { ChatMsg } from '../types';

interface MessageBubbleProps {
  message: ChatMsg;
}

// 时间格式化
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { content, position, timestamp, senderType, card, imageUrl } = message;
  const isUser = position === 'right';
  const isCenter = position === 'center';

  // 渲染图片
  const renderImage = () => {
    if (!imageUrl) return null;
    return (
      <img
        src={imageUrl}
        alt="图片"
        style={{
          maxWidth: '200px',
          borderRadius: '8px',
          marginTop: '8px',
        }}
      />
    );
  };

  // 渲染卡片
  const renderCard = () => {
    if (!card) return null;
    return (
      <div className="message-card">
        <div className="message-card-title">{card.title}</div>
        {card.type === 'order' && (
          <div className="message-card-content">订单号: {card.data.orderNo}</div>
        )}
        {card.type === 'product' && (
          <div className="message-card-content">商品: {card.data.productName}</div>
        )}
      </div>
    );
  };

  if (isCenter) {
    return (
      <div style={{ padding: '8px 0' }}>
        <div className="message-bubble system">{content}</div>
        {timestamp && (
          <div className="message-time" style={{ textAlign: 'center' }}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`message-item ${isUser ? 'user' : ''}`}>
      {/* 头像 */}
      <div className={`message-avatar ${isUser ? 'user' : senderType === 'human' ? 'human' : 'ai'}`}>
        {isUser ? '我' : senderType === 'human' ? '客服' : 'AI'}
      </div>

      {/* 气泡 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
          {content}
          {renderImage()}
          {renderCard()}
        </div>
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;