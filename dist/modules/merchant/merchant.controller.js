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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const merchant_service_1 = require("./merchant.service");
let MerchantController = class MerchantController {
    constructor(merchantService) {
        this.merchantService = merchantService;
    }
    async getStatus(storeId) {
        return this.merchantService.getStoreStatus(storeId);
    }
    async createDataset(storeId, dto = {}) {
        return this.merchantService.createDatasetForStore(storeId, dto);
    }
    async deleteDataset(storeId) {
        return this.merchantService.deleteDataset(storeId);
    }
    async uploadFile(file, storeId) {
        return this.merchantService.uploadFile(storeId, file);
    }
    async getFiles(storeId) {
        return this.merchantService.getFiles(storeId);
    }
    async deleteFile(jobId) {
        return this.merchantService.deleteFile(jobId);
    }
    async trainFile(jobId) {
        return this.merchantService.trainFile(jobId);
    }
    async enableFile(jobId) {
        return this.merchantService.toggleDocumentEnabled(jobId, true);
    }
    async disableFile(jobId) {
        return this.merchantService.toggleDocumentEnabled(jobId, false);
    }
    async trainAllFiles(storeId) {
        return this.merchantService.trainAllFiles(storeId);
    }
    async chat(dto) {
        return this.merchantService.chat(dto.storeId, dto.query);
    }
};
exports.MerchantController = MerchantController;
__decorate([
    (0, common_1.Get)('status/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('dataset/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "createDataset", null);
__decorate([
    (0, common_1.Delete)('dataset/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "deleteDataset", null);
__decorate([
    (0, common_1.Post)('files/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { dest: './uploads' })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof common_1.UploadedFile !== "undefined" && common_1.UploadedFile) === "function" ? _a : Object, String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('files/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "getFiles", null);
__decorate([
    (0, common_1.Delete)('files/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Post)('files/:jobId/train'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "trainFile", null);
__decorate([
    (0, common_1.Post)('files/:jobId/enable'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "enableFile", null);
__decorate([
    (0, common_1.Post)('files/:jobId/disable'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "disableFile", null);
__decorate([
    (0, common_1.Post)('files/:storeId/train-all'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "trainAllFiles", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "chat", null);
exports.MerchantController = MerchantController = __decorate([
    (0, common_1.Controller)('api/merchant'),
    __metadata("design:paramtypes", [merchant_service_1.MerchantService])
], MerchantController);
//# sourceMappingURL=merchant.controller.js.map