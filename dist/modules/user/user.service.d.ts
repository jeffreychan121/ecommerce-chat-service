import { PrismaService } from '../../infra/database/prisma.service';
import { User } from '@prisma/client';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findOrCreateByPhone(phone: string): Promise<User>;
    findByPhone(phone: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
}
