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
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const order_service_1 = require("../order/order.service");
let AgentService = AgentService_1 = class AgentService {
    constructor(orderService) {
        this.orderService = orderService;
        this.logger = new common_1.Logger(AgentService_1.name);
    }
    async execute(request) {
        const { system, action, params, context } = request;
        this.logger.log(`Executing: system=${system}, action=${action}`);
        const normalizedAction = this.normalizeAction(action);
        switch (system) {
            case 'order':
                return this.handleOrder(normalizedAction, params, context);
            case 'member':
                return this.handleMember(normalizedAction, params, context);
            case 'product':
                return this.handleProduct(normalizedAction, params, context);
            case 'after-sale':
                return this.handleAfterSale(normalizedAction, params, context);
            default:
                throw new Error(`未知业务系统: ${system}`);
        }
    }
    normalizeAction(action) {
        const actionMap = {
            'order_status': 'query',
            'logistics': 'logistics',
        };
        return actionMap[action] || action;
    }
    async handleOrder(action, params, context) {
        switch (action) {
            case 'query':
                if (!params?.order_no) {
                    throw new Error('缺少订单号参数');
                }
                const order = await this.orderService.getOrderStatus(params.order_no);
                return { data: order, message: '查询成功' };
            case 'logistics':
                if (!params?.order_no) {
                    throw new Error('缺少订单号参数');
                }
                const logistics = await this.orderService.getLogistics(params.order_no);
                return { data: logistics, message: '查询成功' };
            case 'create':
                if (!params?.items || !params?.items.length) {
                    throw new Error('缺少商品信息');
                }
                const newOrder = await this.orderService.createOrder({
                    phone: context?.phone || params.phone,
                    items: params.items,
                    shippingAddress: params.shipping_address,
                    receiverName: params.receiver_name,
                    receiverPhone: params.receiver_phone,
                });
                return { data: newOrder, message: '创建成功' };
            case 'cancel':
                return { data: null, message: '取消订单功能开发中' };
            default:
                throw new Error(`未知订单操作: ${action}`);
        }
    }
    async handleMember(action, params, context) {
        switch (action) {
            case 'points':
                return { data: { points: 0 }, message: '积分查询功能开发中' };
            case 'coupons':
                return { data: { coupons: [] }, message: '优惠券查询功能开发中' };
            default:
                throw new Error(`未知会员操作: ${action}`);
        }
    }
    async handleProduct(action, params, context) {
        throw new Error(`商品服务开发中`);
    }
    async handleAfterSale(action, params, context) {
        throw new Error(`售后服务开发中`);
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], AgentService);
//# sourceMappingURL=agent.service.js.map