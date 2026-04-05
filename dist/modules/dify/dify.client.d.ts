import { ConfigService } from '@nestjs/config';
import { DifyChunk, DifyResponse } from './dto/dify.dto';
export declare class DifyClient {
    private configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    sendMessage(conversationId: string | null, inputs: Record<string, any>, query: string, onChunk: (chunk: DifyChunk) => void): Promise<DifyResponse>;
    createDataset(name: string, description?: string): Promise<{
        id: string;
    }>;
    createDocument(datasetId: string, filePath: string): Promise<{
        document: {
            id: string;
        };
    }>;
    getDocuments(datasetId: string): Promise<{
        documents: any[];
    }>;
    deleteDocument(datasetId: string, documentId: string): Promise<void>;
}
