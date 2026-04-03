import { PrismaService } from '../../infra/database/prisma.service';
import { Store, StoreType } from '@prisma/client';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    findOrCreateStore(storeId: string, name: string, storeType: StoreType): Promise<Store>;
    findById(id: string): Promise<Store | null>;
}
