"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntentRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentRouterService = exports.BusinessIntent = void 0;
const common_1 = require("@nestjs/common");
var BusinessIntent;
(function (BusinessIntent) {
    BusinessIntent["ORDER_STATUS_QUERY"] = "order_status_query";
    BusinessIntent["LOGISTICS_QUERY"] = "logistics_query";
    BusinessIntent["ORDER_CREATE"] = "order_create";
    BusinessIntent["GENERAL_AI_QUERY"] = "general_ai_query";
})(BusinessIntent || (exports.BusinessIntent = BusinessIntent = {}));
let IntentRouterService = IntentRouterService_1 = class IntentRouterService {
    constructor() {
        this.logger = new common_1.Logger(IntentRouterService_1.name);
        this.ORDER_KEYWORDS = [
            '订单', '订单号', '订单状态', '发货', '什么时候发货',
            '已下单', '下单', '待发货', '待收货', '已发货',
            '付款', '支付', '取消订单', '订单取消', '查询', '查一下', '多少钱'
        ];
        this.LOGISTICS_KEYWORDS = [
            '物流', '快递', '配送', '送到', '运送', '运输',
            '到哪了', '到哪里', '快递到', '发货了吗', '发货了没',
            '何时送达', '什么时候到', '轨迹', '运单', '单号'
        ];
        this.ORDER_CREATE_KEYWORDS = [
            '购买', '订货', '下单', '买', '要', '订购', '订', '帮我要', '帮我买'
        ];
        this.ORDER_CREATE_PATTERNS = [
            /(\d+)(个|件|台|套)(.+)/,
            /(.+?)(\d+)(个|件|台|套)$/,
        ];
        this.ORDER_NO_PATTERN = /(?:订单[号]?|#|ORD|DD)(\d{6,20})/gi;
    }
    route(message) {
        const normalizedMessage = message.trim();
        this.logger.log(`Routing message: ${normalizedMessage}`);
        const extractedOrderNo = this.extractOrderNo(normalizedMessage);
        this.logger.log(`Extracted orderNo: ${extractedOrderNo}`);
        const orderCreateResult = this.matchOrderCreate(normalizedMessage);
        if (orderCreateResult) {
            this.logger.log(`Matched ORDER_CREATE: productName=${orderCreateResult.productName}, quantity=${orderCreateResult.quantity}`);
            return {
                intent: BusinessIntent.ORDER_CREATE,
                productName: orderCreateResult.productName,
                quantity: orderCreateResult.quantity,
                confidence: 0.9,
                needMoreInfo: false,
            };
        }
        const orderMatchScore = this.matchKeywords(normalizedMessage, this.ORDER_KEYWORDS);
        if (orderMatchScore > 0) {
            const needMoreInfo = !extractedOrderNo;
            return {
                intent: BusinessIntent.ORDER_STATUS_QUERY,
                orderNo: extractedOrderNo,
                confidence: orderMatchScore,
                needMoreInfo,
                promptForInfo: needMoreInfo ? '请提供您的订单号，以便我为您查询订单状态' : undefined,
            };
        }
        const logisticsMatchScore = this.matchKeywords(normalizedMessage, this.LOGISTICS_KEYWORDS);
        if (logisticsMatchScore > 0 || extractedOrderNo) {
            const needMoreInfo = !extractedOrderNo;
            return {
                intent: BusinessIntent.LOGISTICS_QUERY,
                orderNo: extractedOrderNo,
                confidence: logisticsMatchScore > 0 ? logisticsMatchScore : 0.8,
                needMoreInfo,
                promptForInfo: needMoreInfo ? '请提供您的订单号或快递单号，以便我为您查询物流信息' : undefined,
            };
        }
        return {
            intent: BusinessIntent.GENERAL_AI_QUERY,
            confidence: 0.5,
            needMoreInfo: false,
        };
    }
    extractOrderNo(message) {
        message = message.trim();
        const ddMatch = message.match(/^(DD|ORD)(\d{6,20})$/i);
        if (ddMatch) {
            return ddMatch[1].toUpperCase() + ddMatch[2];
        }
        const patterns = [
            /(?:订单[号]?|订单状态|查订单|查询订单|订单查询|#)\s*([Dd][Dd]?)(\d{6,20})/i,
            /(?:订单[号]?|订单状态|查订单|查询订单|订单查询|#)\s*(\d{6,20})/i,
        ];
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                if (match[1] && /^[Dd][Dd]?$/i.test(match[1])) {
                    return match[1].toUpperCase() + match[2];
                }
                if (match[1] && /^\d+$/.test(match[1])) {
                    return match[1];
                }
            }
        }
        const cleaned = message.replace(/[A-Za-z]/g, '');
        if (/^\d{6,20}$/.test(cleaned)) {
            return cleaned;
        }
        return undefined;
    }
    matchKeywords(message, keywords) {
        let matchedCount = 0;
        const lowerMessage = message.toLowerCase();
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword.toLowerCase())) {
                matchedCount++;
            }
        }
        if (matchedCount === 0)
            return 0;
        if (matchedCount === 1)
            return 0.6;
        if (matchedCount === 2)
            return 0.8;
        return Math.min(0.95, 0.6 + matchedCount * 0.1);
    }
    matchOrderCreate(message) {
        const hasKeyword = this.ORDER_CREATE_KEYWORDS.some(k => message.includes(k));
        if (!hasKeyword)
            return null;
        for (const pattern of this.ORDER_CREATE_PATTERNS) {
            const match = message.match(pattern);
            if (match) {
                let quantity;
                let productName;
                if (/^\d+$/.test(match[1])) {
                    quantity = parseInt(match[1], 10);
                    productName = match[3]?.trim() || '';
                }
                else {
                    productName = match[1]?.trim() || '';
                    quantity = parseInt(match[2], 10);
                }
                if (quantity && productName && quantity > 0) {
                    productName = productName.replace(/(个|件|台|套)$/, '').trim();
                    if (productName) {
                        return { productName, quantity };
                    }
                }
            }
        }
        return null;
    }
};
exports.IntentRouterService = IntentRouterService;
exports.IntentRouterService = IntentRouterService = IntentRouterService_1 = __decorate([
    (0, common_1.Injectable)()
], IntentRouterService);
//# sourceMappingURL=intent-router.service.js.map