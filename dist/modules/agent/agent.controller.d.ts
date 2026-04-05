import { AgentService } from './agent.service';
import { AgentRequestDto } from './dto/agent.dto';
export declare class AgentController {
    private readonly agentService;
    private readonly logger;
    constructor(agentService: AgentService);
    handle(dto: AgentRequestDto): Promise<any>;
}
