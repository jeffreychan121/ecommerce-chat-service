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
const event_emitter_1 = require("@nestjs/event-emitter");
const session_service_1 = require("../session/session.service");
const message_service_1 = require("../message/message.service");
const dify_service_1 = require("../dify/dify.service");
const handoff_service_1 = require("../handoff/handoff.service");
const user_service_1 = require("../user/user.service");
const store_service_1 = require("../store/store.service");
const order_service_1 = require("../order/order.service");
const intent_router_service_1 = require("../intent-router/intent-router.service");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
let ChatService = ChatService_1 = class ChatService {
    constructor(sessionService, messageService, difyService, handoffService, userService, storeService, orderService, intentRouterService, prisma, eventEmitter) {
        this.sessionService = sessionService;
        this.messageService = messageService;
        this.difyService = difyService;
        this.handoffService = handoffService;
        this.userService = userService;
        this.storeService = storeService;
        this.orderService = orderService;
        this.intentRouterService = intentRouterService;
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
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
        this.logger.log(`>>> [ChatService] 发送消息到会话: ${sessionId}, message: ${dto.message}, inputs: ${JSON.stringify(dto.inputs)}`);
        const session = await this.sessionService.findById(sessionId);
        this.logger.log(`>>> [ChatService] 会话状态: ${session.status}, difyConversationId: ${session.difyConversationId}`);
        if (session.status === client_1.SessionStatus.HANDOFF) {
            const userMessage = await this.messageService.create(sessionId, client_1.SenderType.USER, dto.message, client_1.MessageType.TEXT);
            this.logger.debug(`User message saved in handoff mode: ${userMessage.id}`);
            this.eventEmitter.emit('customer.message', {
                sessionId,
                message: {
                    id: userMessage.id,
                    senderType: client_1.SenderType.USER,
                    content: dto.message,
                    createdAt: userMessage.createdAt.toISOString(),
                },
            });
            return {
                messageId: userMessage.id,
                answer: '',
                conversationId: session.difyConversationId || '',
            };
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
        const intentResult = this.intentRouterService.route(dto.message);
        this.logger.log(`Intent routed: ${intentResult.intent}, orderNo: ${intentResult.orderNo}, needMoreInfo: ${intentResult.needMoreInfo}`);
        if (intentResult.intent === intent_router_service_1.BusinessIntent.ORDER_CREATE) {
            const orderResponse = await this.handleOrderCreate(intentResult.productName || '', intentResult.quantity || 1);
            await this.messageService.create(sessionId, client_1.SenderType.USER, dto.message, client_1.MessageType.TEXT);
            const aiMessage = await this.messageService.create(sessionId, client_1.SenderType.AI, orderResponse, client_1.MessageType.TEXT);
            return {
                messageId: aiMessage.id,
                answer: orderResponse,
                conversationId: session.difyConversationId || '',
            };
        }
        const aiResponse = await this.handleAIQuery(dto, session.difyConversationId, onChunk);
        const aiMessage = await this.messageService.create(sessionId, client_1.SenderType.AI, aiResponse, client_1.MessageType.TEXT);
        this.logger.debug(`AI message saved: ${aiMessage.id}`);
        return {
            messageId: aiMessage.id,
            answer: aiResponse,
            conversationId: session.difyConversationId || '',
        };
    }
    async handleOrderQuery(orderNo) {
        try {
            const order = await this.orderService.getOrderStatus(orderNo);
            return this.formatOrderResponse(order);
        }
        catch (error) {
            this.logger.error(`Order query failed: ${error.message}`);
            return `未找到订单 ${orderNo} 的信息，请确认订单号是否正确。`;
        }
    }
    async handleLogisticsQuery(orderNo) {
        try {
            const logistics = await this.orderService.getLogistics(orderNo);
            return this.formatLogisticsResponse(logistics);
        }
        catch (error) {
            this.logger.error(`Logistics query failed: ${error.message}`);
            return `未找到订单 ${orderNo} 的物流信息，请确认订单号是否正确。`;
        }
    }
    async handleOrderCreate(productName, quantity) {
        try {
            const order = await this.orderService.createOrderFromChat(productName, quantity);
            this.eventEmitter.emit('order.created', order);
            const lines = [
                '订单已创建！',
                '',
                `订单号：${order.orderNo}`,
                `商品：${order.items?.[0]?.title || productName} x ${quantity}`,
                `单价：¥${order.items?.[0]?.price?.toFixed(2) || '0.00'}`,
                `总价：¥${order.actualAmount?.toFixed(2)}`,
                `状态：${order.statusText}`,
            ];
            if (order.logistics) {
                lines.push(`快递：${order.logistics.carrier} ${order.logistics.trackingNo}`);
            }
            return lines.join('\n');
        }
        catch (error) {
            this.logger.error(`handleOrderCreate failed: ${error.message}`);
            return '抱歉，创建订单失败，请稍后重试。';
        }
    }
    async handleAIQuery(dto, conversationId, onChunk) {
        this.logger.log(`>>> [ChatService] handleAIQuery: conversationId=${conversationId}, message=${dto.message}`);
        const difyInputs = dto.inputs ? {
            phone: dto.inputs.phone,
            store_id: dto.inputs.store_id,
            store_type: dto.inputs.store_type,
            channel: dto.inputs.channel,
            customer_id: dto.inputs.customer_id,
        } : undefined;
        this.logger.log(`>>> [ChatService] Dify inputs: ${JSON.stringify(difyInputs)}`);
        const difyDto = {
            query: dto.message,
            inputs: difyInputs,
        };
        const difyResponse = await this.difyService.sendMessage(conversationId, difyDto, onChunk);
        return difyResponse.answer;
    }
    formatOrderResponse(order) {
        const lines = [
            `订单号：${order.orderNo}`,
            `订单状态：${order.statusText}`,
            `订单金额：¥${order.actualAmount}`,
            `下单时间：${new Date(order.createdAt).toLocaleString('zh-CN')}`,
        ];
        if (order.paidAt) {
            lines.push(`支付时间：${new Date(order.paidAt).toLocaleString('zh-CN')}`);
        }
        if (order.estimatedShipTime) {
            lines.push(`预计发货时间：${new Date(order.estimatedShipTime).toLocaleString('zh-CN')}`);
        }
        if (order.items && order.items.length > 0) {
            lines.push('商品信息：');
            for (const item of order.items) {
                lines.push(`  - ${item.title} x${item.quantity}`);
            }
        }
        if (order.shippingAddress) {
            lines.push(`收货地址：${order.shippingAddress}`);
        }
        return lines.join('\n');
    }
    formatLogisticsResponse(logistics) {
        const lines = [
            `订单号：${logistics.orderNo}`,
            `快递公司：${logistics.carrier}`,
            `运单号：${logistics.trackingNo}`,
            `当前状态：${logistics.status === 'IN_TRANSIT' ? '运输中' : logistics.status === 'DELIVERED' ? '已送达' : '待发货'}`,
            `当前位置：${logistics.currentLocation}`,
        ];
        if (logistics.estimatedDeliveryTime) {
            lines.push(`预计送达时间：${new Date(logistics.estimatedDeliveryTime).toLocaleString('zh-CN')}`);
        }
        if (logistics.events && logistics.events.length > 0) {
            lines.push('物流轨迹：');
            for (const event of logistics.events.slice(0, 3)) {
                lines.push(`  [${new Date(event.time).toLocaleString('zh-CN')}] ${event.location} - ${event.description}`);
            }
        }
        return lines.join('\n');
    }
    async getMessages(sessionId, limit = 50, offset = 0) {
        try {
            this.logger.log(`Getting messages for session: ${sessionId}`);
            const session = await this.sessionService.findById(sessionId);
            this.logger.log(`Session found: ${session.id}`);
            const messages = await this.messageService.findBySessionId(sessionId, limit, offset);
            this.logger.log(`Found ${messages.length} messages`);
            return messages.map((msg) => ({
                id: msg.id,
                sessionId: msg.sessionId,
                senderType: msg.senderType,
                content: msg.content,
                messageType: msg.messageType,
                createdAt: msg.createdAt,
            }));
        }
        catch (error) {
            this.logger.error(`Error getting messages: ${error.message}`, error.stack);
            throw error;
        }
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
    async updateSessionStatus(sessionId, status) {
        const session = await this.sessionService.updateStatus(sessionId, status);
        this.logger.log(`Session ${sessionId} status updated to ${status}`);
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
        order_service_1.OrderService,
        intent_router_service_1.IntentRouterService,
        prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ChatService);
//# sourceMappingURL=chat.service.js.map