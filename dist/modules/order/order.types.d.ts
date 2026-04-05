export declare enum OrderStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    TO_BE_SHIPPED = "TO_BE_SHIPPED",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum PayStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    REFUNDED = "REFUNDED"
}
export interface OrderItem {
    skuId: string;
    title: string;
    quantity: number;
    price: number;
    image?: string;
}
export interface OrderInfo {
    orderNo: string;
    status: OrderStatus;
    statusText: string;
    payStatus: PayStatus;
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
    logistics?: {
        carrier: string;
        trackingNo: string;
        status: string;
        currentLocation?: string;
    };
}
export interface LogisticsInfo {
    orderNo: string;
    carrier: string;
    trackingNo: string;
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
    currentLocation: string;
    estimatedDeliveryTime?: string;
    events: Array<{
        time: string;
        location: string;
        description: string;
    }>;
}
