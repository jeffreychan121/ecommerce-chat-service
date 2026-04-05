import { UploadedFile } from '@nestjs/common';
import { MerchantService } from './merchant.service';
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
export declare class MerchantController {
    private readonly merchantService;
    constructor(merchantService: MerchantService);
    getStatus(storeId: string): Promise<{
        storeId: string;
        storeName: string;
        hasDataset: boolean;
        datasetId: string;
        fileCount: number;
    }>;
    createDataset(storeId: string, dto?: {
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
    uploadFile(file: UploadedFile, storeId: string): Promise<{
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
    enableFile(jobId: string): Promise<{
        success: boolean;
        enabled: boolean;
    }>;
    disableFile(jobId: string): Promise<{
        success: boolean;
        enabled: boolean;
    }>;
    trainAllFiles(storeId: string): Promise<any[]>;
    chat(dto: {
        storeId: string;
        query: string;
    }): Promise<import("../dify/dto/dify.dto").DifyResponse>;
}
export {};
