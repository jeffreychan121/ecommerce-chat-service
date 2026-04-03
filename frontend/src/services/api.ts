import axios from 'axios';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  SessionDetail,
  HandoffResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
});

// 创建或恢复会话
export async function createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
  const response = await api.post<CreateSessionResponse>('/api/chat/sessions', data);
  return response.data;
}

// 获取会话详情
export async function getSession(sessionId: string): Promise<SessionDetail> {
  const response = await api.get<SessionDetail>(`/api/chat/sessions/${sessionId}`);
  return response.data;
}

// 发送消息
export async function sendMessage(sessionId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
  const response = await api.post<SendMessageResponse>(`/api/chat/sessions/${sessionId}/messages`, data);
  return response.data;
}

// 手动转人工
export async function handoff(sessionId: string): Promise<HandoffResponse> {
  const response = await api.post<HandoffResponse>(`/api/chat/sessions/${sessionId}/handoff`);
  return response.data;
}

// 获取历史消息
export async function getMessages(sessionId: string, limit = 50, offset = 0) {
  const response = await api.get(`/api/chat/sessions/${sessionId}/messages`, {
    params: { limit, offset },
  });
  return response.data;
}

export default api;