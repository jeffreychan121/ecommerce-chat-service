import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { DifyChunk, DifyResponse } from './dto/dify.dto';

@Injectable()
export class DifyClient {
  private readonly logger = new Logger(DifyClient.name);
  private readonly client: AxiosInstance;
  private readonly appClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>('dify.baseUrl') || 'http://localhost/v1';
    const apiKey = this.configService.get<string>('dify.apiKey') || '';
    const appToken = this.configService.get<string>('dify.appToken') || '';
    const timeout = this.configService.get<number>('dify.timeout') || 60000;

    // API Token client (for knowledge base operations)
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout,
    });

    // App Token client (for chat messages)
    this.appClient = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${appToken}`,
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

    this.logger.log(`[DifyClient] 请求: ${url}, conversationId=${conversationId || 'new'}`);

    try {
      const response = await this.appClient.post(url, requestBody, {
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
          this.logger.log('[DifyClient] 流式响应完成');
          resolve({
            messageId,
            conversationId: conversationIdResult,
            answer,
          });
        });

        response.data.on('error', (err: Error) => {
          this.logger.error(`[DifyClient] 流式响应错误: ${err.message}`);
          reject(err);
        });
      });
    } catch (error: any) {
      this.logger.error(`[DifyClient] 请求失败: ${error.message}`);
      throw error;
    }
  }

  // 创建知识库
  async createDataset(options: {
    name: string;
    description?: string;
    indexing_technique?: string;
    permission?: string;
    retrieval_model?: {
      search_method?: string;
      top_k?: number;
      reranking_enable?: boolean;
      score_threshold_enabled?: boolean;
      score_threshold?: number;
    };
    doc_form?: string;
  }): Promise<{ id: string }> {
    const requestBody: Record<string, any> = {
      name: options.name,
      description: options.description || '',
      indexing_technique: options.indexing_technique || 'high_quality',
      permission: options.permission || 'only_me',
    };

    // 添加检索模型设置
    if (options.retrieval_model) {
      requestBody.retrieval_model = {
        search_method: options.retrieval_model.search_method || 'semantic_search',
        top_k: options.retrieval_model.top_k || 2,
        reranking_enable: options.retrieval_model.reranking_enable || false,
        score_threshold_enabled: options.retrieval_model.score_threshold_enabled || false,
        score_threshold: options.retrieval_model.score_threshold || 0,
      };
    }

    // 添加文档格式
    if (options.doc_form) {
      requestBody.doc_form = options.doc_form;
    }

    const response = await this.client.post('/datasets', requestBody);
    return { id: response.data.id };
  }

  // 上传文档到知识库
  async createDocument(datasetId: string, filePath: string): Promise<{ document: { id: string }, documentId: string }> {
    const fs = require('fs');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileName = filePath.split('/').pop() || 'document.txt';

    const response = await this.client.post(
      `/datasets/${datasetId}/document/create-by-text`,
      {
        name: fileName,
        text: fileContent,
        indexing_technique: 'high_quality',
        process_rule: { mode: 'automatic' },
      }
    );
    // 返回 document 对象和 documentId
    return {
      document: response.data.document,
      documentId: response.data.document.id,
    };
  }

  // 获取文档列表
  async getDocuments(datasetId: string): Promise<{ documents: any[] }> {
    const response = await this.client.get(`/datasets/${datasetId}/documents`);
    return response.data;
  }

  // 删除文档
  async deleteDocument(datasetId: string, documentId: string): Promise<void> {
    await this.client.delete(`/datasets/${datasetId}/documents/${documentId}`);
  }

  // 删除知识库
  async deleteDataset(datasetId: string): Promise<void> {
    await this.client.delete(`/datasets/${datasetId}`);
  }

  // 禁用文档（尝试调用 Dify API，如果失败则记录警告）
  async disableDocument(datasetId: string, documentId: string): Promise<void> {
    try {
      // 尝试 Dify API - 根据文档禁用文档应该是某个操作端点
      // 先尝试通过更新文档方式来禁用
      await this.client.post(`/datasets/${datasetId}/documents/${documentId}/disable`, {});
    } catch (error: any) {
      this.logger.warn(`Dify disable document API failed: ${error.message}. Document will be marked as disabled locally.`);
    }
  }

  // 启用文档
  async enableDocument(datasetId: string, documentId: string): Promise<void> {
    try {
      await this.client.post(`/datasets/${datasetId}/documents/${documentId}/enable`, {});
    } catch (error: any) {
      this.logger.warn(`Dify enable document API failed: ${error.message}. Document will be marked as enabled locally.`);
    }
  }
}