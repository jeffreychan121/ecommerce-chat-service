import { HandoffService } from './handoff.service';
import { HandoffRequestDto } from './dto/handoff.dto';
export declare class HandoffController {
    private handoffService;
    constructor(handoffService: HandoffService);
    handoff(sessionId: string, dto: HandoffRequestDto): Promise<{
        success: boolean;
        message: string;
        queueNo: number;
        ticketId: string;
    }>;
}
