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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const handoff_service_1 = require("../handoff/handoff.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(chatService, eventEmitter, handoffService) {
        this.chatService = chatService;
        this.eventEmitter = eventEmitter;
        this.handoffService = handoffService;
        this.logger = new common_1.Logger(ChatGateway_1.name);
        this.sessionClients = new Map();
        this.eventEmitter.on('order.created', (order) => {
            this.logger.log(`Broadcasting order created: ${order.orderNo}`);
            this.server.emit('order-created', order);
        });
        this.eventEmitter.on('agent.message', (data) => {
            this.logger.log(`Broadcasting agent message to session: ${data.sessionId}`);
            this.server.to(data.sessionId).emit('agent-message', data.message);
        });
        this.eventEmitter.on('customer.message', (data) => {
            this.logger.log(`Broadcasting customer message to agents: ${data.sessionId}`);
            this.server.emit('customer-message', {
                sessionId: data.sessionId,
                ...data.message,
            });
        });
    }
    async broadcastQueueUpdate() {
        const queue = await this.handoffService.getPendingQueue();
        this.server.emit('handoff-queue-update', queue);
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.sessionClients.forEach((clients, sessionId) => {
            if (clients.has(client.id)) {
                clients.delete(client.id);
                this.logger.log(`Client ${client.id} removed from session ${sessionId}`);
            }
        });
    }
    async handleJoinSession(client, sessionId) {
        this.logger.log(`Client ${client.id} joining session: ${sessionId}`);
        try {
            await this.chatService.getSession(sessionId);
        }
        catch (error) {
            this.logger.error(`Session not found: ${sessionId}`);
            return { success: false, error: 'Session not found' };
        }
        await client.join(sessionId);
        if (!this.sessionClients.has(sessionId)) {
            this.sessionClients.set(sessionId, new Set());
        }
        this.sessionClients.get(sessionId).add(client.id);
        return { success: true, sessionId };
    }
    handleLeaveSession(client, sessionId) {
        this.logger.log(`Client ${client.id} leaving session: ${sessionId}`);
        client.leave(sessionId);
        const clients = this.sessionClients.get(sessionId);
        if (clients) {
            clients.delete(client.id);
        }
        return { success: true, sessionId };
    }
    async handleSendMessage(client, data) {
        const { sessionId, message, inputs } = data;
        this.logger.log(`Message from client ${client.id}, session: ${sessionId}`);
        const onChunk = (chunk) => {
            this.broadcastToSession(sessionId, 'message-chunk', {
                event: chunk.event,
                answer: chunk.answer,
                conversationId: chunk.conversation_id,
            });
        };
        try {
            const dto = {
                message,
                inputs,
            };
            const result = await this.chatService.sendMessage(sessionId, dto, onChunk);
            this.broadcastToSession(sessionId, 'message-complete', result);
            return { success: true, ...result };
        }
        catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    broadcastToSession(sessionId, event, data) {
        const clients = this.sessionClients.get(sessionId);
        if (!clients || clients.size === 0) {
            return;
        }
        const message = JSON.stringify(data);
        clients.forEach((clientId) => {
            this.server.to(clientId).emit(event, data);
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        path: '/ws/chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        event_emitter_1.EventEmitter2,
        handoff_service_1.HandoffService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map