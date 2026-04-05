import { Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';

export interface AgentRequest {
  system: string;   // order / member / product / after-sale
  action: string;  // query / logistics / create / cancel / ...
  params?: Record<string, any>;
  context?: {
    phone?: string;
    store_id?: string;
    [key: string]: any;
  };
}

export interface AgentResult {
  data: any;
  message: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly orderService: OrderService) {}

  async execute(request: AgentRequest): Promise<AgentResult> {
    const { system, action, params, context } = request;

    this.logger.log(`Executing: system=${system}, action=${action}`);

    // 转换 Dify 的 intent 到后端 action
    const normalizedAction = this.normalizeAction(action);

    switch (system) {
      case 'order':
        return this.handleOrder(normalizedAction, params, context);
      case 'member':
        return this.handleMember(normalizedAction, params, context);
      case 'product':
        return this.handleProduct(normalizedAction, params, context);
      case 'after-sale':
        return this.handleAfterSale(normalizedAction, params, context);
      default:
        throw new Error(`未知业务系统: ${system}`);
    }
  }

  /**
   * 把 Dify 的 intent 映射到后端 action
   * order_status -> query
   * logistics -> logistics
   */
  private normalizeAction(action: string): string {
    const actionMap: Record<string, string> = {
      'order_status': 'query',
      'logistics': 'logistics',
    };
    return actionMap[action] || action;
  }

  private async handleOrder(action: string, params: any, context: any): Promise<AgentResult> {
    switch (action) {
      case 'query':
        if (!params?.order_no) {
          throw new Error('缺少订单号参数');
        }
        const order = await this.orderService.getOrderStatus(params.order_no);
        return { data: order, message: '查询成功' };

      case 'logistics':
        if (!params?.order_no) {
          throw new Error('缺少订单号参数');
        }
        const logistics = await this.orderService.getLogistics(params.order_no);
        return { data: logistics, message: '查询成功' };

      case 'create':
        if (!params?.items || !params?.items.length) {
          throw new Error('缺少商品信息');
        }
        const newOrder = await this.orderService.createOrder({
          phone: context?.phone || params.phone,
          items: params.items,
          shippingAddress: params.shipping_address,
          receiverName: params.receiver_name,
          receiverPhone: params.receiver_phone,
        });
        return { data: newOrder, message: '创建成功' };

      case 'cancel':
        // TODO: 实现取消订单
        return { data: null, message: '取消订单功能开发中' };

      default:
        throw new Error(`未知订单操作: ${action}`);
    }
  }

  private async handleMember(action: string, params: any, context: any): Promise<AgentResult> {
    // TODO: 实现会员服务
    switch (action) {
      case 'points':
        return { data: { points: 0 }, message: '积分查询功能开发中' };
      case 'coupons':
        return { data: { coupons: [] }, message: '优惠券查询功能开发中' };
      default:
        throw new Error(`未知会员操作: ${action}`);
    }
  }

  private async handleProduct(action: string, params: any, context: any): Promise<AgentResult> {
    // TODO: 实现商品服务
    throw new Error(`商品服务开发中`);
  }

  private async handleAfterSale(action: string, params: any, context: any): Promise<AgentResult> {
    // TODO: 实现售后服务
    throw new Error(`售后服务开发中`);
  }
}