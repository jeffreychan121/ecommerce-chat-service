import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { HandoffRequestDto } from './dto/handoff.dto';

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