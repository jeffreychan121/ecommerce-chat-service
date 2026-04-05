import { PrismaService } from '../../infra/database/prisma.service';
import { OrderInfo, LogisticsInfo } from './order.types';
export declare class OrderService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrder(params: {
        phone: string;
        items: Array<{
            skuId: string;
            quantity: number;
        }>;
        shippingAddress: string;
        receiverName: string;
        receiverPhone: string;
    }): Promise<OrderInfo>;
    createOrderFromChat(productName: string, quantity: number): Promise<OrderInfo>;
    getOrderStatus(orderNo: string): Promise<OrderInfo>;
    getOrders(limit?: number): Promise<OrderInfo[]>;
    getLogistics(orderNo: string): Promise<LogisticsInfo>;
    private generateOrderNo;
    private createLogistics;
    private toOrderInfo;
    private getStatusText;
}
