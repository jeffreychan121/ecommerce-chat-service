import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { HandoffStatus, SessionStatus } from '@prisma/client';

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(private prisma: PrismaService) {}

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
}