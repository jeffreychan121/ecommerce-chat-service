import { PrismaService } from '../../infra/database/prisma.service';
import { SenderType, MessageType, ChatMessage, Prisma } from '@prisma/client';
export declare class MessageService {
    private prisma;
    constructor(prisma: PrismaService);
    create(sessionId: string, senderType: SenderType, content: string, messageType?: MessageType, rawPayload?: unknown): Promise<ChatMessage>;
    findBySessionId(sessionId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
    countBySessionId(sessionId: string): Promise<number>;
    createMany(data: {
        sessionId: string;
        senderType: SenderType;
        content: string;
        messageType?: MessageType;
        rawPayload?: unknown;
    }[]): Promise<Prisma.BatchPayload>;
}
