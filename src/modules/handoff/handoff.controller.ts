import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { HandoffRequestDto, PaginationDto } from './dto/handoff.dto';

@Controller('api/chat/sessions/:sessionId/handoff')
export class HandoffController {
  constructor(private handoffService: HandoffService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handoff(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: HandoffRequestDto,
  ) {
    const result = await this.handoffService.createTicket(sessionId, dto.reason);
    return result;
  }
}

@Controller('api/agent')
export class AgentController {
  constructor(private handoffService: HandoffService) {}

  // GET /api/agent/queue - 获取待处理队列
  @Get('queue')
  async getQueue() {
    return this.handoffService.getPendingQueue();
  }

  // GET /api/agent/history - 获取历史会话
  @Get('history')
  async getHistory(@Query() query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    return this.handoffService.getHistory(Number(page), Number(limit));
  }

  // GET /api/agent/session/:sessionId/messages - 获取会话消息
  @Get('session/:sessionId/messages')
  async getSessionMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.getSessionMessages(sessionId);
  }

  // GET /api/agent/session/:sessionId - 获取会话详情
  @Get('session/:sessionId')
  async getSessionDetail(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.getSessionDetail(sessionId);
  }

  // POST /api/agent/session/:sessionId/accept - 接入会话
  @Post('session/:sessionId/accept')
  async acceptSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.acceptSession(sessionId);
  }

  // POST /api/agent/session/:sessionId/close - 关闭会话
  @Post('session/:sessionId/close')
  async closeSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.closeSession(sessionId);
  }

  // POST /api/agent/session/:sessionId/message - 发送消息
  @Post('session/:sessionId/message')
  async sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: { content: string },
  ) {
    return this.handoffService.sendAgentMessage(sessionId, dto.content);
  }
}