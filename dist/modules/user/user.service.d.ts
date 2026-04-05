import { PrismaService } from '../../infra/database/prisma.service';
import { User } from '@prisma/client';
export interface UserWithStore {
    userId: string;
    phone: string;
    storeId: string | null;
    storeName: string | null;
}
export declare class UserService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findOrCreateWithStore(phone: string): Promise<UserWithStore>;
    findWithStore(phone: string): Promise<UserWithStore | null>;
    findOrCreateByPhone(phone: string): Promise<User>;
    findByPhone(phone: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
}
