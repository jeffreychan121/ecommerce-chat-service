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
var MallApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MallApiService = exports.MallApiException = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const order_types_1 = require("./order.types");
class MallApiException extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'MallApiException';
    }
}
exports.MallApiException = MallApiException;
let MallApiService = MallApiService_1 = class MallApiService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MallApiService_1.name);
        this.apiBaseUrl = this.config.get('') || '';
        this.apiKey = this.config.get('') || '';
        this.appSecret = this.config.get('') || '';
        this.useMock = process.env.MALL_API_MOCK !== 'false';
        this.logger.log(`MallApiService initialized, useMock: ${this.useMock}`);
    }
    async getOrder(orderNo, phone) {
        this.logger.log(`getOrder: orderNo=${orderNo}, phone=${phone}, useMock=${this.useMock}`);
        if (this.useMock) {
            return this.getMockOrder(orderNo);
        }
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/order/detail?orderNo=${orderNo}`, {
                method: 'GET',
                headers: this.getHeaders(phone),
            });
            if (!response.ok) {
                throw new MallApiException(`订单查询失败: ${response.statusText}`, 'ORDER_NOT_FOUND', response.status);
            }
            const data = await response.json();
            return this.mapMallOrderResponse(data);
        }
        catch (error) {
            this.logger.error(`getOrder error: ${error.message}`);
            throw new MallApiException(error.message || '订单查询失败', 'ORDER_QUERY_ERROR', 500);
        }
    }
    async createOrder(params) {
        this.logger.log(`createOrder: phone=${params.phone}, items=${params.items.length}, useMock=${this.useMock}`);
        if (this.useMock) {
            const newOrderNo = this.generateOrderNo();
            return this.getMockOrder(newOrderNo);
        }
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/order/create`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(params.phone),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                throw new MallApiException(`创建订单失败: ${response.statusText}`, 'ORDER_CREATE_FAILED', response.status);
            }
            const data = await response.json();
            return this.mapMallOrderResponse(data);
        }
        catch (error) {
            this.logger.error(`createOrder error: ${error.message}`);
            throw new MallApiException(error.message || '创建订单失败', 'ORDER_CREATE_ERROR', 500);
        }
    }
    async getLogistics(orderNo) {
        this.logger.log(`getLogistics: orderNo=${orderNo}, useMock=${this.useMock}`);
        if (this.useMock) {
            return this.getMockLogistics(orderNo);
        }
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/logistics/detail?orderNo=${orderNo}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            if (!response.ok) {
                throw new MallApiException(`物流查询失败: ${response.statusText}`, 'LOGISTICS_NOT_FOUND', response.status);
            }
            const data = await response.json();
            return this.mapMallLogisticsResponse(data);
        }
        catch (error) {
            this.logger.error(`getLogistics error: ${error.message}`);
            throw new MallApiException(error.message || '物流查询失败', 'LOGISTICS_QUERY_ERROR', 500);
        }
    }
    getHeaders(phone) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        if (phone) {
            headers['X-User-Phone'] = phone;
        }
        return headers;
    }
    mapMallOrderResponse(data) {
        return {
            orderNo: data.orderNo,
            status: this.mapOrderStatus(data.status),
            statusText: data.statusText,
            payStatus: this.mapPayStatus(data.payStatus),
            orderAmount: data.amount,
            discountAmount: data.discount || 0,
            actualAmount: data.actualAmount,
            createdAt: data.createdAt,
            paidAt: data.paidAt,
            shippedAt: data.shippedAt,
            deliveredAt: data.deliveredAt,
            estimatedShipTime: data.estimatedShipTime,
            estimatedDeliveryTime: data.estimatedDeliveryTime,
            items: data.items,
            shippingAddress: data.shippingAddress,
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
        };
    }
    mapMallLogisticsResponse(data) {
        return {
            orderNo: data.orderNo,
            carrier: data.carrier,
            trackingNo: data.trackingNo,
            status: this.mapLogisticsStatus(data.status),
            currentLocation: data.currentLocation,
            estimatedDeliveryTime: data.estimatedDeliveryTime,
            events: data.events,
        };
    }
    mapOrderStatus(status) {
        const mapping = {
            PENDING: order_types_1.OrderStatus.PENDING,
            PAID: order_types_1.OrderStatus.PAID,
            TO_BE_SHIPPED: order_types_1.OrderStatus.TO_BE_SHIPPED,
            SHIPPED: order_types_1.OrderStatus.SHIPPED,
            DELIVERED: order_types_1.OrderStatus.DELIVERED,
            CANCELLED: order_types_1.OrderStatus.CANCELLED,
        };
        return mapping[status] || order_types_1.OrderStatus.PENDING;
    }
    mapPayStatus(status) {
        const mapping = {
            UNPAID: order_types_1.PayStatus.UNPAID,
            PAID: order_types_1.PayStatus.PAID,
            REFUNDED: order_types_1.PayStatus.REFUNDED,
        };
        return mapping[status] || order_types_1.PayStatus.UNPAID;
    }
    mapLogisticsStatus(status) {
        const mapping = {
            PENDING: 'PENDING',
            IN_TRANSIT: 'IN_TRANSIT',
            DELIVERED: 'DELIVERED',
        };
        return mapping[status] || 'PENDING';
    }
    generateOrderNo() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DD${timestamp}${random}`;
    }
    getMockOrder(orderNo) {
        const hash = orderNo.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const statuses = [
            order_types_1.OrderStatus.PENDING,
            order_types_1.OrderStatus.PAID,
            order_types_1.OrderStatus.TO_BE_SHIPPED,
            order_types_1.OrderStatus.SHIPPED,
            order_types_1.OrderStatus.DELIVERED,
        ];
        const status = statuses[hash % statuses.length];
        return {
            orderNo,
            status,
            statusText: this.getStatusText(status),
            payStatus: status === order_types_1.OrderStatus.PENDING ? order_types_1.PayStatus.UNPAID : order_types_1.PayStatus.PAID,
            orderAmount: 99 + (hash % 10) * 100,
            discountAmount: hash % 5 * 10,
            actualAmount: 99 + (hash % 10) * 100,
            createdAt: new Date(Date.now() - hash * 3600000).toISOString(),
            paidAt: status !== order_types_1.OrderStatus.PENDING ? new Date(Date.now() - hash * 3600000 + 300000).toISOString() : undefined,
            estimatedShipTime: status === order_types_1.OrderStatus.TO_BE_SHIPPED ? new Date(Date.now() + 86400000).toISOString() : undefined,
            items: [
                {
                    skuId: `SKU${hash % 1000}`,
                    title: `商品 ${hash % 100}`,
                    quantity: 1 + (hash % 3),
                    price: 99 + (hash % 10) * 100,
                },
            ],
            shippingAddress: '北京市朝阳区xxx街道xxx小区1号楼101室',
            receiverName: '张三',
            receiverPhone: '138****8888',
        };
    }
    getMockLogistics(orderNo) {
        const hash = orderNo.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const isDelivered = hash % 3 === 0;
        return {
            orderNo,
            carrier: ['顺丰速运', '中通快递', '圆通速递'][hash % 3],
            trackingNo: `SF${orderNo}000`,
            status: isDelivered ? 'DELIVERED' : 'IN_TRANSIT',
            currentLocation: isDelivered ? '已送达' : ['上海市青浦区', '杭州市西湖区', '广州市天河区'][hash % 3],
            estimatedDeliveryTime: isDelivered ? undefined : new Date(Date.now() + 86400000).toISOString(),
            events: [
                {
                    time: new Date().toISOString(),
                    location: isDelivered ? '广州市天河区' : '物流公司',
                    description: isDelivered ? '已签收' : '运输中',
                },
            ],
        };
    }
    getStatusText(status) {
        const texts = {
            [order_types_1.OrderStatus.PENDING]: '待支付',
            [order_types_1.OrderStatus.PAID]: '已支付',
            [order_types_1.OrderStatus.TO_BE_SHIPPED]: '待发货',
            [order_types_1.OrderStatus.SHIPPED]: '已发货',
            [order_types_1.OrderStatus.DELIVERED]: '已送达',
            [order_types_1.OrderStatus.CANCELLED]: '已取消',
            [order_types_1.OrderStatus.REFUNDED]: '已退款',
        };
        return texts[status];
    }
};
exports.MallApiService = MallApiService;
exports.MallApiService = MallApiService = MallApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MallApiService);
//# sourceMappingURL=mall-api.service.js.map