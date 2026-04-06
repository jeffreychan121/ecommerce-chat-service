import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infra/database/prisma.service';
import {
  OrderInfo,
  OrderStatus,
  PayStatus,
  LogisticsInfo,
} from './order.types';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 创建订单
   */
  async createOrder(params: {
    phone: string;
    items: Array<{ skuId: string; quantity: number; productName?: string; price?: number }>;
    shippingAddress: string;
    receiverName: string;
    receiverPhone: string;
  }): Promise<OrderInfo> {
    this.logger.log(`createOrder: phone=${params.phone}, items=${params.items.length}`);

    // 生成订单号
    const orderNo = this.generateOrderNo();

    // 使用传入的商品信息，如果没有则使用随机值
    const firstItem = params.items[0];
    const productName = firstItem?.productName || ['iPhone 15 Pro Max', 'MacBook Pro M3', 'AirPods Pro', 'iPad Pro', 'Apple Watch'][Math.floor(Math.random() * 5)];
    const productPrice = firstItem?.price || Math.floor(Math.random() * 5000) + 500;
    const quantity = firstItem?.quantity || 1;
    const amount = productPrice * quantity;

    // 创建订单
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        status: OrderStatus.PAID, // 直接设为已支付（简化）
        payStatus: PayStatus.PAID,
        amount,
        discountAmount: 0,
        actualAmount: amount,
        quantity,
        productName,
        productPrice,
        shippingAddress: params.shippingAddress || '北京市朝阳区xxx街道',
        receiverName: params.receiverName || '用户',
        receiverPhone: params.receiverPhone || params.phone,
        paidAt: new Date(),
      },
    });

    // 如果已支付，自动创建物流信息
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.TO_BE_SHIPPED) {
      await this.createLogistics(order.id, order.orderNo);
    }

    // 广播订单创建事件（使用完整的订单信息）
    const orderInfo = await this.toOrderInfo(order);
    this.eventEmitter.emit('order.created', orderInfo);

    return await this.toOrderInfo(order);
  }

  /**
   * 从聊天创建订单（用于聊天下单功能）
   */
  async createOrderFromChat(
    productName: string,
    quantity: number,
  ): Promise<OrderInfo> {
    this.logger.log(`createOrderFromChat: productName=${productName}, quantity=${quantity}`);

    // 生成订单号
    const orderNo = this.generateOrderNo();

    // 随机生成单价（10-500元）
    const productPrice = Math.floor(Math.random() * 490) + 10;
    const amount = productPrice * quantity;
    const discountAmount = 0;
    const actualAmount = amount;

    // 创建订单，状态设为 PAID（跳过支付）
    const order = await this.prisma.order.create({
      data: {
        orderNo,
        status: OrderStatus.PAID, // 已支付
        payStatus: PayStatus.PAID,
        amount,
        discountAmount,
        actualAmount,
        quantity,
        productName,
        productPrice,
        paidAt: new Date(),
      },
    });

    // 自动创建物流信息
    await this.createLogistics(order.id, order.orderNo);

    // 广播订单创建事件
    const orderInfo = await this.toOrderInfo(order);
    this.eventEmitter.emit('order.created', orderInfo);

    return await this.toOrderInfo(order);
  }

  /**
   * 获取订单详情
   */
  async getOrderStatus(orderNo: string): Promise<OrderInfo> {
    this.logger.log(`getOrderStatus: orderNo=${orderNo}`);

    const order = await this.prisma.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderNo} 不存在`);
    }

    return await this.toOrderInfo(order);
  }

  /**
   * 获取订单列表
   */
  async getOrders(limit: number = 20): Promise<OrderInfo[]> {
    this.logger.log(`getOrders: limit=${limit}`);

    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(orders.map(order => this.toOrderInfo(order)));
  }

  /**
   * 获取物流信息
   */
  async getLogistics(orderNo: string): Promise<LogisticsInfo> {
    this.logger.log(`getLogistics: orderNo=${orderNo}`);

    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { logistics: { include: { events: true } } },
    });

    if (!order) {
      throw new NotFoundException(`订单 ${orderNo} 不存在`);
    }

    if (!order.logistics) {
      throw new NotFoundException(`订单 ${orderNo} 暂无物流信息`);
    }

    const log = order.logistics;
    return {
      orderNo: log.orderId,
      carrier: log.carrier,
      trackingNo: log.trackingNo,
      status: log.status === 'PENDING' ? 'PENDING' : log.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
      currentLocation: log.currentLocation || '未知',
      estimatedDeliveryTime: log.estimatedDelivery?.toISOString(),
      events: log.events.map(e => ({
        time: e.time.toISOString(),
        location: e.location,
        description: e.description,
      })),
    };
  }

  /**
   * 生成DD开头的订单号
   */
  private generateOrderNo(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DD${timestamp}${random}`;
  }

  /**
   * 创建物流信息
   */
  private async createLogistics(orderId: string, orderNo: string): Promise<void> {
    const carriers = ['顺丰速运', '中通快递', '圆通速递', '韵达快递'];
    const locations = ['广州市白云区', '深圳市南山区', '杭州市西湖区', '上海市浦东新区'];

    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const trackingNo = `SF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const currentLocation = locations[Math.floor(Math.random() * locations.length)];

    await this.prisma.logistics.create({
      data: {
        orderId,
        carrier,
        trackingNo,
        status: 'IN_TRANSIT',
        currentLocation,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        events: {
          create: [
            {
              location: currentLocation,
              description: '已发出，运输中',
            },
            {
              location: '广州市白云区',
              description: '快件已揽收',
            },
          ],
        },
      },
    });
  }

  /**
   * 转换为 OrderInfo（包含物流信息）
   */
  private async toOrderInfo(order: any): Promise<OrderInfo> {
    // 查询物流信息
    const logistics = await this.prisma.logistics.findUnique({
      where: { orderId: order.id },
    });

    return {
      orderNo: order.orderNo,
      status: order.status as OrderStatus,
      statusText: this.getStatusText(order.status),
      payStatus: order.payStatus as PayStatus,
      orderAmount: order.amount,
      discountAmount: order.discountAmount,
      actualAmount: order.actualAmount,
      createdAt: order.createdAt?.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      items: [
        {
          skuId: 'SKU001',
          title: order.productName,
          quantity: order.quantity,
          price: order.productPrice,
        },
      ],
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      logistics: logistics ? {
        carrier: logistics.carrier,
        trackingNo: logistics.trackingNo,
        status: logistics.status,
        currentLocation: logistics.currentLocation,
      } : undefined,
    };
  }

  private getStatusText(status: string): string {
    const texts: Record<string, string> = {
      PENDING: '待支付',
      PAID: '已支付',
      TO_BE_SHIPPED: '待发货',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    };
    return texts[status] || status;
  }
}