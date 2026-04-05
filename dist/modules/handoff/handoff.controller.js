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
exports.AgentController = exports.HandoffController = void 0;
const common_1 = require("@nestjs/common");
const handoff_service_1 = require("./handoff.service");
const handoff_dto_1 = require("./dto/handoff.dto");
let HandoffController = class HandoffController {
    constructor(handoffService) {
        this.handoffService = handoffService;
    }
    async handoff(sessionId, dto) {
        const result = await this.handoffService.createTicket(sessionId, dto.reason);
        return result;
    }
};
exports.HandoffController = HandoffController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, handoff_dto_1.HandoffRequestDto]),
    __metadata("design:returntype", Promise)
], HandoffController.prototype, "handoff", null);
exports.HandoffController = HandoffController = __decorate([
    (0, common_1.Controller)('api/chat/sessions/:sessionId/handoff'),
    __metadata("design:paramtypes", [handoff_service_1.HandoffService])
], HandoffController);
let AgentController = class AgentController {
    constructor(handoffService) {
        this.handoffService = handoffService;
    }
    async getQueue() {
        return this.handoffService.getPendingQueue();
    }
    async getHistory(query) {
        const { page = 1, limit = 20 } = query;
        return this.handoffService.getHistory(Number(page), Number(limit));
    }
    async getSessionMessages(sessionId) {
        return this.handoffService.getSessionMessages(sessionId);
    }
    async getSessionDetail(sessionId) {
        return this.handoffService.getSessionDetail(sessionId);
    }
    async acceptSession(sessionId) {
        return this.handoffService.acceptSession(sessionId);
    }
    async closeSession(sessionId) {
        return this.handoffService.closeSession(sessionId);
    }
    async sendMessage(sessionId, dto) {
        return this.handoffService.sendAgentMessage(sessionId, dto.content);
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Get)('queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [handoff_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('session/:sessionId/messages'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getSessionMessages", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getSessionDetail", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/accept'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "acceptSession", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/close'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "closeSession", null);
__decorate([
    (0, common_1.Post)('session/:sessionId/message'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "sendMessage", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('api/agent'),
    __metadata("design:paramtypes", [handoff_service_1.HandoffService])
], AgentController);
//# sourceMappingURL=handoff.controller.js.map