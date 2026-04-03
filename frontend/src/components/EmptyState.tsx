import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无消息',
  description = '开始与客服对话吧',
}) => {
  return (
    <div
      className="empty-state"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#999',
      }}
    >
      {/* 客服图标 */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          marginBottom: '16px',
        }}
      >
        💬
      </div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#666',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#999' }}>
        {description}
      </div>
    </div>
  );
};

export default EmptyState;