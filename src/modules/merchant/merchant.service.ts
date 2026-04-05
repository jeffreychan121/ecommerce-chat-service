import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { DifyService } from '../dify/dify.service';
import { PrismaService } from '../../infra/database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// 文件类型定义
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

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.md'];

  constructor(
    private readonly storeService: StoreService,
    private readonly difyService: DifyService,
    private readonly prisma: PrismaService,
  ) {}

  // 获取店铺知识库状态
  async getStoreStatus(storeId: string) {
    const store = await this.storeService.findById(storeId);
    if (!store) {
      throw new BadRequestException('店铺不存在');
    }
    return {
      storeId: store.id,
      storeName: store.name,
      hasDataset: !!store.difyDatasetId,
      datasetId: store.difyDatasetId || null,
      fileCount: await this.prisma.trainingJob.count({ where: { storeId } }),
    };
  }

  // 创建知识库（手动调用）
  async createDatasetForStore(
    storeId: string,
    options?: {
      name?: string;
      description?: string;
      indexing_technique?: string;
      permission?: string;
      search_method?: string;
      top_k?: number;
      score_threshold_enabled?: boolean;
      score_threshold?: number;
      doc_form?: string;
    },
  ): Promise<{ datasetId: string }> {
    const store = await this.storeService.findById(storeId);
    if (!store) {
      throw new BadRequestException('店铺不存在');
    }

    // 如果已有知识库，返回已有ID
    if (store.difyDatasetId) {
      return { datasetId: store.difyDatasetId };
    }

    // 构建知识库参数
    const name = options?.name || `${store.name} 知识库`;
    const description = options?.description || `商家 ${store.name} 的知识库`;

    // 调用 Dify API 创建知识库
    const dataset = await this.difyService.createDataset({
      name,
      description,
      indexing_technique: options?.indexing_technique || 'high_quality',
      permission: options?.permission || 'only_me',
      retrieval_model: {
        search_method: options?.search_method || 'semantic_search',
        top_k: options?.top_k || 2,
        reranking_enable: false,
        score_threshold_enabled: options?.score_threshold_enabled || false,
        score_threshold: options?.score_threshold || 0,
      },
      doc_form: options?.doc_form || 'text_model',
    });

    // 保存知识库ID到店铺
    await this.storeService.update(storeId, { difyDatasetId: dataset.id });

    this.logger.log(`为店铺 ${store.name} 创建知识库: ${dataset.id}`);
    return { datasetId: dataset.id };
  }

  // 删除知识库
  async deleteDataset(storeId: string): Promise<{ success: boolean }> {
    const store = await this.storeService.findById(storeId);
    if (!store) {
      throw new BadRequestException('店铺不存在');
    }

    if (!store.difyDatasetId) {
      throw new BadRequestException('该店铺没有知识库');
    }

    // 调用 Dify API 删除知识库
    await this.difyService.deleteDataset(store.difyDatasetId);

    // 清除店铺的知识库ID
    await this.storeService.update(storeId, { difyDatasetId: null });

    // 删除该店铺下的所有训练任务
    await this.prisma.trainingJob.deleteMany({ where: { storeId } });

    this.logger.log(`删除店铺 ${store.name} 的知识库: ${store.difyDatasetId}`);
    return { success: true };
  }

  // 上传文件
  async uploadFile(storeId: string, file: UploadedFile) {
    // 验证文件
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小不能超过 10MB');
    }

    // 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`不支持的文件类型，允许的类型: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // 确保店铺存在
    const store = await this.storeService.findById(storeId);
    if (!store) {
      throw new BadRequestException('店铺不存在');
    }

    // 创建训练任务记录
    const job = await this.prisma.trainingJob.create({
      data: {
        storeId,
        fileName: file.originalname,
        filePath: path.resolve(file.path),  // 使用绝对路径
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

  // 获取文件列表
  async getFiles(storeId: string) {
    return this.prisma.trainingJob.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 删除文件
  async deleteFile(jobId: string) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new BadRequestException('文件不存在');
    }

    // 获取店铺信息以获取知识库ID
    const store = await this.storeService.findById(job.storeId);

    // 删除本地文件
    try {
      const absoluteFilePath = path.resolve(process.cwd(), job.filePath);
      await fs.promises.unlink(absoluteFilePath);
    } catch (e) {
      this.logger.warn(`删除本地文件失败: ${job.filePath}`);
    }

    // 如果知识库存在且文件已完成训练且有 Dify documentId，则删除 Dify 中的文档
    if (store?.difyDatasetId && job.difyDocumentId) {
      try {
        await this.difyService.deleteDocument(store.difyDatasetId, job.difyDocumentId);
        this.logger.log(`已删除 Dify 知识库中的文档: ${job.difyDocumentId}`);
      } catch (e) {
        this.logger.warn(`删除 Dify 文档失败: ${e.message}`);
      }
    }

    // 删除数据库记录
    await this.prisma.trainingJob.delete({ where: { id: jobId } });
    return { success: true };
  }

  // 训练单个文件
  async trainFile(jobId: string) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new BadRequestException('文件不存在');
    }

    // 检查文件状态，如果是已完成则不允许重复训练
    if (job.status === 'COMPLETED') {
      throw new BadRequestException('文件已完成训练，请勿重复训练');
    }

    // 如果正在训练中，也不允许重复训练
    if (job.status === 'PROCESSING') {
      throw new BadRequestException('文件正在训练中，请稍后再试');
    }

    const store = await this.storeService.findById(job.storeId);
    if (!store || !store.difyDatasetId) {
      throw new BadRequestException('店铺未配置知识库');
    }

    // 使用绝对路径
    const absoluteFilePath = path.resolve(process.cwd(), job.filePath);
    this.logger.log(`训练文件: ${absoluteFilePath}`);

    // 更新状态为 PROCESSING
    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      // 调用 Dify API 上传文档
      const result = await this.difyService.createDocument(store.difyDatasetId, absoluteFilePath);

      await this.prisma.trainingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          difyDocumentId: result.documentId,
        },
      });

      return { success: true, status: 'COMPLETED' };
    } catch (error) {
      await this.prisma.trainingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw error;
    }
  }

  // 训练所有文件
  async trainAllFiles(storeId: string) {
    const jobs = await this.prisma.trainingJob.findMany({
      where: { storeId, status: { in: ['PENDING', 'FAILED'] } },
    });

    const results = [];
    for (const job of jobs) {
      try {
        const result = await this.trainFile(job.id);
        results.push({ jobId: job.id, ...result });
      } catch (error) {
        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // 启用/禁用文档
  async toggleDocumentEnabled(jobId: string, enabled: boolean) {
    const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new BadRequestException('文件不存在');
    }

    // 获取店铺信息
    const store = await this.storeService.findById(job.storeId);
    if (!store || !store.difyDatasetId) {
      throw new BadRequestException('店铺未配置知识库');
    }

    if (!job.difyDocumentId) {
      throw new BadRequestException('文件未训练，无法切换状态');
    }

    // 调用 Dify API（如果失败则只更新本地状态）
    try {
      if (enabled) {
        await this.difyService.enableDocument(store.difyDatasetId, job.difyDocumentId);
      } else {
        await this.difyService.disableDocument(store.difyDatasetId, job.difyDocumentId);
      }
    } catch (error: any) {
      this.logger.warn(`切换文档启用状态失败: ${error.message}，仅更新本地状态`);
    }

    // 更新本地状态
    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data: { enabled },
    });

    return { success: true, enabled };
  }

  // AI 测试聊天
  async chat(storeId: string, query: string) {
    const store = await this.storeService.findById(storeId);
    if (!store || !store.difyDatasetId) {
      throw new BadRequestException('店铺未配置知识库');
    }

    return this.difyService.sendMessage(null, {
      query,
      inputs: { dataset_id: store.difyDatasetId },
    });
  }
}
