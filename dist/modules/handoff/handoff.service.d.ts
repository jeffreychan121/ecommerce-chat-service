import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infra/database/prisma.service';
import { HandoffStatus, SenderType } from '@prisma/client';
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
export declare class HandoffService {
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createTicket(sessionId: string, reason?: string): Promise<{
        success: boolean;
        message: string;
        queueNo: number;
        ticketId: string;
    }>;
    findBySessionId(sessionId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.HandoffStatus;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string;
        queueNo: number;
        assignedAgentId: string | null;
        agentJoinedAt: Date | null;
        closedAt: Date | null;
    }>;
    updateStatus(ticketId: string, status: HandoffStatus): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.HandoffStatus;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string;
        queueNo: number;
        assignedAgentId: string | null;
        agentJoinedAt: Date | null;
        closedAt: Date | null;
    }>;
    isHandoffTrigger(content: string): boolean;
    getPendingQueue(): Promise<AgentQueueItem[]>;
    private getLastMessages;
    acceptSession(sessionId: string): Promise<{
        success: boolean;
        ticketId: string;
    }>;
    closeSession(sessionId: string): Promise<{
        success: boolean;
    }>;
    sendAgentMessage(sessionId: string, content: string): Promise<AgentMessage>;
    getSessionMessages(sessionId: string): Promise<AgentMessage[]>;
    getSessionDetail(sessionId: string): Promise<{
        session: {
            id: string;
            userId: string;
            storeId: string;
            status: import("@prisma/client").$Enums.SessionStatus;
        };
        messages: {
            id: string;
            senderType: import("@prisma/client").$Enums.SenderType;
            content: string;
            messageType: import("@prisma/client").$Enums.MessageType;
            createdAt: string;
        }[];
        store: {
            id: string;
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
        user: {
            phone: string;
        };
    }>;
    getHistory(page?: number, limit?: number): Promise<{
        items: {
            ticketId: string;
            sessionId: string;
            queueNo: number;
            userPhone: string;
            storeId: string;
            storeName: string;
            storeType: import("@prisma/client").$Enums.StoreType;
            lastMessage: string;
            createdAt: string;
            agentJoinedAt: string;
            closedAt: string;
            status: import("@prisma/client").$Enums.HandoffStatus;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}
