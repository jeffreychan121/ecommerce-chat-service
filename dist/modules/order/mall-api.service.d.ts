import { ConfigService } from '@nestjs/config';
import { OrderInfo, LogisticsInfo } from './order.types';
export interface MallOrderResponse {
    orderNo: string;
    status: string;
    statusText: string;
    payStatus: string;
    amount: number;
    discount: number;
    actualAmount: number;
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedShipTime?: string;
    estimatedDeliveryTime?: string;
    items: Array<{
        skuId: string;
        title: string;
        quantity: number;
        price: number;
        image?: string;
    }>;
    shippingAddress?: string;
    receiverName?: string;
    receiverPhone?: string;
}
export interface MallLogisticsResponse {
    orderNo: string;
    carrier: string;
    trackingNo: string;
    status: string;
    currentLocation: string;
    estimatedDeliveryTime?: string;
    events: Array<{
        time: string;
        location: string;
        description: string;
    }>;
}
export declare class MallApiException extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class MallApiService {
    private readonly config;
    private readonly logger;
    private readonly apiBaseUrl;
    private readonly apiKey;
    private readonly appSecret;
    private readonly useMock;
    constructor(config: ConfigService);
    getOrder(orderNo: string, phone?: string): Promise<OrderInfo>;
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
    getLogistics(orderNo: string): Promise<LogisticsInfo>;
    private getHeaders;
    private mapMallOrderResponse;
    private mapMallLogisticsResponse;
    private mapOrderStatus;
    private mapPayStatus;
    private mapLogisticsStatus;
    private generateOrderNo;
    private getMockOrder;
    private getMockLogistics;
    private getStatusText;
}
