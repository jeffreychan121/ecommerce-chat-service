import React from 'react';

interface ChatHeaderProps {
  title?: string;
  isHandoff: boolean;
  onHandoff?: () => void;
  onReturnToAI?: () => void;
  phone?: string;
  storeId?: string;
  storeName?: string;
  storeType?: 'SELF' | 'MERCHANT';
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = '商城客服',
  isHandoff,
  onHandoff,
  onReturnToAI,
  storeName,
  storeType,
}) => {
  const storeTypeLabel = storeType === 'SELF' ? '自营' : '商家';

  return (
    <div
      className="chat-header"
      style={{
        padding: '14px 16px',
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 客服图标 */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isHandoff ? '#fa8c16' : '#1677ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
          }}
        >
          {isHandoff ? '👤' : '🤖'}
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#333' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: isHandoff ? '#fa8c16' : '#1677ff' }}>
            {isHandoff ? '人工服务' : 'AI服务'}
          </div>
        </div>
      </div>

      {/* 店铺信息 */}
      {storeName && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'linear-gradient(135deg, #f0f5ff 0%, #f5f0ff 100%)',
          borderRadius: '16px',
          fontSize: '13px',
        }}>
          <span style={{ color: '#667eea', fontWeight: 500 }}>🏪 {storeName}</span>
          {storeType && (
            <span style={{
              padding: '2px 6px',
              background: storeType === 'SELF' ? '#52c41a' : '#fa8c16',
              borderRadius: '8px',
              fontSize: '10px',
              color: '#fff',
            }}>
              {storeTypeLabel}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* 转人工按钮 */}
        {onHandoff && !isHandoff && (
          <button
            onClick={onHandoff}
            style={{
              padding: '6px 12px',
              border: '1px solid #1677ff',
              borderRadius: '4px',
              background: '#fff',
              color: '#1677ff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            转人工
          </button>
        )}

        {/* 返回AI按钮 */}
        {onReturnToAI && isHandoff && (
          <button
            onClick={onReturnToAI}
            style={{
              padding: '6px 12px',
              border: '1px solid #52c41a',
              borderRadius: '4px',
              background: '#fff',
              color: '#52c41a',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            返回AI
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;