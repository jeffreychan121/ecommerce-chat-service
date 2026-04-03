import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { Store, StoreType } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

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
}
