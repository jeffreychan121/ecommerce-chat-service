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
var StoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
let StoreService = StoreService_1 = class StoreService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StoreService_1.name);
    }
    async findAll() {
        this.logger.log('Finding all stores');
        return this.prisma.store.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async createStore(name, storeType) {
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
    async findOrCreateStore(storeId, name, storeType) {
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
    async findById(id) {
        return this.prisma.store.findUnique({
            where: { id },
        });
    }
    async update(id, data) {
        return this.prisma.store.update({
            where: { id },
            data,
        });
    }
    async deleteStore(id) {
        const store = await this.prisma.store.findUnique({ where: { id } });
        if (!store) {
            throw new common_1.NotFoundException('店铺不存在');
        }
        const sessions = await this.prisma.chatSession.findMany({
            where: { storeId: id },
            select: { id: true },
        });
        const sessionIds = sessions.map(s => s.id);
        if (sessionIds.length > 0) {
            await this.prisma.handoffTicket.deleteMany({
                where: { sessionId: { in: sessionIds } },
            });
        }
        await this.prisma.chatSession.deleteMany({ where: { storeId: id } });
        await this.prisma.store.delete({ where: { id } });
    }
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = StoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoreService);
//# sourceMappingURL=store.service.js.map