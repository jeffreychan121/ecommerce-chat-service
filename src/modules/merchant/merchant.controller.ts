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
