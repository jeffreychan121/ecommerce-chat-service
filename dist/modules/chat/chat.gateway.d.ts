import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { HandoffService } from '../handoff/handoff.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private eventEmitter;
    private handoffService;
    server: Server;
    private readonly logger;
    private sessionClients;
    constructor(chatService: ChatService, eventEmitter: EventEmitter2, handoffService: HandoffService);
    broadcastQueueUpdate(): Promise<void>;
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
