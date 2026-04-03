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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const session_service_1 = require("../session/session.service");
const message_service_1 = require("../message/message.service");
const dify_service_1 = require("../dify/dify.service");
const handoff_service_1 = require("../handoff/handoff.service");
const user_service_1 = require("../user/user.service");
const store_service_1 = require("../store/store.service");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let ChatService = ChatService_1 = class ChatService {
    constructor(sessionService, messageService, difyService, handoffService, userService, storeService, prisma) {
        this.sessionService = sessionService;
        this.messageService = messageService;
        this.difyService = difyService;
        this.handoffService = handoffService;
        this.userService = userService;
        this.storeService = storeService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async createOrResumeSession(dto) {
        this.logger.log(`Creating or resuming session for phone: ${dto.phone}, storeId: ${dto.storeId}`);
        const user = await this.userService.findOrCreateByPhone(dto.phone);
        this.logger.debug(`User found/created: ${user.id}`);
        const store = await this.storeService.findOrCreateStore(dto.storeId, dto.storeId, dto.storeType);
        this.logger.debug(`Store found/created: ${store.id}`);
        const result = await this.sessionService.createOrResume(user.id, store.id, dto.storeType, dto.channel);
        const session = result.session;
        return {
            sessionId: session.id,
            status: session.status,
            isNew: result.isNew,
            difyConversationId: session.difyConversationId,
        };
    }
    async sendMessage(sessionId, dto, onChunk) {
        this.logger.log(`Sending message to session: ${sessionId}`);
        const session = await this.sessionService.findById(sessionId);
        if (session.status === client_1.SessionStatus.HANDOFF) {
            throw new common_1.BadRequestException('会话已转人工，无法继续发送消息');
        }
        if (this.handoffService.isHandoffTrigger(dto.message)) {
            this.logger.log(`Message triggered handoff for session: ${sessionId}`);
            const handoffResult = await this.handoffService.createTicket(sessionId, '用户主动触发转人工');
            await this.messageService.create(sessionId, client_1.SenderType.USER, dto.message, client_1.MessageType.TEXT);
            const handoffMessage = `您已成功转接人工客服，当前排队号：${handoffResult.queueNo}。请稍候...`;
            await this.messageService.create(sessionId, client_1.SenderType.AI, handoffMessage, client_1.MessageType.TEXT);
            return {
                messageId: '',
                answer: handoffMessage,
                conversationId: session.difyConversationId || '',
            };
        }
        const userMessage = await this.messageService.create(sessionId, client_1.SenderType.USER, dto.message, client_1.MessageType.TEXT);
        this.logger.debug(`User message saved: ${userMessage.id}`);
        const difyInputs = dto.inputs ? {
            phone: dto.inputs.phone,
            store_id: dto.inputs.store_id,
            store_type: dto.inputs.store_type,
            channel: dto.inputs.channel,
            customer_id: dto.inputs.customer_id,
        } : undefined;
        const difyDto = {
            query: dto.message,
            inputs: difyInputs,
        };
        const difyResponse = await this.difyService.sendMessage(session.difyConversationId, difyDto, onChunk);
        this.logger.debug(`Dify response received: ${difyResponse.messageId}`);
        if (!session.difyConversationId && difyResponse.conversationId) {
            await this.sessionService.updateDifyConversationId(sessionId, difyResponse.conversationId);
            this.logger.debug(`Dify conversation ID saved: ${difyResponse.conversationId}`);
        }
        const aiMessage = await this.messageService.create(sessionId, client_1.SenderType.AI, difyResponse.answer, client_1.MessageType.TEXT);
        this.logger.debug(`AI message saved: ${aiMessage.id}`);
        return {
            messageId: aiMessage.id,
            answer: difyResponse.answer,
            conversationId: difyResponse.conversationId,
        };
    }
    async getMessages(sessionId, limit = 50, offset = 0) {
        await this.sessionService.findById(sessionId);
        const messages = await this.messageService.findBySessionId(sessionId, limit, offset);
        return messages.map((msg) => ({
            id: msg.id,
            sessionId: msg.sessionId,
            senderType: msg.senderType,
            content: msg.content,
            messageType: msg.messageType,
            createdAt: msg.createdAt,
        }));
    }
    async getSession(sessionId) {
        const session = await this.sessionService.findById(sessionId);
        return {
            id: session.id,
            userId: session.userId,
            storeId: session.storeId,
            storeType: session.storeType,
            channel: session.channel,
            difyConversationId: session.difyConversationId,
            status: session.status,
            lastActiveAt: session.lastActiveAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_service_1.SessionService,
        message_service_1.MessageService,
        dify_service_1.DifyService,
        handoff_service_1.HandoffService,
        user_service_1.UserService,
        store_service_1.StoreService,
        prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map