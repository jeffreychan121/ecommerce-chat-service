import { PrismaService } from '../../infra/database/prisma.service';
import { Store, StoreType } from '@prisma/client';
export declare class StoreService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<Store[]>;
    createStore(name: string, storeType: StoreType): Promise<Store>;
    findOrCreateStore(storeId: string, name: string, storeType: StoreType): Promise<Store>;
    findById(id: string): Promise<Store | null>;
    update(id: string, data: Partial<Store>): Promise<Store>;
    deleteStore(id: string): Promise<void>;
}
