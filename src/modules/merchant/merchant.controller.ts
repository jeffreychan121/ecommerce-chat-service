import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MerchantService } from './merchant.service';

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
@Controller('api/merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  // 获取店铺知识库状态
  @Get('status/:storeId')
  async getStatus(@Param('storeId') storeId: string) {
    return this.merchantService.getStoreStatus(storeId);
  }

  // 创建知识库（支持自定义参数）
  @Post('dataset/:storeId')
  async createDataset(
    @Param('storeId') storeId: string,
    @Body() dto: {
      name?: string;
      description?: string;
      indexing_technique?: string;
      permission?: string;
      search_method?: string;
      top_k?: number;
      score_threshold_enabled?: boolean;
      score_threshold?: number;
      doc_form?: string;
    } = {},
  ) {
    return this.merchantService.createDatasetForStore(storeId, dto);
  }

  // 删除知识库
  @Delete('dataset/:storeId')
  async deleteDataset(@Param('storeId') storeId: string) {
    return this.merchantService.deleteDataset(storeId);
  }

  // 上传文件
  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadFile(
    @UploadedFile() file: UploadedFile,
    @Body('storeId') storeId: string,
  ) {
    return this.merchantService.uploadFile(storeId, file);
  }

  // 获取文件列表
  @Get('files/:storeId')
  async getFiles(@Param('storeId') storeId: string) {
    return this.merchantService.getFiles(storeId);
  }

  // 删除文件
  @Delete('files/:jobId')
  async deleteFile(@Param('jobId') jobId: string) {
    return this.merchantService.deleteFile(jobId);
  }

  // 训练文件
  @Post('files/:jobId/train')
  async trainFile(@Param('jobId') jobId: string) {
    return this.merchantService.trainFile(jobId);
  }

  // 启用文档
  @Post('files/:jobId/enable')
  async enableFile(@Param('jobId') jobId: string) {
    return this.merchantService.toggleDocumentEnabled(jobId, true);
  }

  // 禁用文档
  @Post('files/:jobId/disable')
  async disableFile(@Param('jobId') jobId: string) {
    return this.merchantService.toggleDocumentEnabled(jobId, false);
  }

  // 训练所有文件
  @Post('files/:storeId/train-all')
  async trainAllFiles(@Param('storeId') storeId: string) {
    return this.merchantService.trainAllFiles(storeId);
  }

  // AI 测试聊天
  @Post('chat')
  async chat(@Body() dto: { storeId: string; query: string }) {
    return this.merchantService.chat(dto.storeId, dto.query);
  }
}
