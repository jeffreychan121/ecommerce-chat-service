import { SessionService } from '../session/session.service';
import { MessageService } from '../message/message.service';
import { DifyService } from '../dify/dify.service';
import { HandoffService } from '../handoff/handoff.service';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { ChatSession } from '@prisma/client';
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
    private prisma;
    private readonly logger;
    constructor(sessionService: SessionService, messageService: MessageService, difyService: DifyService, handoffService: HandoffService, userService: UserService, storeService: StoreService, prisma: PrismaService);
    createOrResumeSession(dto: CreateSessionDto): Promise<CreateOrResumeSessionResponseDto>;
    sendMessage(sessionId: string, dto: SendMessageDto, onChunk?: (chunk: DifyChunk) => void): Promise<{
        messageId: string;
        answer: string;
        conversationId: string;
    }>;
    getMessages(sessionId: string, limit?: number, offset?: number): Promise<MessageResponseDto[]>;
    getSession(sessionId: string): Promise<SessionResponseDto>;
}
