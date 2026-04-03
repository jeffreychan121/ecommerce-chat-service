import { ConfigService } from '@nestjs/config';
import { DifyChunk, DifyResponse } from './dto/dify.dto';
export declare class DifyClient {
    private configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    sendMessage(conversationId: string | null, inputs: Record<string, any>, query: string, onChunk: (chunk: DifyChunk) => void): Promise<DifyResponse>;
}
