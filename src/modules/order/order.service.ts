import { Injectable, Logger } from '@nestjs/common';

export interface OrderInfo {
  orderId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  amount: number;
  createdAt: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  // 获取订单状态（Mock）
  async getOrderStatus(orderId: string, phone: string): Promise<OrderInfo> {
    // TODO: 后续对接真实商城 API
    // 返回模拟数据
    this.logger.log(`getOrderStatus called: orderId=${orderId}, phone=${phone}`);
    return {
      orderId,
      status: 'paid',
      amount: 99.0,
      createdAt: new Date().toISOString(),
    };
  }

  // 通过手机号获取订单列表（Mock）
  async getOrdersByPhone(phone: string, limit?: number): Promise<OrderInfo[]> {
    // TODO: 后续对接真实商城 API
    // 返回模拟数据
    this.logger.log(`getOrdersByPhone called: phone=${phone}, limit=${limit}`);
    const mockOrders: OrderInfo[] = [
      {
        orderId: 'ORD001',
        status: 'delivered',
        amount: 199.0,
        createdAt: '2024-03-01T10:00:00Z',
      },
      {
        orderId: 'ORD002',
        status: 'shipped',
        amount: 299.0,
        createdAt: '2024-03-05T14:30:00Z',
      },
      {
        orderId: 'ORD003',
        status: 'paid',
        amount: 99.0,
        createdAt: '2024-03-10T09:15:00Z',
      },
    ];
    return limit ? mockOrders.slice(0, limit) : mockOrders;
  }
}