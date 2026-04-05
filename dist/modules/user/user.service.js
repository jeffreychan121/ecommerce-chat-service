"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
let UserService = UserService_1 = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UserService_1.name);
    }
    async findOrCreateWithStore(phone) {
        let user = await this.prisma.user.findUnique({
            where: { phone },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: { phone },
            });
        }
        let store = await this.prisma.store.findFirst({
            where: { name: { startsWith: `Store-${phone}` } },
        });
        if (!store) {
            store = await this.prisma.store.create({
                data: {
                    name: `Store-${phone}`,
                    storeType: 'MERCHANT',
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
    async findWithStore(phone) {
        const user = await this.prisma.user.findUnique({
            where: { phone },
        });
        if (!user) {
            return null;
        }
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
    async findOrCreateByPhone(phone) {
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
    async findByPhone(phone) {
        return this.prisma.user.findUnique({
            where: { phone },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map