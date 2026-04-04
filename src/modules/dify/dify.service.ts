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
    this.logger.log(`>>> [DifyService] 发送消息到Dify. Conversation: ${conversationId || 'new'}, Query: ${dto.query}, Inputs: ${JSON.stringify(dto.inputs)}`);

    const defaultHandler: (chunk: DifyChunk) => void = (chunk) => {
      this.logger.debug(`>>> [DifyService] Dify chunk: ${chunk.event}`);
    };

    try {
      const result = await this.difyClient.sendMessage(
        conversationId,
        dto.inputs || {},
        dto.query,
        onChunk || defaultHandler,
      );

      this.logger.log(
        `Dify response received. MessageId: ${result.messageId}, Answer length: ${result.answer.length}`,
      );

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
  async createDataset(name: string, description?: string): Promise<{ id: string }> {
    return this.difyClient.createDataset(name, description);
  }

  // 上传文档到知识库
  async createDocument(datasetId: string, filePath: string): Promise<{ document: { id: string } }> {
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
}