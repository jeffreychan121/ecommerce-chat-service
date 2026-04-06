import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderInfo, LogisticsInfo } from './order.types';

class CreateOrderRequest {
  phone: string;
  items: Array<{ skuId: string; quantity: number; productName?: string; price?: number }>;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
}

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 获取订单列表
   * GET /api/orders
   */
  @Get()
  async getOrders(@Query('limit') limit?: string): Promise<OrderInfo[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.orderService.getOrders(parsedLimit);
  }

  /**
   * 查询订单
   * GET /api/orders/:orderNo
   */
  @Get(':orderNo')
  async getOrder(@Param('orderNo') orderNo: string): Promise<OrderInfo> {
    return this.orderService.getOrderStatus(orderNo);
  }

  /**
   * 创建订单
   * POST /api/orders
   */
  @Post()
  async createOrder(@Body() dto: CreateOrderRequest): Promise<OrderInfo> {
    return this.orderService.createOrder({
      phone: dto.phone,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      receiverName: dto.receiverName,
      receiverPhone: dto.receiverPhone,
    });
  }

  /**
   * 查询物流
   * GET /api/orders/:orderNo/logistics
   */
  @Get(':orderNo/logistics')
  async getLogistics(@Param('orderNo') orderNo: string): Promise<LogisticsInfo> {
    return this.orderService.getLogistics(orderNo);
  }
}