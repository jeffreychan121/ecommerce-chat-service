"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LogisticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
let LogisticsService = LogisticsService_1 = class LogisticsService {
    constructor() {
        this.logger = new common_1.Logger(LogisticsService_1.name);
    }
    async getLogistics(orderId) {
        this.logger.log(`getLogistics called: orderId=${orderId}`);
        return {
            orderId,
            carrier: '顺丰速运',
            trackingNo: 'SF1234567890',
            status: 'in_transit',
            events: [
                {
                    time: '2024-03-06T10:00:00Z',
                    location: '上海分拨中心',
                    description: '快件已发往目的地',
                },
                {
                    time: '2024-03-05T18:30:00Z',
                    location: '上海浦东新区',
                    description: '快件已到达上海浦东新区',
                },
                {
                    time: '2024-03-05T14:00:00Z',
                    location: '杭州转运中心',
                    description: '快件已发出',
                },
            ],
        };
    }
};
exports.LogisticsService = LogisticsService;
exports.LogisticsService = LogisticsService = LogisticsService_1 = __decorate([
    (0, common_1.Injectable)()
], LogisticsService);
//# sourceMappingURL=logistics.service.js.map