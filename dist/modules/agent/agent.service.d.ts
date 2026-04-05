import { OrderService } from '../order/order.service';
export interface AgentRequest {
    system: string;
    action: string;
    params?: Record<string, any>;
    context?: {
        phone?: string;
        store_id?: string;
        [key: string]: any;
    };
}
export interface AgentResult {
    data: any;
    message: string;
}
export declare class AgentService {
    private readonly orderService;
    private readonly logger;
    constructor(orderService: OrderService);
    execute(request: AgentRequest): Promise<AgentResult>;
    private normalizeAction;
    private handleOrder;
    private handleMember;
    private handleProduct;
    private handleAfterSale;
}
