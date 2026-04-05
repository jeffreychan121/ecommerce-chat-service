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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DifyClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifyClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let DifyClient = DifyClient_1 = class DifyClient {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DifyClient_1.name);
        const baseURL = this.configService.get('dify.baseUrl') || 'http://localhost/v1';
        const apiKey = this.configService.get('dify.apiKey') || '';
        const appToken = this.configService.get('dify.appToken') || '';
        const timeout = this.configService.get('dify.timeout') || 30000;
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout,
        });
        this.appClient = axios_1.default.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${appToken}`,
                'Content-Type': 'application/json',
            },
            timeout,
        });
    }
    async sendMessage(conversationId, inputs, query, onChunk) {
        const appId = this.configService.get('dify.appId') || '';
        const url = '/chat-messages';
        const requestBody = {
            query,
            inputs,
            response_mode: 'streaming',
            user: appId,
        };
        if (conversationId) {
            requestBody.conversation_id = conversationId;
        }
        this.logger.log(`[DifyClient] 请求: ${url}, conversationId=${conversationId || 'new'}`);
        try {
            const response = await this.appClient.post(url, requestBody, {
                responseType: 'stream',
            });
            let messageId = '';
            let conversationIdResult = '';
            let answer = '';
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                onChunk(data);
                                if (data.message_id) {
                                    messageId = data.message_id;
                                }
                                if (data.conversation_id) {
                                    conversationIdResult = data.conversation_id;
                                }
                                if (data.answer) {
                                    answer += data.answer;
                                }
                            }
                            catch (e) {
                                this.logger.warn(`Failed to parse Dify chunk: ${line}`);
                            }
                        }
                    }
                });
                response.data.on('end', () => {
                    this.logger.log('[DifyClient] 流式响应完成');
                    resolve({
                        messageId,
                        conversationId: conversationIdResult,
                        answer,
                    });
                });
                response.data.on('error', (err) => {
                    this.logger.error(`[DifyClient] 流式响应错误: ${err.message}`);
                    reject(err);
                });
            });
        }
        catch (error) {
            this.logger.error(`[DifyClient] 请求失败: ${error.message}`);
            throw error;
        }
    }
    async createDataset(options) {
        const requestBody = {
            name: options.name,
            description: options.description || '',
            indexing_technique: options.indexing_technique || 'high_quality',
            permission: options.permission || 'only_me',
        };
        if (options.retrieval_model) {
            requestBody.retrieval_model = {
                search_method: options.retrieval_model.search_method || 'semantic_search',
                top_k: options.retrieval_model.top_k || 2,
                reranking_enable: options.retrieval_model.reranking_enable || false,
                score_threshold_enabled: options.retrieval_model.score_threshold_enabled || false,
                score_threshold: options.retrieval_model.score_threshold || 0,
            };
        }
        if (options.doc_form) {
            requestBody.doc_form = options.doc_form;
        }
        const response = await this.client.post('/datasets', requestBody);
        return { id: response.data.id };
    }
    async createDocument(datasetId, filePath) {
        const fs = require('fs');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileName = filePath.split('/').pop() || 'document.txt';
        const response = await this.client.post(`/datasets/${datasetId}/document/create-by-text`, {
            name: fileName,
            text: fileContent,
            indexing_technique: 'high_quality',
            process_rule: { mode: 'automatic' },
        });
        return {
            document: response.data.document,
            documentId: response.data.document.id,
        };
    }
    async getDocuments(datasetId) {
        const response = await this.client.get(`/datasets/${datasetId}/documents`);
        return response.data;
    }
    async deleteDocument(datasetId, documentId) {
        await this.client.delete(`/datasets/${datasetId}/documents/${documentId}`);
    }
    async deleteDataset(datasetId) {
        await this.client.delete(`/datasets/${datasetId}`);
    }
    async disableDocument(datasetId, documentId) {
        try {
            await this.client.post(`/datasets/${datasetId}/documents/${documentId}/disable`, {});
        }
        catch (error) {
            this.logger.warn(`Dify disable document API failed: ${error.message}. Document will be marked as disabled locally.`);
        }
    }
    async enableDocument(datasetId, documentId) {
        try {
            await this.client.post(`/datasets/${datasetId}/documents/${documentId}/enable`, {});
        }
        catch (error) {
            this.logger.warn(`Dify enable document API failed: ${error.message}. Document will be marked as enabled locally.`);
        }
    }
};
exports.DifyClient = DifyClient;
exports.DifyClient = DifyClient = DifyClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DifyClient);
//# sourceMappingURL=dify.client.js.map