import { Injectable, Logger } from '@nestjs/common';
import { DifyClient } from './dify.client';
import { SendMessageDto, DifyChunk, DifyResponse, DifyInputs } from './dto/dify.dto';

@Injectable()
export class DifyService {
  private readonly logger = new Logger(DifyService.name);

  constructor(private readonly difyClient: DifyClient) {}

  async sendMessage(
    conversationId: string | null,
    dto: SendMessageDto,
    onChunk?: (chunk: DifyChunk) => void,
  ): Promise<DifyResponse> {
    this.logger.log(`[DifyService] >>> 发送消息: query="${dto.query}", conversationId=${conversationId || 'new'}`);

    const defaultHandler: (chunk: DifyChunk) => void = (chunk) => {
      this.logger.debug(`[DifyService] chunk: ${chunk.event}`);
    };

    try {
      const result = await this.difyClient.sendMessage(
        conversationId,
        dto.inputs || {},
        dto.query,
        onChunk || defaultHandler,
      );

      this.logger.log(`[DifyService] <<< 响应: messageId=${result.messageId}, answer长度=${result.answer.length}`);
      // 打印完整响应内容，方便调试
      this.logger.log(`[DifyService] <<< 响应内容: ${result.answer}`);

      return result;
    } catch (error: any) {
      this.logger.error(`Dify service error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendMessageWithInputs(
    conversationId: string | null,
    query: string,
    inputs: Partial<DifyInputs>,
    onChunk?: (chunk: DifyChunk) => void,
  ): Promise<DifyResponse> {
    return this.sendMessage(
      conversationId,
      { query, inputs },
      onChunk,
    );
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
    return this.difyClient.createDataset(options);
  }

  // 上传文档到知识库
  async createDocument(datasetId: string, filePath: string): Promise<{ document: { id: string }, documentId: string }> {
    return this.difyClient.createDocument(datasetId, filePath);
  }

  // 获取文档列表
  async getDocuments(datasetId: string): Promise<{ documents: any[] }> {
    return this.difyClient.getDocuments(datasetId);
  }

  // 删除文档
  async deleteDocument(datasetId: string, documentId: string): Promise<void> {
    return this.difyClient.deleteDocument(datasetId, documentId);
  }

  // 删除知识库
  async deleteDataset(datasetId: string): Promise<void> {
    return this.difyClient.deleteDataset(datasetId);
  }

  // 禁用文档
  async disableDocument(datasetId: string, documentId: string): Promise<void> {
    return this.difyClient.disableDocument(datasetId, documentId);
  }

  // 启用文档
  async enableDocument(datasetId: string, documentId: string): Promise<void> {
    return this.difyClient.enableDocument(datasetId, documentId);
  }
}