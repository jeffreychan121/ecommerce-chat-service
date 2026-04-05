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
var DifyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifyService = void 0;
const common_1 = require("@nestjs/common");
const dify_client_1 = require("./dify.client");
let DifyService = DifyService_1 = class DifyService {
    constructor(difyClient) {
        this.difyClient = difyClient;
        this.logger = new common_1.Logger(DifyService_1.name);
    }
    async sendMessage(conversationId, dto, onChunk) {
        this.logger.log(`[DifyService] >>> 发送消息: query="${dto.query}", conversationId=${conversationId || 'new'}`);
        const defaultHandler = (chunk) => {
            this.logger.debug(`[DifyService] chunk: ${chunk.event}`);
        };
        try {
            const result = await this.difyClient.sendMessage(conversationId, dto.inputs || {}, dto.query, onChunk || defaultHandler);
            this.logger.log(`[DifyService] <<< 响应: messageId=${result.messageId}, answer长度=${result.answer.length}`);
            this.logger.log(`[DifyService] <<< 响应内容: ${result.answer}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Dify service error: ${error.message}`, error.stack);
            throw error;
        }
    }
    async sendMessageWithInputs(conversationId, query, inputs, onChunk) {
        return this.sendMessage(conversationId, { query, inputs }, onChunk);
    }
    async createDataset(options) {
        return this.difyClient.createDataset(options);
    }
    async createDocument(datasetId, filePath) {
        return this.difyClient.createDocument(datasetId, filePath);
    }
    async getDocuments(datasetId) {
        return this.difyClient.getDocuments(datasetId);
    }
    async deleteDocument(datasetId, documentId) {
        return this.difyClient.deleteDocument(datasetId, documentId);
    }
    async deleteDataset(datasetId) {
        return this.difyClient.deleteDataset(datasetId);
    }
    async disableDocument(datasetId, documentId) {
        return this.difyClient.disableDocument(datasetId, documentId);
    }
    async enableDocument(datasetId, documentId) {
        return this.difyClient.enableDocument(datasetId, documentId);
    }
};
exports.DifyService = DifyService;
exports.DifyService = DifyService = DifyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dify_client_1.DifyClient])
], DifyService);
//# sourceMappingURL=dify.service.js.map