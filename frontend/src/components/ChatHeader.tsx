import React, { useState } from 'react';
import type { Store } from '../services/api';

interface ChatHeaderProps {
  title?: string;
  isHandoff: boolean;
  onHandoff?: () => void;
  onReturnToAI?: () => void;
  phone?: string;
  storeId?: string;
  storeName?: string;
  storeType?: 'SELF' | 'MERCHANT';
  stores?: Store[];
  onStoreChange?: (store: Store) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = '商城客服',
  isHandoff,
  onHandoff,
  onReturnToAI,
  storeName,
  storeType,
  stores = [],
  onStoreChange,
}) => {
  const storeTypeLabel = storeType === 'SELF' ? '自营' : '商家';
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const handleStoreSelect = (store: Store) => {
    if (onStoreChange) {
      onStoreChange(store);
    }
    setShowStoreDropdown(false);
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 左侧店铺切换 */}
        {stores.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              <span>🏪</span>
              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storeName || '选择店铺'}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* 下拉菜单 */}
            {showStoreDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                minWidth: '160px',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease',
              }}>
                {stores.map(store => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: store.name === storeName ? 'linear-gradient(135deg, #f0f5ff 0%, #f5f0ff 100%)' : '#fff',
                      border: 'none',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={(e) => {
                      if (store.name !== storeName) {
                        e.currentTarget.style.background = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (store.name !== storeName) {
                        e.currentTarget.style.background = '#fff';
                      }
                    }}
                  >
                    <span>🏪</span>
                    <span style={{ flex: 1, fontSize: '13px', color: '#333' }}>
                      {store.name}
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      background: store.storeType === 'SELF' ? '#52c41a' : '#fa8c16',
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#fff',
                    }}>
                      {store.storeType === 'SELF' ? '自营' : '商家'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
      {storeName && stores.length === 0 && (
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChatHeader;
