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
exports.HandoffController = void 0;
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
//# sourceMappingURL=handoff.controller.js.map