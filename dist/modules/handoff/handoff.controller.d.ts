import { HandoffService } from './handoff.service';
import { HandoffRequestDto, PaginationDto } from './dto/handoff.dto';
export declare class HandoffController {
    private handoffService;
    constructor(handoffService: HandoffService);
    handoff(sessionId: string, dto: HandoffRequestDto): Promise<{
        success: boolean;
        message: string;
        queueNo: number;
        ticketId: string;
    }>;
}
export declare class AgentController {
    private handoffService;
    constructor(handoffService: HandoffService);
    getQueue(): Promise<import("./handoff.service").AgentQueueItem[]>;
    getHistory(query: PaginationDto): Promise<{
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
    getSessionMessages(sessionId: string): Promise<import("./handoff.service").AgentMessage[]>;
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
    acceptSession(sessionId: string): Promise<{
        success: boolean;
        ticketId: string;
    }>;
    closeSession(sessionId: string): Promise<{
        success: boolean;
    }>;
    sendMessage(sessionId: string, dto: {
        content: string;
    }): Promise<import("./handoff.service").AgentMessage>;
}
