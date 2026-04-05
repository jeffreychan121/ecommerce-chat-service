export declare class AgentRequestDto {
    system: string;
    action: string;
    params?: Record<string, any>;
    context?: Record<string, any>;
}
export declare class AgentResponseDto {
    success: boolean;
    data: any;
    message: string;
}
