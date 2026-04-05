import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionService } from '../session/session.service';
import { MessageService } from '../message/message.service';
import { DifyService } from '../dify/dify.service';
import { HandoffService } from '../handoff/handoff.service';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { OrderInfo, LogisticsInfo } from '../order/order.types';
import { OrderService } from '../order/order.service';
import { IntentRouterService, BusinessIntent } from '../intent-router/intent-router.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { StoreType, SenderType, MessageType, SessionStatus, ChatSession } from '@prisma/client';
import { CreateSessionDto, SendMessageDto, SessionResponseDto, MessageResponseDto, CreateOrResumeSessionResponseDto } from './dto/chat.dto';
import { DifyChunk, SendMessageDto as DifySendMessageDto } from '../dify/dto/dify.dto';

export interface CreateOrResumeResult {
  session: ChatSession;
  isNew: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private sessionService: SessionService,
    private messageService: MessageService,
    private difyService: DifyService,
    private handoffService: HandoffService,
    private userService: UserService,
    private storeService: StoreService,
    private orderService: OrderService,
    private intentRouterService: IntentRouterService,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // 创建或恢复会话
  async createOrResumeSession(dto: CreateSessionDto): Promise<CreateOrResumeSessionResponseDto> {
    this.logger.log(`Creating or resuming session for phone: ${dto.phone}, storeId: ${dto.storeId}`);

    // 1. 查找或创建用户
    const user = await this.userService.findOrCreateByPhone(dto.phone);
    this.logger.debug(`User found/created: ${user.id}`);

    // 2. 查找或创建店铺
    const store = await this.storeService.findOrCreateStore(dto.storeId, dto.storeId, dto.storeType);
    this.logger.debug(`Store found/created: ${store.id}`);

    // 3. 创建或恢复会话
    const result = await this.sessionService.createOrResume(
      user.id,
      store.id,
      dto.storeType,
      dto.channel,
    );

    const session = result.session;

    return {
      sessionId: session.id,
      status: session.status,
      isNew: result.isNew,
      difyConversationId: session.difyConversationId,
    };
  }

  // 发送消息（核心逻辑）
  async sendMessage(
    sessionId: string,
    dto: SendMessageDto,
    onChunk?: (chunk: DifyChunk) => void,
  ): Promise<{ messageId: string; answer: string; conversationId: string }> {
    this.logger.log(`>>> [ChatService] 发送消息到会话: ${sessionId}, message: ${dto.message}, inputs: ${JSON.stringify(dto.inputs)}`);

    // 1. 获取会话，验证状态
    const session = await this.sessionService.findById(sessionId);
    this.logger.log(`>>> [ChatService] 会话状态: ${session.status}, difyConversationId: ${session.difyConversationId}`);

    // 2. 检查是否已转人工
    if (session.status === SessionStatus.HANDOFF) {
      // 会话已转人工，保存用户消息并广播给客服
      const userMessage = await this.messageService.create(
        sessionId,
        SenderType.USER,
        dto.message,
        MessageType.TEXT,
      );
      this.logger.debug(`User message saved in handoff mode: ${userMessage.id}`);

      // 广播给客服
      this.eventEmitter.emit('customer.message', {
        sessionId,
        message: {
          id: userMessage.id,
          senderType: SenderType.USER,
          content: dto.message,
          createdAt: userMessage.createdAt.toISOString(),
        },
      });

      return {
        messageId: userMessage.id,
        answer: '',
        conversationId: session.difyConversationId || '',
      };
    }

    // 3. 检查是否命中转人工关键词
    if (this.handoffService.isHandoffTrigger(dto.message)) {
      this.logger.log(`Message triggered handoff for session: ${sessionId}`);

      // 调用转人工服务
      const handoffResult = await this.handoffService.createTicket(sessionId, '用户主动触发转人工');

      // 保存用户消息
      await this.messageService.create(
        sessionId,
        SenderType.USER,
        dto.message,
        MessageType.TEXT,
      );

      // 保存人工回复消息（模拟）
      const handoffMessage = `您已成功转接人工客服，当前排队号：${handoffResult.queueNo}。请稍候...`;
      await this.messageService.create(
        sessionId,
        SenderType.AI,
        handoffMessage,
        MessageType.TEXT,
      );

      return {
        messageId: '',
        answer: handoffMessage,
        conversationId: session.difyConversationId || '',
      };
    }

    // 4. 保存用户消息
    const userMessage = await this.messageService.create(
      sessionId,
      SenderType.USER,
      dto.message,
      MessageType.TEXT,
    );
    this.logger.debug(`User message saved: ${userMessage.id}`);

    // 5. 意图路由（记录日志，后续 Dify 会处理）
    const intentResult = this.intentRouterService.route(dto.message);
    this.logger.log(`Intent routed: ${intentResult.intent}, orderNo: ${intentResult.orderNo}, needMoreInfo: ${intentResult.needMoreInfo}`);

    // 6. 如果是下单意图，直接创建订单并返回
    if (intentResult.intent === BusinessIntent.ORDER_CREATE) {
      const orderResponse = await this.handleOrderCreate(
        intentResult.productName || '',
        intentResult.quantity || 1,
      );
      // 保存用户消息
      await this.messageService.create(
        sessionId,
        SenderType.USER,
        dto.message,
        MessageType.TEXT,
      );
      // 保存 AI 响应
      const aiMessage = await this.messageService.create(
        sessionId,
        SenderType.AI,
        orderResponse,
        MessageType.TEXT,
      );
      return {
        messageId: aiMessage.id,
        answer: orderResponse,
        conversationId: session.difyConversationId || '',
      };
    }

    // 7. 所有消息都经过 Dify 处理（包括订单/物流查询）
    // Dify 会通过 HTTP Request 调用 /api/agent 获取业务数据
    const aiResponse = await this.handleAIQuery(dto, session.difyConversationId, onChunk);

    // 9. 保存 AI 响应
    const aiMessage = await this.messageService.create(
      sessionId,
      SenderType.AI,
      aiResponse,
      MessageType.TEXT,
    );
    this.logger.debug(`AI message saved: ${aiMessage.id}`);

    // 10. 返回响应
    return {
      messageId: aiMessage.id,
      answer: aiResponse,
      conversationId: session.difyConversationId || '',
    };
  }

