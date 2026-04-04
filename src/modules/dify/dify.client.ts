import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DifyChunk, DifyResponse } from './dto/dify.dto';

@Injectable()
export class DifyClient {
  private readonly logger = new Logger(DifyClient.name);
  private readonly client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>('dify.baseUrl') || 'http://localhost/v1';
    const apiKey = this.configService.get<string>('dify.apiKey') || '';
    const timeout = this.configService.get<number>('dify.timeout') || 30000;

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout,
    });
  }

  async sendMessage(
    conversationId: string | null,
    inputs: Record<string, any>,
    query: string,
    onChunk: (chunk: DifyChunk) => void,
  ): Promise<DifyResponse> {
    const appId = this.configService.get<string>('dify.appId') || '';
    // Dify API: 无论首次还是续聊，都使用 /chat-messages
    // 首次不传 conversation_id，续聊时在 body 中传入 conversation_id
    const url = '/chat-messages';

    const requestBody: Record<string, any> = {
      query,
      inputs,
      response_mode: 'streaming',
      user: appId,
    };

    // 如果有 conversationId，在 body 中传入（续聊）
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
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as DifyChunk;
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
              } catch (e) {
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

        response.data.on('error', (err: Error) => {
          this.logger.error(`Dify stream error: ${err.message}`);
          reject(err);
        });
      });
    } catch (error: any) {
      this.logger.error(`Dify request failed: ${error.message}`);
      throw error;
    }
  }

  // 创建知识库
  async createDataset(name: string, description?: string): Promise<{ id: string }> {
    const response = await this.client.post('/v1/datasets', {
      name,
      description: description || '',
      indexing_technique: 'high_quality',
      permission: 'only_me',
    });
    return { id: response.data.id };
  }

  // 上传文档到知识库
  async createDocument(datasetId: string, filePath: string): Promise<{ document: { id: string } }> {
    const FormData = require('form-data');
    const fs = require('fs');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('indexing_technique', 'high_quality');

    const response = await this.client.post(
      `/v1/datasets/${datasetId}/document/create-by-file`,
      form,
      { headers: { ...form.getHeaders() } }
    );
    return response.data;
  }

  // 获取文档列表
  async getDocuments(datasetId: string): Promise<{ documents: any[] }> {
    const response = await this.client.get(`/v1/datasets/${datasetId}/documents`);
    return response.data;
  }

  // 删除文档
  async deleteDocument(datasetId: string, documentId: string): Promise<void> {
    await this.client.delete(`/v1/datasets/${datasetId}/documents/${documentId}`);
  }
}