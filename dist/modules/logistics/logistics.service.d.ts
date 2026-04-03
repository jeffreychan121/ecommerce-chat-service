export interface LogisticsInfo {
    orderId: string;
    carrier: string;
    trackingNo: string;
    status: 'pending' | 'in_transit' | 'delivered';
    events: Array<{
        time: string;
        location: string;
        description: string;
    }>;
}
export declare class LogisticsService {
    private readonly logger;
    getLogistics(orderId: string): Promise<LogisticsInfo>;
}
