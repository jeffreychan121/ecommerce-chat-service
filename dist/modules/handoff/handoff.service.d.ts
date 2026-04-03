import { PrismaService } from '../../infra/database/prisma.service';
import { HandoffStatus } from '@prisma/client';
export declare class HandoffService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    }>;
    updateStatus(ticketId: string, status: HandoffStatus): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.HandoffStatus;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string;
        queueNo: number;
        assignedAgentId: string | null;
    }>;
    isHandoffTrigger(content: string): boolean;
}
