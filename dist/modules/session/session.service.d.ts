import { PrismaService } from '../../infra/database/prisma.service';
import { StoreType, SessionStatus, ChatSession } from '@prisma/client';
export interface CreateOrResumeResult {
    session: ChatSession;
    isNew: boolean;
}
export declare class SessionService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrResume(userId: string, storeId: string, storeType: StoreType, channel: string): Promise<CreateOrResumeResult>;
    findById(id: string): Promise<ChatSession>;
    updateDifyConversationId(sessionId: string, difyConversationId: string): Promise<ChatSession>;
    updateStatus(sessionId: string, status: SessionStatus): Promise<ChatSession>;
    findByUserAndStore(userId: string, storeId: string): Promise<ChatSession | null>;
}
