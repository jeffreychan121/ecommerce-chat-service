// 消息位置
export type MessagePosition = 'left' | 'right' | 'center';

// 消息类型
export type MessageType = 'text' | 'image' | 'card' | 'system' | 'loading';

// 消息发送者类型
export type SenderType = 'user' | 'ai' | 'human' | 'system';

// 聊天消息
export interface ChatMsg {
  id?: string;
  type: string;
  content: string;
  position: MessagePosition;
  senderType?: SenderType;
  timestamp?: number;
  messageType?: MessageType;
  // 卡片数据
  card?: {
    type: 'order' | 'product' | 'logistics' | 'coupon';
    title?: string;
    data?: Record<string, any>;
    products?: Array<{
      sku_id: string;
      name: string;
      price: number;
      short_reason: string;
    }>;
  };
  // 图片
  imageUrl?: string;
}

// 会话状态
export type SessionStatus = 'OPEN' | 'HANDOFF' | 'CLOSED';

// 店铺类型
export type StoreType = 'SELF' | 'MERCHANT';

// 创建会话请求
export interface CreateSessionRequest {
  phone: string;
  storeId: string;
  storeType: StoreType;
  channel: string;
  customerId?: string;
}

// 创建会话响应
export interface CreateSessionResponse {
  sessionId: string;
  status: SessionStatus;
  isNew: boolean;
  difyConversationId: string | null;
}

// 发送消息请求
export interface SendMessageRequest {
  message: string;
  inputs?: {
    phone: string;
    store_id: string;
    store_type: string;
    channel: string;
    customer_id?: string;
  };
}

// 发送消息响应
export interface SendMessageResponse {
  messageId?: string;
  answer?: string;
  message?: string;
  conversationId?: string;
  type?: 'ai' | 'handoff';
  queueNo?: number;
  ticketId?: string;
}

// 转人工响应
export interface HandoffResponse {
  success: boolean;
  message: string;
  queueNo: number;
  ticketId: string;
}

// 会话详情
export interface SessionDetail {
  id: string;
  userId: string;
  storeId: string;
  storeType: StoreType;
  channel: string;
  difyConversationId: string | null;
  status: SessionStatus;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}
