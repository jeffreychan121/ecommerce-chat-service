import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infra/database/prisma.service';
import { HandoffStatus, SessionStatus, SenderType, MessageType } from '@prisma/client';

export interface AgentQueueItem {
  ticketId: string;
  queueNo: number;
  sessionId: string;
  userPhone: string;
  storeId: string;
  storeName: string;
  storeType: string;
  lastMessage: string;
  createdAt: string;
}

export interface AgentMessage {
  id: string;
  senderType: SenderType;
  content: string;
  createdAt: string;
}

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  // 创建转人工工单
  async createTicket(sessionId: string, reason?: string) {
    // 1. 获取当前最大排队号，生成新排队号
    const lastTicket = await this.prisma.handoffTicket.findFirst({
      orderBy: { queueNo: 'desc' },
    });
    const queueNo = (lastTicket?.queueNo || 0) + 1;

    // 2. 创建 HandoffTicket (PENDING)
    const ticket = await this.prisma.handoffTicket.create({
      data: {
        sessionId,
        status: HandoffStatus.PENDING,
        queueNo,
      },
    });

    // 3. 更新 ChatSession 状态为 HANDOFF
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.HANDOFF },
    });

    this.logger.log(`Created handoff ticket ${ticket.id} for session ${sessionId}, queueNo: ${queueNo}`);

    // 4. 返回工单信息
    return {
      success: true,
      message: '转人工成功',
      queueNo: ticket.queueNo,
      ticketId: ticket.id,
    };
  }

  // 通过会话 ID 查找工单
  async findBySessionId(sessionId: string) {
    return this.prisma.handoffTicket.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 更新工单状态
  async updateStatus(ticketId: string, status: HandoffStatus) {
    return this.prisma.handoffTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  // 检查消息是否包含转人工关键词
  isHandoffTrigger(content: string): boolean {
    const keywords = ['转人工', '人工客服', '联系客服', '客服', '投诉', '我要人工', '人工'];
    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) => lowerContent.includes(keyword));
  }

  // 获取待处理队列
  async getPendingQueue(): Promise<AgentQueueItem[]> {
    const tickets = await this.prisma.handoffTicket.findMany({
      where: { status: HandoffStatus.PENDING },
      orderBy: { queueNo: 'asc' },
      include: {
        session: {
          include: { user: true, store: true },
        },
      },
    });

    // 获取每个会话的最后一条消息
    const sessionIds = tickets.map(t => t.sessionId);
    const lastMessages = await this.getLastMessages(sessionIds);

    return tickets.map(t => ({
      ticketId: t.id,
      queueNo: t.queueNo,
      sessionId: t.sessionId,
      userPhone: t.session.user.phone,
      storeId: t.session.storeId,
      storeName: t.session.store.name,
      storeType: t.session.store.storeType,
      lastMessage: lastMessages[t.sessionId] || '',
      createdAt: t.createdAt.toISOString(),
    }));
  }

  // 获取会话最后一条消息
  private async getLastMessages(sessionIds: string[]): Promise<Record<string, string>> {
    if (sessionIds.length === 0) return {};

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true, content: true },
      distinct: ['sessionId'],
    });

    return messages.reduce((acc, m) => {
      acc[m.sessionId] = m.content;
      return acc;
    }, {} as Record<string, string>);
  }

  // 接入会话
  async acceptSession(sessionId: string) {
    const ticket = await this.prisma.handoffTicket.findFirst({
      where: { sessionId, status: HandoffStatus.PENDING },
    });

    if (!ticket) {
      throw new NotFoundException('会话不存在或已处理');
    }

    await this.prisma.handoffTicket.update({
      where: { id: ticket.id },
      data: {
        status: HandoffStatus.ANSWERED,
        agentJoinedAt: new Date(),
      },
    });

    return { success: true, ticketId: ticket.id };
  }

  // 关闭会话
  async closeSession(sessionId: string) {
    const ticket = await this.prisma.handoffTicket.findFirst({
      where: { sessionId, status: HandoffStatus.ANSWERED },
    });

    if (ticket) {
      await this.prisma.handoffTicket.update({
        where: { id: ticket.id },
        data: { status: HandoffStatus.CLOSED, closedAt: new Date() },
      });
    }

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CLOSED },
    });

    return { success: true };
  }

  // 发送客服消息
  async sendAgentMessage(sessionId: string, content: string): Promise<AgentMessage> {
    const message = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: SenderType.HUMAN,
        content,
        messageType: MessageType.TEXT,
      },
    });

    const result = {
      id: message.id,
      senderType: message.senderType,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };

    // 触发事件，推送给客户
    this.eventEmitter.emit('agent.message', { sessionId, message: result });

    return result;
  }

  // 获取会话消息
  async getSessionMessages(sessionId: string): Promise<AgentMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(m => ({
      id: m.id,
      senderType: m.senderType,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  // 获取会话详情（包含店铺信息）
  async getSessionDetail(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        store: true,
      },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      session: {
        id: session.id,
        userId: session.userId,
        storeId: session.storeId,
        status: session.status,
      },
      messages: messages.map(m => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content,
        messageType: m.messageType,
        createdAt: m.createdAt.toISOString(),
      })),
      store: {
        id: session.store.id,
        name: session.store.name,
        storeType: session.store.storeType,
      },
      user: {
        phone: session.user.phone,
      },
    };
  }

  // 获取历史会话
  async getHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.handoffTicket.findMany({
        where: {
          status: { in: [HandoffStatus.ANSWERED, HandoffStatus.CLOSED] },
        },
        include: {
          session: {
            include: { user: true, store: true },
          },
        },
        orderBy: { agentJoinedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.handoffTicket.count({
        where: { status: { in: [HandoffStatus.ANSWERED, HandoffStatus.CLOSED] } },
      }),
    ]);

    // 获取最后消息
    const sessionIds = tickets.map(t => t.sessionId);
    const lastMessages = await this.getLastMessages(sessionIds);

    return {
      items: tickets.map(t => ({
        ticketId: t.id,
        sessionId: t.sessionId,
        queueNo: t.queueNo,
        userPhone: t.session.user.phone,
        storeId: t.session.storeId,
        storeName: t.session.store.name,
        storeType: t.session.store.storeType,
        lastMessage: lastMessages[t.sessionId] || '',
        createdAt: t.createdAt.toISOString(),
        agentJoinedAt: t.agentJoinedAt?.toISOString() || '',
        closedAt: t.closedAt?.toISOString() || '',
        status: t.status,
      })),
      total,
      page,
      limit,
    };
  }
}