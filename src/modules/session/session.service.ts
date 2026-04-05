import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { StoreType, SessionStatus, ChatSession } from '@prisma/client';
import { CreateSessionDto } from './dto/session.dto';

export interface CreateOrResumeResult {
  session: ChatSession;
  isNew: boolean;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private prisma: PrismaService) {}

  // 创建或恢复会话（用户进入时调用）
  async createOrResume(
    userId: string,
    storeId: string,
    storeType: StoreType,
    channel: string,
  ): Promise<CreateOrResumeResult> {
    // 1. 查找该用户在对应店铺的最近会话（包括 OPEN 和 HANDOFF）
    const existingSession = await this.prisma.chatSession.findFirst({
      where: {
        userId,
        storeId,
        status: {
          in: [SessionStatus.OPEN, SessionStatus.HANDOFF],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. 如有则返回（恢复），无则创建新会话
    if (existingSession) {
      // 如果是 HANDOFF 状态，恢复为 OPEN（用户重新进入后继续 AI 对话）
      let updatedSession = existingSession;
      if (existingSession.status === SessionStatus.HANDOFF) {
        updatedSession = await this.prisma.chatSession.update({
          where: { id: existingSession.id },
          data: { status: SessionStatus.OPEN, lastActiveAt: new Date() },
        });
      } else {
        // 更新最后活跃时间
        updatedSession = await this.prisma.chatSession.update({
          where: { id: existingSession.id },
          data: { lastActiveAt: new Date() },
        });
      }
      return { session: updatedSession, isNew: false };
    }

    // 创建新会话
    const newSession = await this.prisma.chatSession.create({
      data: {
        userId,
        storeId,
        storeType,
        channel,
        status: SessionStatus.OPEN,
      },
    });

    return { session: newSession, isNew: true };
  }

  // 通过 ID 查找会话
  async findById(id: string): Promise<ChatSession> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  // 更新 Dify conversation ID
  async updateDifyConversationId(
    sessionId: string,
    difyConversationId: string,
  ): Promise<ChatSession> {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { difyConversationId },
    });
  }

  // 更新会话状态
  async updateStatus(
    sessionId: string,
    status: SessionStatus,
  ): Promise<ChatSession> {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { status, lastActiveAt: new Date() },
    });
  }

  // 通过用户ID和店铺ID查找会话
  async findByUserAndStore(
    userId: string,
    storeId: string,
  ): Promise<ChatSession | null> {
    return this.prisma.chatSession.findFirst({
      where: {
        userId,
        storeId,
        status: {
          in: [SessionStatus.OPEN, SessionStatus.HANDOFF],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}