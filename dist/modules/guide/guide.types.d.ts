export interface SearchProductsRequest {
    store_id?: string;
    store_type?: 'self' | 'merchant';
    query: string;
    budget_min?: number;
    budget_max?: number;
    scene?: string;
    preference?: string;
}
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
export interface CheckStockRequest {
    store_id: string;
    sku_ids: string[];
}
export interface StockItem {
    sku_id: string;
    in_stock: boolean;
    stock_text: string;
}
export interface CheckStockResponse {
    items: StockItem[];
}
export interface CheckPromoRequest {
    store_id: string;
    sku_ids: string[];
}
export interface PromoItem {
    sku_id: string;
    promo_text: string;
    final_price: number;
}
export interface CheckPromoResponse {
    items: PromoItem[];
}
export interface CreateLeadRequest {
    userPhone: string;
    storeId: string;
    skuId: string;
    skuName: string;
    quantity?: number;
    price: number;
    intent: 'buy' | 'consult' | 'compare';
}
export interface CreateLeadResponse {
    success: boolean;
    lead_id: string;
    message: string;
}
