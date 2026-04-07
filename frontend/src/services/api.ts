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
  timeout: 60000,
});

// ===== 登录相关 =====
export interface LoginResponse {
  userId: string;
  phone: string;
  storeId?: string;
  storeName?: string;
}

// 手机号登录
export async function login(phone: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/api/auth/login', { phone });
  return response.data;
}

// ===== 导购相关 =====

// 商品搜索
export interface ProductItem {
  sku_id: string;
  name: string;
  price: number;
  detail_url: string;
  short_reason: string;
}

export interface SearchProductsResponse {
  items: ProductItem[];
}

export async function searchProducts(query: string, storeId?: string): Promise<SearchProductsResponse> {
  const response = await api.post<SearchProductsResponse>('/api/guide/search-products', {
    query,
    store_id: storeId,
  });
  return response.data;
}

// 创建留资
export async function createLead(data: {
  userPhone: string;
  storeId: string;
  skuId: string;
  skuName: string;
  price: number;
  quantity?: number;
  intent: 'buy' | 'consult' | 'compare';
}): Promise<{ success: boolean; lead_id: string; message: string }> {
  const response = await api.post('/api/guide/create-lead', data);
  return response.data;
}

// ===== 店铺相关 =====
export interface Store {
  id: string;
  name: string;
  storeType: 'SELF' | 'MERCHANT';
  createdAt: string;
  updatedAt: string;
}

// 获取店铺列表
export async function getStores(): Promise<Store[]> {
  const response = await api.get<Store[]>('/api/stores');
  return response.data;
}

// 创建店铺
export async function createStore(name: string, storeType: 'SELF' | 'MERCHANT'): Promise<Store> {
  const response = await api.post<Store>('/api/stores', { name, storeType });
  return response.data;
}

// 删除店铺
export async function deleteStore(id: string): Promise<void> {
  await api.delete(`/api/stores/${id}`);
}

// ===== 会话相关 =====

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

// 更新会话状态
export async function updateSessionStatus(sessionId: string, status: 'OPEN' | 'HANDOFF' | 'CLOSED') {
  const response = await api.patch(`/api/chat/sessions/${sessionId}/status`, { status });
  return response.data;
}

// ===== 订单相关 =====

export interface OrderItem {
  skuId: string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderInfo {
  orderNo: string;
  status: string;
  statusText: string;
  payStatus: string;
  orderAmount: number;
  discountAmount: number;
  actualAmount: number;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedShipTime?: string;
  estimatedDeliveryTime?: string;
  items: OrderItem[];
  shippingAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
}

export interface CreateOrderRequest {
  phone: string;
  items: Array<{ skuId: string; quantity: number; productName?: string; price?: number }>;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
}

// 创建订单
export async function createOrder(data: CreateOrderRequest): Promise<OrderInfo> {
  const response = await api.post<OrderInfo>('/api/orders', data);
  return response.data;
}

// 查询订单
export async function getOrder(orderNo: string): Promise<OrderInfo> {
  const response = await api.get<OrderInfo>(`/api/orders/${orderNo}`);
  return response.data;
}

// 获取订单列表
export async function getOrders(limit: number = 20): Promise<OrderInfo[]> {
  const response = await api.get<OrderInfo[]>('/api/orders', {
    params: { limit },
  });
  return response.data;
}

// ===== 商家知识库相关 =====

// 上传文件
export const uploadTrainingFile = async (storeId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('storeId', storeId);
  return api.post('/api/merchant/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 获取文件列表
export const getTrainingFiles = (storeId: string) =>
  api.get(`/api/merchant/files/${storeId}`);

// 删除文件
export const deleteTrainingFile = (jobId: string) =>
  api.delete(`/api/merchant/files/${jobId}`);

// 训练文件
export const trainFile = (jobId: string) =>
  api.post(`/api/merchant/files/${jobId}/train`);

// 启用文档
export const enableFile = (jobId: string) =>
  api.post(`/api/merchant/files/${jobId}/enable`);

// 禁用文档
export const disableFile = (jobId: string) =>
  api.post(`/api/merchant/files/${jobId}/disable`);

// 训练所有文件
export const trainAllFiles = (storeId: string) =>
  api.post(`/api/merchant/files/${storeId}/train-all`);

// AI 测试聊天
export const chatWithKnowledge = (storeId: string, query: string) =>
  api.post('/api/merchant/chat', { storeId, query });

// 获取店铺知识库状态
export const getStoreStatus = (storeId: string) =>
  api.get(`/api/merchant/status/${storeId}`);

// 创建知识库（支持自定义参数）
export interface CreateDatasetParams {
  name?: string;
  description?: string;
  indexing_technique?: string;
  permission?: string;
  search_method?: string;
  top_k?: number;
  score_threshold_enabled?: boolean;
  score_threshold?: number;
  doc_form?: string;
}

export const createDataset = (storeId: string, params?: CreateDatasetParams) =>
  api.post(`/api/merchant/dataset/${storeId}`, params);

// 删除知识库
export const deleteDataset = (storeId: string) =>
  api.delete(`/api/merchant/dataset/${storeId}`);

export default api;