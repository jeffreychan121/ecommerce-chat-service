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
    this.logger.log(
      `Sending message to Dify. Conversation: ${conversationId || 'new'}, Query: ${dto.query}`,
    );

    const defaultHandler: (chunk: DifyChunk) => void = (chunk) => {
      this.logger.debug(`Dify chunk: ${chunk.event}`);
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
}