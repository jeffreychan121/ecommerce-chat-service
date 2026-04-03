import { Injectable, Logger } from '@nestjs/common';

export interface LogisticsInfo {
  orderId: string;
  carrier: string;
  trackingNo: string;
  status: 'pending' | 'in_transit' | 'delivered';
  events: Array<{ time: string; location: string; description: string }>;
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  // 获取物流信息（Mock）
  async getLogistics(orderId: string): Promise<LogisticsInfo> {
    // TODO: 后续对接真实物流 API
    // 返回模拟数据
    this.logger.log(`getLogistics called: orderId=${orderId}`);
    return {
      orderId,
      carrier: '顺丰速运',
      trackingNo: 'SF1234567890',
      status: 'in_transit',
      events: [
        {
          time: '2024-03-06T10:00:00Z',
          location: '上海分拨中心',
          description: '快件已发往目的地',
        },
        {
          time: '2024-03-05T18:30:00Z',
          location: '上海浦东新区',
          description: '快件已到达上海浦东新区',
        },
        {
          time: '2024-03-05T14:00:00Z',
          location: '杭州转运中心',
          description: '快件已发出',
        },
      ],
    };
  }
}