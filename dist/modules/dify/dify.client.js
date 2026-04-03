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
        const timeout = this.configService.get('dify.timeout') || 30000;
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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
        this.logger.log(`Sending message to Dify: ${url}, conversationId: ${conversationId || 'new'}`);
        try {
            const response = await this.client.post(url, requestBody, {
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
                    this.logger.log('Dify stream completed');
                    resolve({
                        messageId,
                        conversationId: conversationIdResult,
                        answer,
                    });
                });
                response.data.on('error', (err) => {
                    this.logger.error(`Dify stream error: ${err.message}`);
                    reject(err);
                });
            });
        }
        catch (error) {
            this.logger.error(`Dify request failed: ${error.message}`);
            throw error;
        }
    }
};
exports.DifyClient = DifyClient;
exports.DifyClient = DifyClient = DifyClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DifyClient);
//# sourceMappingURL=dify.client.js.map