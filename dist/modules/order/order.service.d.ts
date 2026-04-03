export interface OrderInfo {
    orderId: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    amount: number;
    createdAt: string;
}
export declare class OrderService {
    private readonly logger;
    getOrderStatus(orderId: string, phone: string): Promise<OrderInfo>;
    getOrdersByPhone(phone: string, limit?: number): Promise<OrderInfo[]>;
}
