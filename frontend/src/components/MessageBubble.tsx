import React from 'react';
import type { ChatMsg } from '../types';
import { formatAssistantMessage, isTableFormat, parseTable, isKeyValueFormat, parseKeyValue } from '../utils/formatMessage';
import { ProductCard } from './ProductCard';

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

// AI消息内容渲染 - 使用格式化工具
const AIMessageContent: React.FC<{ content: string }> = ({ content }) => {
  // 先格式化文本，移除 markdown 残留
  const formattedText = formatAssistantMessage(content);

  // 将内容按段落分割
  const paragraphs = formattedText.split('\n\n').filter(p => p.trim());

  return (
    <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        // 检测表格格式
        if (isTableFormat(para)) {
          const rows = parseTable(para);
          if (rows.length > 0) {
            return (
              <div key={pIdx} style={{ marginBottom: '12px', overflowX: 'auto' }}>
                <table style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  fontSize: '13px',
                  border: '1px solid #dee2e6',
                }}>
                  <thead>
                    {rows.slice(0, 1).map((row, rIdx) => (
                      <tr key={`header-${rIdx}`} style={{ background: '#f8f9fa' }}>
                        {row.map((cell, cIdx) => (
                          <th key={cIdx} style={{
                            padding: '10px 12px',
                            border: '1px solid #dee2e6',
                            color: '#495057',
                            fontWeight: 600,
                            textAlign: 'left',
                          }}>
                            {cell}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {rows.slice(1).map((row, rIdx) => (
                      <tr key={`row-${rIdx}`}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{
                            padding: '8px 12px',
                            border: '1px solid #dee2e6',
                            color: '#333',
                          }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 检测属性-值格式
        if (isKeyValueFormat(para)) {
          const items = parseKeyValue(para);
          if (items.length > 0) {
            return (
              <div key={pIdx} style={{ marginBottom: '8px' }}>
                {items.map((item, iIdx) => (
                  <div key={iIdx} style={{
                    display: 'flex',
                    marginBottom: '2px',
                    padding: '2px 0',
                  }}>
                    <span style={{
                      color: '#666',
                      fontWeight: 500,
                      minWidth: '80px',
                      flexShrink: 0,
                    }}>{item.key}</span>
                    <span style={{ color: '#333', wordBreak: 'break-word' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            );
          }
        }

        // 单行处理
        if (lines.length === 1) {
          const line = lines[0].trim();

          // 标题（无 # 但可能是标题格式）
          if (line.length < 50 && !line.includes(' ') && /^[A-Z\u4E00-\u9FA5]/.test(line)) {
            return (
              <div key={pIdx} style={{
                fontWeight: 600,
                fontSize: '15px',
                color: '#1a1a1a',
                marginBottom: '8px',
                marginTop: pIdx > 0 ? '12px' : '0',
              }}>
                {line}
              </div>
            );
          }

          // 列表项
          if (line.match(/^[-•·◆]\s+/) || line.match(/^\d+[.、]\s+/)) {
            const text = line.replace(/^[-•·◆\d.、]+\s*/, '');
            return (
              <div key={pIdx} style={{
                display: 'flex',
                marginBottom: '4px',
                paddingLeft: '4px',
              }}>
                <span style={{ color: '#667eea', marginRight: '8px', flexShrink: 0 }}>•</span>
                <span style={{ color: '#333' }}>{text}</span>
              </div>
            );
          }

          // 普通段落
          return (
            <div key={pIdx} style={{ color: '#333', marginBottom: '8px' }}>
              {line}
            </div>
          );
        }

        // 多行普通文本
        return (
          <div key={pIdx} style={{ marginBottom: '8px' }}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={lIdx} />;

              // 列表
              if (trimmed.match(/^[-•·◆]\s+/) || trimmed.match(/^\d+[.、]\s+/)) {
                const text = trimmed.replace(/^[-•·◆\d.、]+\s*/, '');
                return (
                  <div key={lIdx} style={{ display: 'flex', marginBottom: '2px', paddingLeft: '4px' }}>
                    <span style={{ color: '#667eea', marginRight: '8px', flexShrink: 0 }}>•</span>
                    <span style={{ color: '#333' }}>{text}</span>
                  </div>
                );
              }

              return (
                <div key={lIdx} style={{ color: '#333', marginBottom: '2px' }}>
                  {trimmed}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
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

    // 商品卡片
    if (card.type === 'product' && card.products) {
      return (
        <ProductCard products={card.products} />
      );
    }

    // 其他卡片（订单、物流等）- 简化显示
    return (
      <div className="message-card" style={{
        marginTop: '8px',
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '8px',
      }}>
        {card.title && (
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {card.title}
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#666' }}>
          {card.type === 'order' && `订单号: ${card.data?.orderNo}`}
          {card.type === 'logistics' && `物流: ${card.data?.trackingNo}`}
          {card.type === 'product' && `商品: ${card.data?.productName}`}
        </div>
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
          {isUser ? content : <AIMessageContent content={content} />}
          {renderImage()}
          {renderCard()}
        </div>
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;