import { LogisticsInfo } from '../order/order.types';
import { OrderService } from '../order/order.service';
export declare class LogisticsService {
    private readonly orderService;
    private readonly logger;
    constructor(orderService: OrderService);
    getLogistics(orderNo: string): Promise<LogisticsInfo>;
}
