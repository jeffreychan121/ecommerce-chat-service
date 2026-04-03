// Dify 输入参数
export class DifyInputs {
  phone: string;
  store_id: string;
  store_type: 'self' | 'merchant';
  channel: string;
  customer_id?: string;
}

// 发送消息 DTO
export class SendMessageDto {
  query: string;
  inputs?: Partial<DifyInputs>;
}

// Dify 流式响应分片
export interface DifyChunk {
  event: string;
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  created_at?: number;
}

// Dify 响应
export interface DifyResponse {
  messageId: string;
  conversationId: string;
  answer: string;
  metadata?: Record<string, any>;
}