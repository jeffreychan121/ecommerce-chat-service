import React from 'react';

interface ChatHeaderProps {
  title?: string;
  isHandoff: boolean;
  onHandoff?: () => void;
  onReturnToAI?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = '智能客服',
  isHandoff,
  onHandoff,
  onReturnToAI,
}) => {
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
          {isHandoff ? '👤' : '💬'}
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#333' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: isHandoff ? '#fa8c16' : '#52c41a' }}>
            {isHandoff ? '人工服务中' : '在线'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* 转人工按钮 */}
        {onHandoff && !isHandoff && (
          <button
            onClick={onHandoff}
            style={{
              padding: '6px 14px',
              background: '#fff',
              border: '1px solid #fa8c16',
              color: '#fa8c16',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff7e6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            转人工
          </button>
        )}

        {/* 返回智能客服按钮 */}
        {onReturnToAI && isHandoff && (
          <button
            onClick={onReturnToAI}
            style={{
              padding: '6px 14px',
              background: '#fff',
              border: '1px solid #1677ff',
              color: '#1677ff',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e6f4ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
            }}
          >
            返回AI
          </button>
        )}

        {/* 转人工后显示提示 */}
        {isHandoff && !onReturnToAI && (
          <div style={{ fontSize: '12px', color: '#fa8c16' }}>
            请稍候，正在为您分配客服...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;