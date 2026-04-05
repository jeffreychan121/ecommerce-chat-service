import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { User, Store, Prisma } from '@prisma/client';

export interface UserWithStore {
  userId: string;
  phone: string;
  storeId: string | null;
  storeName: string | null;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  // 登录时返回用户和店铺信息
  async findOrCreateWithStore(phone: string): Promise<UserWithStore> {
    // 查找用户
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone },
      });
    }

    // 查找或创建店铺（每个用户一个第三方店铺）
    let store = await this.prisma.store.findFirst({
      where: { name: { startsWith: `Store-${phone}` } },
    });

    if (!store) {
      // 创建新店铺
      store = await this.prisma.store.create({
        data: {
          name: `Store-${phone}`,
          storeType: 'MERCHANT' as any,
          fileStoragePath: `./uploads/${phone}`,
        },
      });
    }

    return {
      userId: user.id,
      phone: user.phone,
      storeId: store.id,
      storeName: store.name,
    };
  }

  // 获取用户和店铺信息
  async findWithStore(phone: string): Promise<UserWithStore | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return null;
    }

    // 查找店铺
    const store = await this.prisma.store.findFirst({
      where: { name: { startsWith: `Store-${phone}` } },
    });

    return {
      userId: user.id,
      phone: user.phone,
      storeId: store?.id || null,
      storeName: store?.name || null,
    };
  }

  // 通过手机号查找或创建用户
  async findOrCreateByPhone(phone: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: { phone },
    });
  }

  // 通过手机号查找用户
  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  // 通过 ID 查找用户
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
