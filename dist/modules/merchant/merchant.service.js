"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MerchantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store/store.service");
const dify_service_1 = require("../dify/dify.service");
const prisma_service_1 = require("../../infra/database/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let MerchantService = MerchantService_1 = class MerchantService {
    constructor(storeService, difyService, prisma) {
        this.storeService = storeService;
        this.difyService = difyService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(MerchantService_1.name);
        this.MAX_FILE_SIZE = 10 * 1024 * 1024;
        this.ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.md'];
    }
    async getStoreStatus(storeId) {
        const store = await this.storeService.findById(storeId);
        if (!store) {
            throw new common_1.BadRequestException('店铺不存在');
        }
        return {
            storeId: store.id,
            storeName: store.name,
            hasDataset: !!store.difyDatasetId,
            datasetId: store.difyDatasetId || null,
            fileCount: await this.prisma.trainingJob.count({ where: { storeId } }),
        };
    }
    async createDatasetForStore(storeId) {
        const store = await this.storeService.findById(storeId);
        if (!store) {
            throw new common_1.BadRequestException('店铺不存在');
        }
        if (store.difyDatasetId) {
            return { datasetId: store.difyDatasetId };
        }
        const dataset = await this.difyService.createDataset(`Store-${store.name}`, `商家知识库 - ${store.name}`);
        await this.storeService.update(storeId, { difyDatasetId: dataset.id });
        this.logger.log(`为店铺 ${store.name} 创建知识库: ${dataset.id}`);
        return { datasetId: dataset.id };
    }
    async uploadFile(storeId, file) {
        if (!file) {
            throw new common_1.BadRequestException('请选择文件');
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('文件大小不能超过 10MB');
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new common_1.BadRequestException(`不支持的文件类型，允许的类型: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
        }
        const store = await this.storeService.findById(storeId);
        if (!store) {
            throw new common_1.BadRequestException('店铺不存在');
        }
        const job = await this.prisma.trainingJob.create({
            data: {
                storeId,
                fileName: file.originalname,
                filePath: file.path,
                status: 'PENDING',
            },
        });
        return {
            id: job.id,
            fileName: job.fileName,
            status: job.status,
            createdAt: job.createdAt,
        };
    }
    async getFiles(storeId) {
        return this.prisma.trainingJob.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteFile(jobId) {
        const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
        if (!job) {
            throw new common_1.BadRequestException('文件不存在');
        }
        try {
            await fs.promises.unlink(job.filePath);
        }
        catch (e) {
            this.logger.warn(`删除本地文件失败: ${job.filePath}`);
        }
        await this.prisma.trainingJob.delete({ where: { id: jobId } });
        return { success: true };
    }
    async trainFile(jobId) {
        const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
        if (!job) {
            throw new common_1.BadRequestException('文件不存在');
        }
        const store = await this.storeService.findById(job.storeId);
        if (!store || !store.difyDatasetId) {
            throw new common_1.BadRequestException('店铺未配置知识库');
        }
        await this.prisma.trainingJob.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        try {
            await this.difyService.createDocument(store.difyDatasetId, job.filePath);
            await this.prisma.trainingJob.update({
                where: { id: jobId },
                data: { status: 'COMPLETED', completedAt: new Date() },
            });
            return { success: true, status: 'COMPLETED' };
        }
        catch (error) {
            await this.prisma.trainingJob.update({
                where: { id: jobId },
                data: { status: 'FAILED', errorMessage: error.message },
            });
            throw error;
        }
    }
    async trainAllFiles(storeId) {
        const jobs = await this.prisma.trainingJob.findMany({
            where: { storeId, status: { in: ['PENDING', 'FAILED'] } },
        });
        const results = [];
        for (const job of jobs) {
            try {
                const result = await this.trainFile(job.id);
                results.push({ jobId: job.id, ...result });
            }
            catch (error) {
                results.push({ jobId: job.id, success: false, error: error.message });
            }
        }
        return results;
    }
    async chat(storeId, query) {
        const store = await this.storeService.findById(storeId);
        if (!store || !store.difyDatasetId) {
            throw new common_1.BadRequestException('店铺未配置知识库');
        }
        return this.difyService.sendMessage(null, {
            query,
            inputs: { dataset_id: store.difyDatasetId },
        });
    }
};
exports.MerchantService = MerchantService;
exports.MerchantService = MerchantService = MerchantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService,
        dify_service_1.DifyService,
        prisma_service_1.PrismaService])
], MerchantService);
//# sourceMappingURL=merchant.service.js.map