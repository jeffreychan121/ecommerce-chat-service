import { StoreType } from '@prisma/client';
export declare class SendMessageInputsDto {
    store_id?: string;
    store_type?: string;
    channel?: string;
    phone?: string;
    customer_id?: string;
}
export declare class CreateSessionDto {
    phone: string;
    storeId: string;
    storeType: StoreType;
    channel: string;
    customerId?: string;
}
export declare class SendMessageDto {
    message: string;
    inputs?: SendMessageInputsDto;
}
export declare class SessionResponseDto {
    id: string;
    userId: string;
    storeId: string;
    storeType: StoreType;
    channel: string;
    difyConversationId: string | null;
    status: string;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MessageResponseDto {
    id: string;
    sessionId: string;
    senderType: string;
    content: string;
    messageType: string;
    createdAt: Date;
}
export declare class CreateOrResumeSessionResponseDto {
    sessionId: string;
    status: string;
    isNew: boolean;
    difyConversationId: string | null;
}
