import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  DefaultValuePipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto, SessionResponseDto, MessageResponseDto, CreateOrResumeSessionResponseDto } from './dto/chat.dto';
import { DifyChunk } from '../dify/dto/dify.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  async createOrResumeSession(
    @Body() dto: CreateSessionDto,
  ): Promise<CreateOrResumeSessionResponseDto> {
    return this.chatService.createOrResumeSession(dto);
  }

  @Get('sessions/:id')
  async getSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SessionResponseDto> {
    return this.chatService.getSession(id);
  }

  @Patch('sessions/:id/status')
  async updateSessionStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'OPEN' | 'HANDOFF' | 'CLOSED' },
  ) {
    return this.chatService.updateSessionStatus(id, body.status);
  }

  @Get('sessions/:id/messages')
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<MessageResponseDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.chatService.getMessages(id, parsedLimit, parsedOffset);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<{ messageId: string; answer: string; conversationId: string }> {
    return this.chatService.sendMessage(id, dto);
  }

  @Post('sessions/:id/messages/stream')
  async sendMessageStream(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onChunk = (chunk: DifyChunk) => {
      if (chunk.answer) {
        res.write(`data: ${JSON.stringify({ answer: chunk.answer })}\n\n`);
      }
      if (chunk.conversation_id) {
        res.write(`data: ${JSON.stringify({ conversationId: chunk.conversation_id })}\n\n`);
      }
    };

    try {
      const result = await this.chatService.sendMessage(id, dto, onChunk);

      // 发送完成消息
      res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}