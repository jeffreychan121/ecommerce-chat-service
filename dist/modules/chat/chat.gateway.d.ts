import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    private readonly logger;
    private sessionClients;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(client: Socket, sessionId: string): Promise<{
        success: boolean;
        error: string;
        sessionId?: undefined;
    } | {
        success: boolean;
        sessionId: string;
        error?: undefined;
    }>;
    handleLeaveSession(client: Socket, sessionId: string): {
        success: boolean;
        sessionId: string;
    };
    handleSendMessage(client: Socket, data: {
        sessionId: string;
        message: string;
        inputs?: any;
    }): Promise<{
        messageId: string;
        answer: string;
        conversationId: string;
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    private broadcastToSession;
}
