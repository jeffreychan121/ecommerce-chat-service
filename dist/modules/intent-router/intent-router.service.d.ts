export declare enum BusinessIntent {
    ORDER_STATUS_QUERY = "order_status_query",
    LOGISTICS_QUERY = "logistics_query",
    ORDER_CREATE = "order_create",
    GENERAL_AI_QUERY = "general_ai_query"
}
export interface IntentResult {
    intent: BusinessIntent;
    orderNo?: string;
    productName?: string;
    quantity?: number;
    confidence: number;
    needMoreInfo: boolean;
    promptForInfo?: string;
}
export declare class IntentRouterService {
    private readonly logger;
    private readonly ORDER_KEYWORDS;
    private readonly LOGISTICS_KEYWORDS;
    private readonly ORDER_CREATE_KEYWORDS;
    private readonly ORDER_CREATE_PATTERNS;
    private readonly ORDER_NO_PATTERN;
    route(message: string): IntentResult;
    extractOrderNo(message: string): string | undefined;
    private matchKeywords;
    private matchOrderCreate;
}