  /**
   * 处理订单查询
   */
  private async handleOrderQuery(orderNo: string): Promise<string> {
    try {
      const order = await this.orderService.getOrderStatus(orderNo);
      return this.formatOrderResponse(order);
    } catch (error) {
      this.logger.error(`Order query failed: ${error.message}`);
      return `未找到订单 ${orderNo} 的信息，请确认订单号是否正确。`;
    }
  }

  /**
   * 处理物流查询
   */
  private async handleLogisticsQuery(orderNo: string): Promise<string> {
    try {
      const logistics = await this.orderService.getLogistics(orderNo);
      return this.formatLogisticsResponse(logistics);
    } catch (error) {
      this.logger.error(`Logistics query failed: ${error.message}`);
      return `未找到订单 ${orderNo} 的物流信息，请确认订单号是否正确。`;
    }
  }

  /**
   * 处理下单请求
   */
  private async handleOrderCreate(
    productName: string,
    quantity: number,
  ): Promise<string> {
    try {
      const order = await this.orderService.createOrderFromChat(
        productName,
        quantity,
      );

      // 发出订单创建事件
      this.eventEmitter.emit('order.created', order);

      // 格式化响应
      const lines = [
        '订单已创建！',
        '',
        `订单号：${order.orderNo}`,
        `商品：${order.items?.[0]?.title || productName} x ${quantity}`,
        `单价：¥${order.items?.[0]?.price?.toFixed(2) || '0.00'}`,
        `总价：¥${order.actualAmount?.toFixed(2)}`,
        `状态：${order.statusText}`,
      ];

      if (order.logistics) {
        lines.push(`快递：${order.logistics.carrier} ${order.logistics.trackingNo}`);
      }

      return lines.join('\n');
    } catch (error) {
      this.logger.error(`handleOrderCreate failed: ${error.message}`);
      return '抱歉，创建订单失败，请稍后重试。';
    }
  }

