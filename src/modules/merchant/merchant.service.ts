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

  // 自动创建知识库（店铺入驻时调用）
  async createDatasetForStore(storeId: string, storeName: string): Promise<string> {
    const dataset = await this.difyService.createDataset(
      `Store-${storeName}`,
      `商家知识库 - ${storeName}`
    );
    await this.storeService.update(storeId, { difyDatasetId: dataset.id });
    return dataset.id;
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

    // 删除本地文件
    try {
      await fs.promises.unlink(job.filePath);
    } catch (e) {
      this.logger.warn(`删除本地文件失败: ${job.filePath}`);
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

    const store = await this.storeService.findById(job.storeId);
    if (!store || !store.difyDatasetId) {
      throw new BadRequestException('店铺未配置知识库');
    }

    // 更新状态为 PROCESSING
    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      // 调用 Dify API 上传文档
      await this.difyService.createDocument(store.difyDatasetId, job.filePath);

      await this.prisma.trainingJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date() },
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
