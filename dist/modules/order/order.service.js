"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
let OrderService = OrderService_1 = class OrderService {
    constructor() {
        this.logger = new common_1.Logger(OrderService_1.name);
    }
    async getOrderStatus(orderId, phone) {
        this.logger.log(`getOrderStatus called: orderId=${orderId}, phone=${phone}`);
        return {
            orderId,
            status: 'paid',
            amount: 99.0,
            createdAt: new Date().toISOString(),
        };
    }
    async getOrdersByPhone(phone, limit) {
        this.logger.log(`getOrdersByPhone called: phone=${phone}, limit=${limit}`);
        const mockOrders = [
            {
                orderId: 'ORD001',
                status: 'delivered',
                amount: 199.0,
                createdAt: '2024-03-01T10:00:00Z',
            },
            {
                orderId: 'ORD002',
                status: 'shipped',
                amount: 299.0,
                createdAt: '2024-03-05T14:30:00Z',
            },
            {
                orderId: 'ORD003',
                status: 'paid',
                amount: 99.0,
                createdAt: '2024-03-10T09:15:00Z',
            },
        ];
        return limit ? mockOrders.slice(0, limit) : mockOrders;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)()
], OrderService);
//# sourceMappingURL=order.service.js.map