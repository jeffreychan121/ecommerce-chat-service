import { StoreService } from '../store/store.service';
import { DifyService } from '../dify/dify.service';
import { PrismaService } from '../../infra/database/prisma.service';
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}
export declare class MerchantService {
    private readonly storeService;
    private readonly difyService;
    private readonly prisma;
    private readonly logger;
    private readonly MAX_FILE_SIZE;
    private readonly ALLOWED_EXTENSIONS;
    constructor(storeService: StoreService, difyService: DifyService, prisma: PrismaService);
    getStoreStatus(storeId: string): Promise<{
        storeId: string;
        storeName: string;
        hasDataset: boolean;
        datasetId: string;
        fileCount: number;
    }>;
    createDatasetForStore(storeId: string, options?: {
        name?: string;
        description?: string;
        indexing_technique?: string;
        permission?: string;
        search_method?: string;
        top_k?: number;
        score_threshold_enabled?: boolean;
        score_threshold?: number;
        doc_form?: string;
    }): Promise<{
        datasetId: string;
    }>;
    deleteDataset(storeId: string): Promise<{
        success: boolean;
    }>;
    uploadFile(storeId: string, file: UploadedFile): Promise<{
        id: string;
        fileName: string;
        status: import("@prisma/client").$Enums.TrainingStatus;
        createdAt: Date;
    }>;
    getFiles(storeId: string): Promise<{
        storeId: string;
        id: string;
        status: import("@prisma/client").$Enums.TrainingStatus;
        createdAt: Date;
        fileName: string;
        filePath: string;
        difyDocumentId: string | null;
        enabled: boolean;
        errorMessage: string | null;
        completedAt: Date | null;
    }[]>;
    deleteFile(jobId: string): Promise<{
        success: boolean;
    }>;
    trainFile(jobId: string): Promise<{
        success: boolean;
        status: string;
    }>;
    trainAllFiles(storeId: string): Promise<any[]>;
    toggleDocumentEnabled(jobId: string, enabled: boolean): Promise<{
        success: boolean;
        enabled: boolean;
    }>;
    chat(storeId: string, query: string): Promise<import("../dify/dto/dify.dto").DifyResponse>;
}
export {};