  /**
   * 处理普通 AI 对话
   */
  private async handleAIQuery(
    dto: SendMessageDto,
    conversationId: string | null,
    onChunk?: (chunk: DifyChunk) => void,
  ): Promise<string> {
    this.logger.log(`>>> [ChatService] handleAIQuery: conversationId=${conversationId}, message=${dto.message}`);
    const difyInputs = dto.inputs ? {
      phone: dto.inputs.phone,
      store_id: dto.inputs.store_id,
      store_type: dto.inputs.store_type as 'self' | 'merchant',
      channel: dto.inputs.channel,
      customer_id: dto.inputs.customer_id,
    } : undefined;
    this.logger.log(`>>> [ChatService] Dify inputs: ${JSON.stringify(difyInputs)}`);

    const difyDto: DifySendMessageDto = {
      query: dto.message,
      inputs: difyInputs,
    };

    const difyResponse = await this.difyService.sendMessage(
      conversationId,
      difyDto,
      onChunk,
    );

    // 保存 difyConversationId（如是新会话）
    // 注意：这里需要在外部处理

    return difyResponse.answer;
  }

  /**
   * 格式化订单响应为自然语言
   */
  private formatOrderResponse(order: OrderInfo): string {
    const lines: string[] = [
      `订单号：${order.orderNo}`,
      `订单状态：${order.statusText}`,
      `订单金额：¥${order.actualAmount}`,
      `下单时间：${new Date(order.createdAt).toLocaleString('zh-CN')}`,
    ];

    if (order.paidAt) {
      lines.push(`支付时间：${new Date(order.paidAt).toLocaleString('zh-CN')}`);
    }

    if (order.estimatedShipTime) {
      lines.push(`预计发货时间：${new Date(order.estimatedShipTime).toLocaleString('zh-CN')}`);
    }

    if (order.items && order.items.length > 0) {
      lines.push('商品信息：');
      for (const item of order.items) {
        lines.push(`  - ${item.title} x${item.quantity}`);
      }
    }

    if (order.shippingAddress) {
      lines.push(`收货地址：${order.shippingAddress}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化物流响应为自然语言
   */
  private formatLogisticsResponse(logistics: LogisticsInfo): string {
    const lines: string[] = [
      `订单号：${logistics.orderNo}`,
      `快递公司：${logistics.carrier}`,
      `运单号：${logistics.trackingNo}`,
      `当前状态：${logistics.status === 'IN_TRANSIT' ? '运输中' : logistics.status === 'DELIVERED' ? '已送达' : '待发货'}`,
      `当前位置：${logistics.currentLocation}`,
    ];

    if (logistics.estimatedDeliveryTime) {
      lines.push(`预计送达时间：${new Date(logistics.estimatedDeliveryTime).toLocaleString('zh-CN')}`);
    }

    if (logistics.events && logistics.events.length > 0) {
      lines.push('物流轨迹：');
      for (const event of logistics.events.slice(0, 3)) {
        lines.push(`  [${new Date(event.time).toLocaleString('zh-CN')}] ${event.location} - ${event.description}`);
      }
    }

    return lines.join('\n');
  }

  // 获取历史消息
  async getMessages(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<MessageResponseDto[]> {
    try {
      this.logger.log(`Getting messages for session: ${sessionId}`);

      // 验证会话存在
      const session = await this.sessionService.findById(sessionId);
      this.logger.log(`Session found: ${session.id}`);

      const messages = await this.messageService.findBySessionId(sessionId, limit, offset);
      this.logger.log(`Found ${messages.length} messages`);

      return messages.map((msg) => ({
        id: msg.id,
        sessionId: msg.sessionId,
        senderType: msg.senderType,
        content: msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Error getting messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 获取会话详情
  async getSession(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.sessionService.findById(sessionId);

    return {
      id: session.id,
      userId: session.userId,
      storeId: session.storeId,
      storeType: session.storeType,
      channel: session.channel,
      difyConversationId: session.difyConversationId,
      status: session.status,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  // 更新会话状态
  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<SessionResponseDto> {
    const session = await this.sessionService.updateStatus(sessionId, status);
    this.logger.log(`Session ${sessionId} status updated to ${status}`);

    return {
      id: session.id,
      userId: session.userId,
      storeId: session.storeId,
      storeType: session.storeType,
      channel: session.channel,
      difyConversationId: session.difyConversationId,
      status: session.status,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}