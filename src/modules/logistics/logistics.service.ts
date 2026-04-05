import { Injectable, Logger } from '@nestjs/common';
import { LogisticsInfo } from '../order/order.types';
import { OrderService } from '../order/order.service';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(private readonly orderService: OrderService) {}

  /**
   * 获取物流信息（委托给 OrderService）
   */
  async getLogistics(orderNo: string): Promise<LogisticsInfo> {
    this.logger.log(`getLogistics called: orderNo=${orderNo}`);
    return this.orderService.getLogistics(orderNo);
  }
}