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
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let SessionService = SessionService_1 = class SessionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionService_1.name);
    }
    async createOrResume(userId, storeId, storeType, channel) {
        const existingSession = await this.prisma.chatSession.findFirst({
            where: {
                userId,
                storeId,
                status: {
                    in: [client_1.SessionStatus.OPEN, client_1.SessionStatus.HANDOFF],
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (existingSession) {
            let updatedSession = existingSession;
            if (existingSession.status === client_1.SessionStatus.HANDOFF) {
                updatedSession = await this.prisma.chatSession.update({
                    where: { id: existingSession.id },
                    data: { status: client_1.SessionStatus.OPEN, lastActiveAt: new Date() },
                });
            }
            else {
                updatedSession = await this.prisma.chatSession.update({
                    where: { id: existingSession.id },
                    data: { lastActiveAt: new Date() },
                });
            }
            return { session: updatedSession, isNew: false };
        }
        const newSession = await this.prisma.chatSession.create({
            data: {
                userId,
                storeId,
                storeType,
                channel,
                status: client_1.SessionStatus.OPEN,
            },
        });
        return { session: newSession, isNew: true };
    }
    async findById(id) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session with ID ${id} not found`);
        }
        return session;
    }
    async updateDifyConversationId(sessionId, difyConversationId) {
        return this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { difyConversationId },
        });
    }
    async updateStatus(sessionId, status) {
        return this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { status, lastActiveAt: new Date() },
        });
    }
    async findByUserAndStore(userId, storeId) {
        return this.prisma.chatSession.findFirst({
            where: {
                userId,
                storeId,
                status: {
                    in: [client_1.SessionStatus.OPEN, client_1.SessionStatus.HANDOFF],
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionService);
//# sourceMappingURL=session.service.js.map