export declare class SearchProductsDto {
    store_id?: string;
    store_type?: 'self' | 'merchant';
    query: string;
    budget_min?: number;
    budget_max?: number;
    scene?: string;
    preference?: string;
}
