import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderInfo,
  OrderStatus,
  PayStatus,
  OrderItem,
  LogisticsInfo,
} from './order.types';

// ============= DTO 类型 =============

/** 订单查询响应 */
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

/** 物流查询响应 */
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

/** 商城 API 错误 */
export class MallApiException extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'MallApiException';
  }
}

@Injectable()
export class MallApiService {
  private readonly logger = new Logger(MallApiService.name);

  // 商城 API 配置
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly appSecret: string;
  private readonly useMock: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiBaseUrl = this.config.get<string>('') || '';
    this.apiKey = this.config.get<string>('') || '';
    this.appSecret = this.config.get<string>('') || '';

    // 默认使用 Mock 数据，可通过环境变量切换
    this.useMock = process.env.MALL_API_MOCK !== 'false';
    this.logger.log(`MallApiService initialized, useMock: ${this.useMock}`);
  }

  // ============= 订单 API =============

  /**
   * 查询订单状态
   * @param orderNo 订单号
   * @param phone 用户手机号（可选，用于验证）
   */
  async getOrder(orderNo: string, phone?: string): Promise<OrderInfo> {
    this.logger.log(`getOrder: orderNo=${orderNo}, phone=${phone}, useMock=${this.useMock}`);

    if (this.useMock) {
      return this.getMockOrder(orderNo);
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/order/detail?orderNo=${orderNo}`,
        {
          method: 'GET',
          headers: this.getHeaders(phone),
        },
      );

      if (!response.ok) {
        throw new MallApiException(
          `订单查询失败: ${response.statusText}`,
          'ORDER_NOT_FOUND',
          response.status,
        );
      }

      const data = await response.json();
      return this.mapMallOrderResponse(data);
    } catch (error) {
      this.logger.error(`getOrder error: ${error.message}`);
      throw new MallApiException(
        error.message || '订单查询失败',
        'ORDER_QUERY_ERROR',
        500,
      );
    }
  }

  /**
   * 创建订单
   */
  async createOrder(params: {
    phone: string;
    items: Array<{ skuId: string; quantity: number }>;
    shippingAddress: string;
    receiverName: string;
    receiverPhone: string;
  }): Promise<OrderInfo> {
    this.logger.log(`createOrder: phone=${params.phone}, items=${params.items.length}, useMock=${this.useMock}`);

    if (this.useMock) {
      const newOrderNo = this.generateOrderNo();
      return this.getMockOrder(newOrderNo);
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/order/create`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(params.phone),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new MallApiException(
          `创建订单失败: ${response.statusText}`,
          'ORDER_CREATE_FAILED',
          response.status,
        );
      }

      const data = await response.json();
      return this.mapMallOrderResponse(data);
    } catch (error) {
      this.logger.error(`createOrder error: ${error.message}`);
      throw new MallApiException(
        error.message || '创建订单失败',
        'ORDER_CREATE_ERROR',
        500,
      );
    }
  }

  // ============= 物流 API =============

  /**
   * 查询物流信息
   */
  async getLogistics(orderNo: string): Promise<LogisticsInfo> {
    this.logger.log(`getLogistics: orderNo=${orderNo}, useMock=${this.useMock}`);

    if (this.useMock) {
      return this.getMockLogistics(orderNo);
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/logistics/detail?orderNo=${orderNo}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        throw new MallApiException(
          `物流查询失败: ${response.statusText}`,
          'LOGISTICS_NOT_FOUND',
          response.status,
        );
      }

      const data = await response.json();
      return this.mapMallLogisticsResponse(data);
    } catch (error) {
      this.logger.error(`getLogistics error: ${error.message}`);
      throw new MallApiException(
        error.message || '物流查询失败',
        'LOGISTICS_QUERY_ERROR',
        500,
      );
    }
  }

  // ============= 内部方法 =============

  /** 获取请求头 */
  private getHeaders(phone?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    if (phone) {
      headers['X-User-Phone'] = phone;
    }

    return headers;
  }

  /** 映射商城订单响应到内部类型 */
  private mapMallOrderResponse(data: MallOrderResponse): OrderInfo {
    return {
      orderNo: data.orderNo,
      status: this.mapOrderStatus(data.status),
      statusText: data.statusText,
      payStatus: this.mapPayStatus(data.payStatus),
      orderAmount: data.amount,
      discountAmount: data.discount || 0,
      actualAmount: data.actualAmount,
      createdAt: data.createdAt,
      paidAt: data.paidAt,
      shippedAt: data.shippedAt,
      deliveredAt: data.deliveredAt,
      estimatedShipTime: data.estimatedShipTime,
      estimatedDeliveryTime: data.estimatedDeliveryTime,
      items: data.items as OrderItem[],
      shippingAddress: data.shippingAddress,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
    };
  }

  /** 映射商城物流响应到内部类型 */
  private mapMallLogisticsResponse(data: MallLogisticsResponse): LogisticsInfo {
    return {
      orderNo: data.orderNo,
      carrier: data.carrier,
      trackingNo: data.trackingNo,
      status: this.mapLogisticsStatus(data.status),
      currentLocation: data.currentLocation,
      estimatedDeliveryTime: data.estimatedDeliveryTime,
      events: data.events,
    };
  }

  private mapOrderStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      PENDING: OrderStatus.PENDING,
      PAID: OrderStatus.PAID,
      TO_BE_SHIPPED: OrderStatus.TO_BE_SHIPPED,
      SHIPPED: OrderStatus.SHIPPED,
      DELIVERED: OrderStatus.DELIVERED,
      CANCELLED: OrderStatus.CANCELLED,
    };
    return mapping[status] || OrderStatus.PENDING;
  }

  private mapPayStatus(status: string): PayStatus {
    const mapping: Record<string, PayStatus> = {
      UNPAID: PayStatus.UNPAID,
      PAID: PayStatus.PAID,
      REFUNDED: PayStatus.REFUNDED,
    };
    return mapping[status] || PayStatus.UNPAID;
  }

  private mapLogisticsStatus(status: string): 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' {
    const mapping: Record<string, 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'> = {
      PENDING: 'PENDING',
      IN_TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
    };
    return mapping[status] || 'PENDING';
  }

  // ============= Mock 数据 =============

  private generateOrderNo(): string {
    // 生成以DD开头的订单号
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DD${timestamp}${random}`;
  }

  private getMockOrder(orderNo: string): OrderInfo {
    // 生成基于订单号的确定性状态
    const hash = orderNo.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.TO_BE_SHIPPED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const status = statuses[hash % statuses.length];

    return {
      orderNo,
      status,
      statusText: this.getStatusText(status),
      payStatus: status === OrderStatus.PENDING ? PayStatus.UNPAID : PayStatus.PAID,
      orderAmount: 99 + (hash % 10) * 100,
      discountAmount: hash % 5 * 10,
      actualAmount: 99 + (hash % 10) * 100,
      createdAt: new Date(Date.now() - hash * 3600000).toISOString(),
      paidAt: status !== OrderStatus.PENDING ? new Date(Date.now() - hash * 3600000 + 300000).toISOString() : undefined,
      estimatedShipTime: status === OrderStatus.TO_BE_SHIPPED ? new Date(Date.now() + 86400000).toISOString() : undefined,
      items: [
        {
          skuId: `SKU${hash % 1000}`,
          title: `商品 ${hash % 100}`,
          quantity: 1 + (hash % 3),
          price: 99 + (hash % 10) * 100,
        },
      ],
      shippingAddress: '北京市朝阳区xxx街道xxx小区1号楼101室',
      receiverName: '张三',
      receiverPhone: '138****8888',
    };
  }

  private getMockLogistics(orderNo: string): LogisticsInfo {
    const hash = orderNo.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const isDelivered = hash % 3 === 0;

    return {
      orderNo,
      carrier: ['顺丰速运', '中通快递', '圆通速递'][hash % 3],
      trackingNo: `SF${orderNo}000`,
      status: isDelivered ? 'DELIVERED' : 'IN_TRANSIT',
      currentLocation: isDelivered ? '已送达' : ['上海市青浦区', '杭州市西湖区', '广州市天河区'][hash % 3],
      estimatedDeliveryTime: isDelivered ? undefined : new Date(Date.now() + 86400000).toISOString(),
      events: [
        {
          time: new Date().toISOString(),
          location: isDelivered ? '广州市天河区' : '物流公司',
          description: isDelivered ? '已签收' : '运输中',
        },
      ],
    };
  }

  private getStatusText(status: OrderStatus): string {
    const texts: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '待支付',
      [OrderStatus.PAID]: '已支付',
      [OrderStatus.TO_BE_SHIPPED]: '待发货',
      [OrderStatus.SHIPPED]: '已发货',
      [OrderStatus.DELIVERED]: '已送达',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDED]: '已退款',
    };
    return texts[status];
  }
}