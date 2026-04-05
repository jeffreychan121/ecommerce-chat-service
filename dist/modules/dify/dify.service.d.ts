import { DifyClient } from './dify.client';
import { SendMessageDto, DifyChunk, DifyResponse, DifyInputs } from './dto/dify.dto';
export declare class DifyService {
    private readonly difyClient;
    private readonly logger;
    constructor(difyClient: DifyClient);
    sendMessage(conversationId: string | null, dto: SendMessageDto, onChunk?: (chunk: DifyChunk) => void): Promise<DifyResponse>;
    sendMessageWithInputs(conversationId: string | null, query: string, inputs: Partial<DifyInputs>, onChunk?: (chunk: DifyChunk) => void): Promise<DifyResponse>;
    createDataset(options: {
        name: string;
        description?: string;
        indexing_technique?: string;
        permission?: string;
        retrieval_model?: {
            search_method?: string;
            top_k?: number;
            reranking_enable?: boolean;
            score_threshold_enabled?: boolean;
            score_threshold?: number;
        };
        doc_form?: string;
    }): Promise<{
        id: string;
    }>;
    createDocument(datasetId: string, filePath: string): Promise<{
        document: {
            id: string;
        };
        documentId: string;
    }>;
    getDocuments(datasetId: string): Promise<{
        documents: any[];
    }>;
    deleteDocument(datasetId: string, documentId: string): Promise<void>;
    deleteDataset(datasetId: string): Promise<void>;
    disableDocument(datasetId: string, documentId: string): Promise<void>;
    enableDocument(datasetId: string, documentId: string): Promise<void>;
}
