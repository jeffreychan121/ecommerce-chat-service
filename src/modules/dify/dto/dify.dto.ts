// Dify 输入参数
// 注意：这些参数会在每次调用 Dify Chatflow 时传递
// Dify Chatflow 内部会维护 cv_budget, cv_scene, cv_preference, cv_last_products 等会话变量
export class DifyInputs {
  phone: string;           // 用户手机号
  store_id: string;       // 店铺ID
  store_type: 'self' | 'merchant';  // 店铺类型
  channel: string;        // 渠道（H5/小程序/APP）
  customer_id?: string;  // 客户ID（可选）
  // === 导购相关参数（可选，由 Dify 维护）===
  // cv_budget?: string;    // 预算
  // cv_scene?: string;     // 场景（送礼/自用/办公等）
  // cv_preference?: string; // 偏好
  dataset_id?: string;    // 知识库ID，用于商家知识库测试
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