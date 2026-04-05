import { Injectable, Logger } from '@nestjs/common';

export enum BusinessIntent {
  ORDER_STATUS_QUERY = 'order_status_query',
  LOGISTICS_QUERY = 'logistics_query',
  GENERAL_AI_QUERY = 'general_ai_query',
}

export interface IntentResult {
  intent: BusinessIntent;
  orderNo?: string; // 从消息中提取的订单号
  confidence: number; // 置信度 0-1
  needMoreInfo: boolean; // 是否需要补充更多信息
  promptForInfo?: string; // 需要补充什么信息
}

@Injectable()
export class IntentRouterService {
  private readonly logger = new Logger(IntentRouterService.name);

  // 订单状态查询关键词
  private readonly ORDER_KEYWORDS = [
    '订单', '订单号', '订单状态', '发货', '什么时候发货',
    '已下单', '下单', '待发货', '待收货', '已发货',
    '付款', '支付', '取消订单', '订单取消', '查询', '查一下', '多少钱'
  ];

  // 物流查询关键词
  private readonly LOGISTICS_KEYWORDS = [
    '物流', '快递', '配送', '送到', '运送', '运输',
    '到哪了', '到哪里', '快递到', '发货了吗', '发货了没',
    '何时送达', '什么时候到', '轨迹', '运单', '单号'
  ];

  // 订单号匹配模式 - 支持多种格式
  // 例如: 订单123456, 订单号123456, ORD123456, 123456
  private readonly ORDER_NO_PATTERN = /(?:订单[号]?|#|ORD|DD)(\d{6,20})/gi;

  /**
   * 路由用户消息到对应的业务意图
   */
  route(message: string): IntentResult {
    const normalizedMessage = message.trim();

    this.logger.log(`Routing message: ${normalizedMessage}`);

    // 1. 首先尝试提取订单号（最优先）
    const extractedOrderNo = this.extractOrderNo(normalizedMessage);
    this.logger.log(`Extracted orderNo: ${extractedOrderNo}`);

    // 2. 检查是否匹配订单状态查询关键词
    const orderMatchScore = this.matchKeywords(normalizedMessage, this.ORDER_KEYWORDS);
    if (orderMatchScore > 0) {
      const needMoreInfo = !extractedOrderNo;
      return {
        intent: BusinessIntent.ORDER_STATUS_QUERY,
        orderNo: extractedOrderNo,
        confidence: orderMatchScore,
        needMoreInfo,
        promptForInfo: needMoreInfo ? '请提供您的订单号，以便我为您查询订单状态' : undefined,
      };
    }

    // 3. 检查是否匹配物流查询
    const logisticsMatchScore = this.matchKeywords(normalizedMessage, this.LOGISTICS_KEYWORDS);
    if (logisticsMatchScore > 0 || extractedOrderNo) {
      // 有物流关键词 OR 有订单号（可能是物流查询）
      const needMoreInfo = !extractedOrderNo;
      return {
        intent: BusinessIntent.LOGISTICS_QUERY,
        orderNo: extractedOrderNo,
        confidence: logisticsMatchScore > 0 ? logisticsMatchScore : 0.8,
        needMoreInfo,
        promptForInfo: needMoreInfo ? '请提供您的订单号或快递单号，以便我为您查询物流信息' : undefined,
      };
    }

    // 4. 默认走 AI 对话
    return {
      intent: BusinessIntent.GENERAL_AI_QUERY,
      confidence: 0.5,
      needMoreInfo: false,
    };
  }

  /**
   * 从消息中提取订单号
   */
  extractOrderNo(message: string): string | undefined {
    message = message.trim();

    // 1. 尝试匹配 DD/ORD 开头 + 纯数字格式（优先）例如: DD85326802390, DD123456789
    const ddMatch = message.match(/^(DD|ORD)(\d{6,20})$/i);
    if (ddMatch) {
      return ddMatch[1].toUpperCase() + ddMatch[2];
    }

    // 2. 尝试匹配带有前缀的格式，支持：
    // - 订单、订单号、订单状态、查订单、查询订单、订单查询、# + DD + 数字
    // - 订单、订单号、订单状态、查订单、查询订单、订单查询、# + 数字（不带DD）
    const patterns = [
      /(?:订单[号]?|订单状态|查订单|查询订单|订单查询|#)\s*([Dd][Dd]?)(\d{6,20})/i,  // 带DD前缀
      /(?:订单[号]?|订单状态|查订单|查询订单|订单查询|#)\s*(\d{6,20})/i,  // 不带DD前缀
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        // 如果有第二组（DD前缀）
        if (match[1] && /^[Dd][Dd]?$/i.test(match[1])) {
          return match[1].toUpperCase() + match[2];
        }
        // 如果只有数字组
        if (match[1] && /^\d+$/.test(match[1])) {
          return match[1];
        }
      }
    }

    // 3. 纯数字订单号（6-20位）
    const cleaned = message.replace(/[A-Za-z]/g, '');
    if (/^\d{6,20}$/.test(cleaned)) {
      return cleaned;
    }

    return undefined;
  }

  /**
   * 关键词匹配得分
   * 返回 0-1 之间的置信度
   */
  private matchKeywords(message: string, keywords: string[]): number {
    let matchedCount = 0;
    const lowerMessage = message.toLowerCase();

    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        matchedCount++;
      }
    }

    // 根据匹配数量计算置信度
    if (matchedCount === 0) return 0;
    if (matchedCount === 1) return 0.6;
    if (matchedCount === 2) return 0.8;
    return Math.min(0.95, 0.6 + matchedCount * 0.1);
  }
}