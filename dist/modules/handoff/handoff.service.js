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
var HandoffService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let HandoffService = HandoffService_1 = class HandoffService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(HandoffService_1.name);
    }
    async createTicket(sessionId, reason) {
        const lastTicket = await this.prisma.handoffTicket.findFirst({
            orderBy: { queueNo: 'desc' },
        });
        const queueNo = (lastTicket?.queueNo || 0) + 1;
        const ticket = await this.prisma.handoffTicket.create({
            data: {
                sessionId,
                status: client_1.HandoffStatus.PENDING,
                queueNo,
            },
        });
        await this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: client_1.SessionStatus.HANDOFF },
        });
        this.logger.log(`Created handoff ticket ${ticket.id} for session ${sessionId}, queueNo: ${queueNo}`);
        return {
            success: true,
            message: '转人工成功',
            queueNo: ticket.queueNo,
            ticketId: ticket.id,
        };
    }
    async findBySessionId(sessionId) {
        return this.prisma.handoffTicket.findFirst({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(ticketId, status) {
        return this.prisma.handoffTicket.update({
            where: { id: ticketId },
            data: { status },
        });
    }
    isHandoffTrigger(content) {
        const keywords = ['转人工', '人工客服', '联系客服', '客服', '投诉', '我要人工', '人工'];
        const lowerContent = content.toLowerCase();
        return keywords.some((keyword) => lowerContent.includes(keyword));
    }
};
exports.HandoffService = HandoffService;
exports.HandoffService = HandoffService = HandoffService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HandoffService);
//# sourceMappingURL=handoff.service.js.map