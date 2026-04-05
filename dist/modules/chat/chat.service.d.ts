import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionService } from '../session/session.service';
import { MessageService } from '../message/message.service';
import { DifyService } from '../dify/dify.service';
import { HandoffService } from '../handoff/handoff.service';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { OrderService } from '../order/order.service';
import { IntentRouterService } from '../intent-router/intent-router.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { SessionStatus, ChatSession } from '@prisma/client';
import { CreateSessionDto, SendMessageDto, SessionResponseDto, MessageResponseDto, CreateOrResumeSessionResponseDto } from './dto/chat.dto';
import { DifyChunk } from '../dify/dto/dify.dto';
export interface CreateOrResumeResult {
    session: ChatSession;
    isNew: boolean;
}
export declare class ChatService {
    private sessionService;
    private messageService;
    private difyService;
    private handoffService;
    private userService;
    private storeService;
    private orderService;
    private intentRouterService;
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(sessionService: SessionService, messageService: MessageService, difyService: DifyService, handoffService: HandoffService, userService: UserService, storeService: StoreService, orderService: OrderService, intentRouterService: IntentRouterService, prisma: PrismaService, eventEmitter: EventEmitter2);
    createOrResumeSession(dto: CreateSessionDto): Promise<CreateOrResumeSessionResponseDto>;
    sendMessage(sessionId: string, dto: SendMessageDto, onChunk?: (chunk: DifyChunk) => void): Promise<{
        messageId: string;
        answer: string;
        conversationId: string;
    }>;
    private handleOrderQuery;
    private handleLogisticsQuery;
    private handleOrderCreate;
    private handleAIQuery;
    private formatOrderResponse;
    private formatLogisticsResponse;
    getMessages(sessionId: string, limit?: number, offset?: number): Promise<MessageResponseDto[]>;
    getSession(sessionId: string): Promise<SessionResponseDto>;
    updateSessionStatus(sessionId: string, status: SessionStatus): Promise<SessionResponseDto>;
}
