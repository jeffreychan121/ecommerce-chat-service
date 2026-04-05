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
    createDataset(storeId: string): Promise<{
        datasetId: string;
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
    chat(dto: {
        storeId: string;
        query: string;
    }): Promise<import("../dify/dto/dify.dto").DifyResponse>;
}
export {};
