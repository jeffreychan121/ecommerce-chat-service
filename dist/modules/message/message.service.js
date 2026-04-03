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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let MessageService = class MessageService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(sessionId, senderType, content, messageType = client_1.MessageType.TEXT, rawPayload) {
        return this.prisma.chatMessage.create({
            data: {
                sessionId,
                senderType,
                content,
                messageType,
                rawPayload: rawPayload,
            },
        });
    }
    async findBySessionId(sessionId, limit = 50, offset = 0) {
        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: {
                createdAt: 'asc',
            },
            take: limit,
            skip: offset,
        });
    }
    async countBySessionId(sessionId) {
        return this.prisma.chatMessage.count({
            where: { sessionId },
        });
    }
    async createMany(data) {
        return this.prisma.chatMessage.createMany({
            data: data.map(item => ({
                ...item,
                rawPayload: item.rawPayload,
            })),
        });
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessageService);
//# sourceMappingURL=message.service.js.map