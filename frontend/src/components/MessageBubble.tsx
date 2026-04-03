import React from 'react';
import type { ChatMsg, MessagePosition } from '../types';

interface MessageBubbleProps {
  message: ChatMsg;
}

// 根据发送者类型获取样式
const getBubbleStyle = (position: MessagePosition): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: 1.6,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  };

  if (position === 'center') {
    return {
      ...baseStyle,
      background: '#fff7e6',
      color: '#fa8c16',
      textAlign: 'center',
      fontSize: '13px',
    };
  }

  const isUser = position === 'right';
  return {
    ...baseStyle,
    background: isUser ? '#1677ff' : '#f5f5f5',
    color: isUser ? '#fff' : '#333',
    borderBottomRightRadius: isUser ? '4px' : '12px',
    borderBottomLeftRadius: isUser ? '12px' : '4px',
  };
};

// 获取头像
const getAvatar = (position: MessagePosition, senderType?: string): React.ReactNode => {
  if (position === 'center') return null;

  const avatarSize = 32;
  const isUser = position === 'right';

  // 头像容器
  return (
    <div
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        background: isUser ? '#1677ff' : '#52c41a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {isUser ? '我' : (senderType === 'human' ? '客服' : 'AI')}
    </div>
  );
};

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
  const { content, position, timestamp, senderType, card } = message;
  const isUser = position === 'right';
  const isCenter = position === 'center';

  // 预留：卡片渲染
  const renderCard = () => {
    if (!card) return null;

    return (
      <div
        style={{
          marginTop: '8px',
          padding: '12px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{card.title}</div>
        {/* 根据卡片类型渲染不同内容 */}
        {card.type === 'order' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            订单号: {card.data.orderNo}
          </div>
        )}
        {card.type === 'product' && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            商品: {card.data.productName}
          </div>
        )}
      </div>
    );
  };

  // 预留：图片渲染
  const renderImage = () => {
    if (!message.imageUrl) return null;
    return (
      <img
        src={message.imageUrl}
        alt="图片"
        style={{
          maxWidth: '200px',
          borderRadius: '8px',
          marginTop: '8px',
        }}
      />
    );
  };

  if (isCenter) {
    return (
      <div className="message-center" style={{ padding: '8px 0' }}>
        <div style={getBubbleStyle(position)}>
          {content}
        </div>
        {timestamp && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'center' }}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`message-item message-${position}`}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        marginBottom: '12px',
        gap: '8px',
      }}
    >
      {!isUser && getAvatar(position, senderType)}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={getBubbleStyle(position)}>
          {content}
          {renderImage()}
          {renderCard()}
        </div>
        {timestamp && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
      {isUser && getAvatar(position, senderType)}
    </div>
  );
};

export default MessageBubble;