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
var OrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const order_types_1 = require("./order.types");
let OrderService = OrderService_1 = class OrderService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrderService_1.name);
    }
    async createOrder(params) {
        this.logger.log(`createOrder: phone=${params.phone}, items=${params.items.length}`);
        const orderNo = this.generateOrderNo();
        const productNames = ['iPhone 15 Pro Max', 'MacBook Pro M3', 'AirPods Pro', 'iPad Pro', 'Apple Watch'];
        const productName = productNames[Math.floor(Math.random() * productNames.length)];
        const productPrice = Math.floor(Math.random() * 5000) + 500;
        const quantity = params.items[0]?.quantity || 1;
        const amount = productPrice * quantity;
        const order = await this.prisma.order.create({
            data: {
                orderNo,
                status: order_types_1.OrderStatus.PAID,
                payStatus: order_types_1.PayStatus.PAID,
                amount,
                discountAmount: 0,
                actualAmount: amount,
                quantity,
                productName,
                productPrice,
                shippingAddress: params.shippingAddress || '北京市朝阳区xxx街道',
                receiverName: params.receiverName || '用户',
                receiverPhone: params.receiverPhone || params.phone,
                paidAt: new Date(),
            },
        });
        if (order.status === order_types_1.OrderStatus.PAID || order.status === order_types_1.OrderStatus.TO_BE_SHIPPED) {
            await this.createLogistics(order.id, order.orderNo);
        }
        return await this.toOrderInfo(order);
    }
    async createOrderFromChat(productName, quantity) {
        this.logger.log(`createOrderFromChat: productName=${productName}, quantity=${quantity}`);
        const orderNo = this.generateOrderNo();
        const productPrice = Math.floor(Math.random() * 490) + 10;
        const amount = productPrice * quantity;
        const discountAmount = 0;
        const actualAmount = amount;
        const order = await this.prisma.order.create({
            data: {
                orderNo,
                status: order_types_1.OrderStatus.PAID,
                payStatus: order_types_1.PayStatus.PAID,
                amount,
                discountAmount,
                actualAmount,
                quantity,
                productName,
                productPrice,
                paidAt: new Date(),
            },
        });
        await this.createLogistics(order.id, order.orderNo);
        return await this.toOrderInfo(order);
    }
    async getOrderStatus(orderNo) {
        this.logger.log(`getOrderStatus: orderNo=${orderNo}`);
        const order = await this.prisma.order.findUnique({
            where: { orderNo },
        });
        if (!order) {
            throw new common_1.NotFoundException(`订单 ${orderNo} 不存在`);
        }
        return await this.toOrderInfo(order);
    }
    async getOrders(limit = 20) {
        this.logger.log(`getOrders: limit=${limit}`);
        const orders = await this.prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        return Promise.all(orders.map(order => this.toOrderInfo(order)));
    }
    async getLogistics(orderNo) {
        this.logger.log(`getLogistics: orderNo=${orderNo}`);
        const order = await this.prisma.order.findUnique({
            where: { orderNo },
            include: { logistics: { include: { events: true } } },
        });
        if (!order) {
            throw new common_1.NotFoundException(`订单 ${orderNo} 不存在`);
        }
        if (!order.logistics) {
            throw new common_1.NotFoundException(`订单 ${orderNo} 暂无物流信息`);
        }
        const log = order.logistics;
        return {
            orderNo: log.orderId,
            carrier: log.carrier,
            trackingNo: log.trackingNo,
            status: log.status === 'PENDING' ? 'PENDING' : log.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
            currentLocation: log.currentLocation || '未知',
            estimatedDeliveryTime: log.estimatedDelivery?.toISOString(),
            events: log.events.map(e => ({
                time: e.time.toISOString(),
                location: e.location,
                description: e.description,
            })),
        };
    }
    generateOrderNo() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `DD${timestamp}${random}`;
    }
    async createLogistics(orderId, orderNo) {
        const carriers = ['顺丰速运', '中通快递', '圆通速递', '韵达快递'];
        const locations = ['广州市白云区', '深圳市南山区', '杭州市西湖区', '上海市浦东新区'];
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        const trackingNo = `SF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const currentLocation = locations[Math.floor(Math.random() * locations.length)];
        await this.prisma.logistics.create({
            data: {
                orderId,
                carrier,
                trackingNo,
                status: 'IN_TRANSIT',
                currentLocation,
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                events: {
                    create: [
                        {
                            location: currentLocation,
                            description: '已发出，运输中',
                        },
                        {
                            location: '广州市白云区',
                            description: '快件已揽收',
                        },
                    ],
                },
            },
        });
    }
    async toOrderInfo(order) {
        const logistics = await this.prisma.logistics.findUnique({
            where: { orderId: order.id },
        });
        return {
            orderNo: order.orderNo,
            status: order.status,
            statusText: this.getStatusText(order.status),
            payStatus: order.payStatus,
            orderAmount: order.amount,
            discountAmount: order.discountAmount,
            actualAmount: order.actualAmount,
            createdAt: order.createdAt?.toISOString(),
            paidAt: order.paidAt?.toISOString(),
            shippedAt: order.shippedAt?.toISOString(),
            deliveredAt: order.deliveredAt?.toISOString(),
            items: [
                {
                    skuId: 'SKU001',
                    title: order.productName,
                    quantity: order.quantity,
                    price: order.productPrice,
                },
            ],
            shippingAddress: order.shippingAddress,
            receiverName: order.receiverName,
            receiverPhone: order.receiverPhone,
            logistics: logistics ? {
                carrier: logistics.carrier,
                trackingNo: logistics.trackingNo,
                status: logistics.status,
                currentLocation: logistics.currentLocation,
            } : undefined,
        };
    }
    getStatusText(status) {
        const texts = {
            PENDING: '待支付',
            PAID: '已支付',
            TO_BE_SHIPPED: '待发货',
            SHIPPED: '已发货',
            DELIVERED: '已送达',
            CANCELLED: '已取消',
            REFUNDED: '已退款',
        };
        return texts[status] || status;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrderService);
//# sourceMappingURL=order.service.js.map