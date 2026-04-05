import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { SenderType, MessageType, ChatMessage, Prisma } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  // 创建消息
  async create(
    sessionId: string,
    senderType: SenderType,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    rawPayload?: unknown,
    card?: unknown,
  ): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        senderType,
        content,
        messageType,
        rawPayload: rawPayload as Prisma.InputJsonValue,
        card: card as Prisma.InputJsonValue,
      },
    });
  }

  // 查询会话消息
  async findBySessionId(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: offset,
    });
  }

  // 统计消息数量
  async countBySessionId(sessionId: string): Promise<number> {
    return this.prisma.chatMessage.count({
      where: { sessionId },
    });
  }

  // 批量创建消息
  async createMany(
    data: {
      sessionId: string;
      senderType: SenderType;
      content: string;
      messageType?: MessageType;
      rawPayload?: unknown;
    }[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.chatMessage.createMany({
      data: data.map(item => ({
        ...item,
        rawPayload: item.rawPayload as Prisma.InputJsonValue,
      })),
    });
  }
}