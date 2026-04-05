import { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto, SessionResponseDto, MessageResponseDto, CreateOrResumeSessionResponseDto } from './dto/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createOrResumeSession(dto: CreateSessionDto): Promise<CreateOrResumeSessionResponseDto>;
    getSession(id: string): Promise<SessionResponseDto>;
    updateSessionStatus(id: string, body: {
        status: 'OPEN' | 'HANDOFF' | 'CLOSED';
    }): Promise<SessionResponseDto>;
    getMessages(id: string, limit?: string, offset?: string): Promise<MessageResponseDto[]>;
    sendMessage(id: string, dto: SendMessageDto): Promise<{
        messageId: string;
        answer: string;
        conversationId: string;
    }>;
    sendMessageStream(id: string, dto: SendMessageDto, res: Response): Promise<void>;
}
