// Order 相关类型定义

export enum OrderStatus {
  PENDING = 'PENDING',       // 待支付
  PAID = 'PAID',            // 已支付
  TO_BE_SHIPPED = 'TO_BE_SHIPPED',  // 待发货
  SHIPPED = 'SHIPPED',     // 已发货
  DELIVERED = 'DELIVERED', // 已送达
  CANCELLED = 'CANCELLED', // 已取消
  REFUNDED = 'REFUNDED', // 已退款
}

export enum PayStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
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