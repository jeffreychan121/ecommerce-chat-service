import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { MessageService } from '../message/message.service';
import { DifyService } from '../dify/dify.service';
import { HandoffService } from '../handoff/handoff.service';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
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
    private prisma: PrismaService,
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
    this.logger.log(`Sending message to session: ${sessionId}`);

    // 1. 获取会话，验证状态
    const session = await this.sessionService.findById(sessionId);

    // 2. 检查是否已转人工
    if (session.status === SessionStatus.HANDOFF) {
      throw new BadRequestException('会话已转人工，无法继续发送消息');
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

    // 5. 保存用户消息
    const userMessage = await this.messageService.create(
      sessionId,
      SenderType.USER,
      dto.message,
      MessageType.TEXT,
    );
    this.logger.debug(`User message saved: ${userMessage.id}`);

    // 6. 调用 Dify 服务
    // 首次不传 conversation_id，后续传入
    const difyInputs = dto.inputs ? {
      phone: dto.inputs.phone,
      store_id: dto.inputs.store_id,
      store_type: dto.inputs.store_type as 'self' | 'merchant',
      channel: dto.inputs.channel,
      customer_id: dto.inputs.customer_id,
    } : undefined;

    const difyDto: DifySendMessageDto = {
      query: dto.message,
      inputs: difyInputs,
    };

    const difyResponse = await this.difyService.sendMessage(
      session.difyConversationId,
      difyDto,
      onChunk,
    );
    this.logger.debug(`Dify response received: ${difyResponse.messageId}`);

    // 7. 保存 difyConversationId（如是新会话）
    if (!session.difyConversationId && difyResponse.conversationId) {
      await this.sessionService.updateDifyConversationId(sessionId, difyResponse.conversationId);
      this.logger.debug(`Dify conversation ID saved: ${difyResponse.conversationId}`);
    }

    // 8. 保存 AI 响应
    const aiMessage = await this.messageService.create(
      sessionId,
      SenderType.AI,
      difyResponse.answer,
      MessageType.TEXT,
    );
    this.logger.debug(`AI message saved: ${aiMessage.id}`);

    // 9. 返回响应
    return {
      messageId: aiMessage.id,
      answer: difyResponse.answer,
      conversationId: difyResponse.conversationId,
    };
  }

  // 获取历史消息
  async getMessages(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<MessageResponseDto[]> {
    // 验证会话存在
    await this.sessionService.findById(sessionId);

    const messages = await this.messageService.findBySessionId(sessionId, limit, offset);

    return messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      senderType: msg.senderType,
      content: msg.content,
      messageType: msg.messageType,
      createdAt: msg.createdAt,
    }));
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
}