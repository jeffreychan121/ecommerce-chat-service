export declare class DifyInputs {
    phone: string;
    store_id: string;
    store_type: 'self' | 'merchant';
    channel: string;
    customer_id?: string;
    dataset_id?: string;
}
export declare class SendMessageDto {
    query: string;
    inputs?: Partial<DifyInputs>;
}
export interface DifyChunk {
    event: string;
    message_id?: string;
    conversation_id?: string;
    answer?: string;
    created_at?: number;
}
export interface DifyResponse {
    messageId: string;
    conversationId: string;
    answer: string;
    metadata?: Record<string, any>;
}
