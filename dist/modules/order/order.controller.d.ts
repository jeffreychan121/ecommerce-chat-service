import { OrderService } from './order.service';
import { OrderInfo, LogisticsInfo } from './order.types';
declare class CreateOrderRequest {
    phone: string;
    items: Array<{
        skuId: string;
        quantity: number;
    }>;
    shippingAddress: string;
    receiverName: string;
    receiverPhone: string;
}
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    getOrders(limit?: string): Promise<OrderInfo[]>;
    getOrder(orderNo: string): Promise<OrderInfo>;
    createOrder(dto: CreateOrderRequest): Promise<OrderInfo>;
    getLogistics(orderNo: string): Promise<LogisticsInfo>;
}
export {};
