"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const order_service_1 = require("./order.service");
class CreateOrderRequest {
}
let OrderController = class OrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    async getOrders(limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return this.orderService.getOrders(parsedLimit);
    }
    async getOrder(orderNo) {
        return this.orderService.getOrderStatus(orderNo);
    }
    async createOrder(dto) {
        return this.orderService.createOrder({
            phone: dto.phone,
            items: dto.items,
            shippingAddress: dto.shippingAddress,
            receiverName: dto.receiverName,
            receiverPhone: dto.receiverPhone,
        });
    }
    async getLogistics(orderNo) {
        return this.orderService.getLogistics(orderNo);
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)(':orderNo'),
    __param(0, (0, common_1.Param)('orderNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrderRequest]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)(':orderNo/logistics'),
    __param(0, (0, common_1.Param)('orderNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getLogistics", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('api/orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], OrderController);
//# sourceMappingURL=order.controller.js.map