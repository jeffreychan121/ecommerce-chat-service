import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentRequestDto, AgentResponseDto } from './dto/agent.dto';

@Controller('api/agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(@Body() dto: AgentRequestDto): Promise<any> {
    this.logger.log(`Agent request: system=${dto.system}, action=${dto.action}`);

    try {
      const result = await this.agentService.execute(dto);

      // 直接返回业务数据，Dify HTTP Request 节点会自动放到 body 变量中
      // Dify 不需要嵌套的 {success, data, message} 格式
      return result.data;
    } catch (error) {
      this.logger.error(`Agent error: ${error.message}`);
      // 返回错误消息文本，Dify LLM 可以读取并组织回复
      return {
        error: true,
        message: error.message || '操作失败',
      };
    }
  }
}