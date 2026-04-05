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
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let HandoffService = HandoffService_1 = class HandoffService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
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
    async getPendingQueue() {
        const tickets = await this.prisma.handoffTicket.findMany({
            where: { status: client_1.HandoffStatus.PENDING },
            orderBy: { queueNo: 'asc' },
            include: {
                session: {
                    include: { user: true, store: true },
                },
            },
        });
        const grouped = new Map();
        for (const ticket of tickets) {
            const key = `${ticket.session.user.phone}-${ticket.session.storeId}`;
            if (!grouped.has(key)) {
                grouped.set(key, ticket);
            }
        }
        const uniqueTickets = Array.from(grouped.values());
        const sessionIds = uniqueTickets.map(t => t.sessionId);
        const lastMessages = await this.getLastMessages(sessionIds);
        return uniqueTickets.map(t => ({
            ticketId: t.id,
            queueNo: t.queueNo,
            sessionId: t.sessionId,
            userPhone: t.session.user.phone,
            storeId: t.session.storeId,
            storeName: t.session.store.name,
            storeType: t.session.store.storeType,
            lastMessage: lastMessages[t.sessionId] || '',
            createdAt: t.createdAt.toISOString(),
        }));
    }
    async getLastMessages(sessionIds) {
        if (sessionIds.length === 0)
            return {};
        const messages = await this.prisma.chatMessage.findMany({
            where: { sessionId: { in: sessionIds } },
            orderBy: { createdAt: 'desc' },
            select: { sessionId: true, content: true },
            distinct: ['sessionId'],
        });
        return messages.reduce((acc, m) => {
            acc[m.sessionId] = m.content;
            return acc;
        }, {});
    }
    async acceptSession(sessionId) {
        const ticket = await this.prisma.handoffTicket.findFirst({
            where: { sessionId, status: client_1.HandoffStatus.PENDING },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('会话不存在或已处理');
        }
        await this.prisma.handoffTicket.update({
            where: { id: ticket.id },
            data: {
                status: client_1.HandoffStatus.ANSWERED,
                agentJoinedAt: new Date(),
            },
        });
        return { success: true, ticketId: ticket.id };
    }
    async closeSession(sessionId) {
        const ticket = await this.prisma.handoffTicket.findFirst({
            where: { sessionId, status: client_1.HandoffStatus.ANSWERED },
        });
        if (ticket) {
            await this.prisma.handoffTicket.update({
                where: { id: ticket.id },
                data: { status: client_1.HandoffStatus.CLOSED, closedAt: new Date() },
            });
        }
        await this.prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: client_1.SessionStatus.CLOSED },
        });
        return { success: true };
    }
    async sendAgentMessage(sessionId, content) {
        const message = await this.prisma.chatMessage.create({
            data: {
                sessionId,
                senderType: client_1.SenderType.HUMAN,
                content,
                messageType: client_1.MessageType.TEXT,
            },
        });
        const result = {
            id: message.id,
            senderType: message.senderType,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
        };
        this.eventEmitter.emit('agent.message', { sessionId, message: result });
        return result;
    }
    async getSessionMessages(sessionId) {
        const messages = await this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
        return messages.map(m => ({
            id: m.id,
            senderType: m.senderType,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
        }));
    }
    async getSessionDetail(sessionId) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                user: true,
                store: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        const messages = await this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
        return {
            session: {
                id: session.id,
                userId: session.userId,
                storeId: session.storeId,
                status: session.status,
            },
            messages: messages.map(m => ({
                id: m.id,
                senderType: m.senderType,
                content: m.content,
                messageType: m.messageType,
                createdAt: m.createdAt.toISOString(),
            })),
            store: {
                id: session.store.id,
                name: session.store.name,
                storeType: session.store.storeType,
            },
            user: {
                phone: session.user.phone,
            },
        };
    }
    async getHistory(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [tickets, total] = await Promise.all([
            this.prisma.handoffTicket.findMany({
                where: {
                    status: { in: [client_1.HandoffStatus.ANSWERED, client_1.HandoffStatus.CLOSED] },
                },
                include: {
                    session: {
                        include: { user: true, store: true },
                    },
                },
                orderBy: { agentJoinedAt: 'desc' },
            }),
            this.prisma.handoffTicket.count({
                where: { status: { in: [client_1.HandoffStatus.ANSWERED, client_1.HandoffStatus.CLOSED] } },
            }),
        ]);
        const grouped = new Map();
        for (const ticket of tickets) {
            const key = `${ticket.session.user.phone}-${ticket.session.storeId}`;
            if (!grouped.has(key)) {
                grouped.set(key, ticket);
            }
        }
        const uniqueTickets = Array.from(grouped.values()).slice(skip, skip + limit);
        const sessionIds = uniqueTickets.map(t => t.sessionId);
        const lastMessages = await this.getLastMessages(sessionIds);
        return {
            items: uniqueTickets.map(t => ({
                ticketId: t.id,
                sessionId: t.sessionId,
                queueNo: t.queueNo,
                userPhone: t.session.user.phone,
                storeId: t.session.storeId,
                storeName: t.session.store.name,
                storeType: t.session.store.storeType,
                lastMessage: lastMessages[t.sessionId] || '',
                createdAt: t.createdAt.toISOString(),
                agentJoinedAt: t.agentJoinedAt?.toISOString() || '',
                closedAt: t.closedAt?.toISOString() || '',
                status: t.status,
            })),
            total: grouped.size,
            page,
            limit,
        };
    }
};
exports.HandoffService = HandoffService;
exports.HandoffService = HandoffService = HandoffService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, event_emitter_1.EventEmitter2])
], HandoffService);
//# sourceMappingURL=handoff.service.js.map