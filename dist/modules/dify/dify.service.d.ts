import { DifyClient } from './dify.client';
import { SendMessageDto, DifyChunk, DifyResponse, DifyInputs } from './dto/dify.dto';
export declare class DifyService {
    private readonly difyClient;
    private readonly logger;
    constructor(difyClient: DifyClient);
    sendMessage(conversationId: string | null, dto: SendMessageDto, onChunk?: (chunk: DifyChunk) => void): Promise<DifyResponse>;
    sendMessageWithInputs(conversationId: string | null, query: string, inputs: Partial<DifyInputs>, onChunk?: (chunk: DifyChunk) => void): Promise<DifyResponse>;
}
