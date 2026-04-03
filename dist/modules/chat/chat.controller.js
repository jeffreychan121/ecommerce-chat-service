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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createOrResumeSession(dto) {
        return this.chatService.createOrResumeSession(dto);
    }
    async getSession(id) {
        return this.chatService.getSession(id);
    }
    async getMessages(id, limit, offset) {
        return this.chatService.getMessages(id, limit, offset);
    }
    async sendMessage(id, dto) {
        return this.chatService.sendMessage(id, dto);
    }
    async sendMessageStream(id, dto, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const onChunk = (chunk) => {
            if (chunk.answer) {
                res.write(`data: ${JSON.stringify({ answer: chunk.answer })}\n\n`);
            }
            if (chunk.conversation_id) {
                res.write(`data: ${JSON.stringify({ conversationId: chunk.conversation_id })}\n\n`);
            }
        };
        try {
            const result = await this.chatService.sendMessage(id, dto, onChunk);
            res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
            res.end();
        }
        catch (error) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createOrResumeSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/messages'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50))),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('sessions/:id/messages'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('sessions/:id/messages/stream'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessageStream", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('api/chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map