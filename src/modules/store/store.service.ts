import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { Store, StoreType } from '@prisma/client';
import { CreateStoreDto, StoreResponseDto } from './dto/store.dto';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(private prisma: PrismaService) {}

  // 获取所有店铺
  async findAll(): Promise<Store[]> {
    this.logger.log('Finding all stores');
    return this.prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // 创建店铺
  async createStore(name: string, storeType: StoreType): Promise<Store> {
    const id = `store_${Date.now()}`;
    this.logger.log(`Creating store: ${name}, id: ${id}`);
    return this.prisma.store.create({
      data: {
        id,
        name,
        storeType,
      },
    });
  }

  // 查找或创建店铺
  async findOrCreateStore(storeId: string, name: string, storeType: StoreType): Promise<Store> {
    const existingStore = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (existingStore) {
      return existingStore;
    }

    return this.prisma.store.create({
      data: {
        id: storeId,
        name,
        storeType,
      },
    });
  }

  // 通过 ID 查找店铺
  async findById(id: string): Promise<Store | null> {
    return this.prisma.store.findUnique({
      where: { id },
    });
  }

  // 删除店铺及其关联数据
  async deleteStore(id: string): Promise<void> {
    // 先检查店铺是否存在
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('店铺不存在');
    }
    // 删除所有关联的会话（Messages 和 HandoffTickets 会级联删除）
    await this.prisma.chatSession.deleteMany({ where: { storeId: id } });
    // 删除店铺
    await this.prisma.store.delete({ where: { id } });
  }
}