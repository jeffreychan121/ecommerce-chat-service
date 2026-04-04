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
    <div className="empty-state">
      <div className="empty-state-icon">💬</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
    </div>
  );
};

export default EmptyState;