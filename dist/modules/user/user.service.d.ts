import { PrismaService } from '../../infra/database/prisma.service';
import { User } from '@prisma/client';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findOrCreateByPhone(phone: string): Promise<User>;
    findById(id: string): Promise<User | null>;
}
