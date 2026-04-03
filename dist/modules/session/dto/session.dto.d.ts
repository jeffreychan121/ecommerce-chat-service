import { StoreType } from '@prisma/client';
export declare class CreateSessionDto {
    phone: string;
    storeId: string;
    storeType: StoreType;
    channel: string;
    customerId?: string;
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
