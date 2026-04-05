// 导购模块类型定义

// 商品搜索请求
export interface SearchProductsRequest {
  store_id?: string;
  store_type?: 'self' | 'merchant';
  query: string;
  budget_min?: number;
  budget_max?: number;
  scene?: string;
  preference?: string;
}

// 商品项
export interface ProductItem {
  sku_id: string;
  name: string;
  price: number;
  detail_url: string;
  short_reason: string;
}

// 商品搜索响应
export interface SearchProductsResponse {
  items: ProductItem[];
}

// 库存查询请求
export interface CheckStockRequest {
  store_id: string;
  sku_ids: string[];
}

// 库存项
export interface StockItem {
  sku_id: string;
  in_stock: boolean;
  stock_text: string;
}

// 库存查询响应
export interface CheckStockResponse {
  items: StockItem[];
}

// 活动查询请求
export interface CheckPromoRequest {
  store_id: string;
  sku_ids: string[];
}

// 活动项
export interface PromoItem {
  sku_id: string;
  promo_text: string;
  final_price: number;
}

// 活动查询响应
export interface CheckPromoResponse {
  items: PromoItem[];
}

// 留资请求
export interface CreateLeadRequest {
  userPhone: string;
  storeId: string;
  skuId: string;
  skuName: string;
  quantity?: number;
  price: number;
  intent: 'buy' | 'consult' | 'compare';
}

// 留资响应
export interface CreateLeadResponse {
  success: boolean;
  lead_id: string;
  message: string;
}