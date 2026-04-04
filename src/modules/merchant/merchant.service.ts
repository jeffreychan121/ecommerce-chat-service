import { Injectable, Logger } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { DifyService } from '../dify/dify.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

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
}
