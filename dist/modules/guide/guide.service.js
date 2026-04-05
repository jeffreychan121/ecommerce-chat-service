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
var GuideService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const client_1 = require("@prisma/client");
const MOCK_PRODUCTS = [
    {
        sku_id: 'SKU001',
        name: 'iPhone 15 Pro Max 256GB',
        price: 9999,
        detail_url: '/product/SKU001',
        short_reason: '最新旗舰机型，A17 Pro芯片，钛金属设计',
    },
    {
        sku_id: 'SKU002',
        name: 'AirPods Pro 第二代',
        price: 1899,
        detail_url: '/product/SKU002',
        short_reason: '主动降噪，空间音频，MagSafe充电盒',
    },
    {
        sku_id: 'SKU003',
        name: 'MacBook Air 15寸 M2',
        price: 9499,
        detail_url: '/product/SKU003',
        short_reason: '轻薄便携，M2芯片，续航长达18小时',
    },
    {
        sku_id: 'SKU004',
        name: 'iPad Pro 12.9寸 M2',
        price: 9299,
        detail_url: '/product/SKU004',
        short_reason: '专业级平板，M2芯片，Liquid Retina XDR显示屏',
    },
    {
        sku_id: 'SKU005',
        name: 'Apple Watch Series 9',
        price: 3299,
        detail_url: '/product/SKU005',
        short_reason: '智能手表，S9芯片，全天健康监测',
    },
];
let GuideService = GuideService_1 = class GuideService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GuideService_1.name);
    }
    async searchProducts(req) {
        this.logger.log(`[GuideService] 搜索商品: ${JSON.stringify(req)}`);
        let results = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(req.query.toLowerCase()) ||
            p.short_reason.toLowerCase().includes(req.query.toLowerCase()));
        if (results.length === 0) {
            results = MOCK_PRODUCTS;
        }
        if (req.budget_min !== undefined) {
            results = results.filter(p => p.price >= req.budget_min);
        }
        if (req.budget_max !== undefined) {
            results = results.filter(p => p.price <= req.budget_max);
        }
        return { items: results };
    }
    async checkStock(req) {
        this.logger.log(`[GuideService] 查询库存: ${JSON.stringify(req)}`);
        const items = req.sku_ids.map(skuId => {
            const product = MOCK_PRODUCTS.find(p => p.sku_id === skuId);
            return {
                sku_id: skuId,
                in_stock: !!product,
                stock_text: product ? '有货' : '无货',
            };
        });
        return { items };
    }
    async checkPromo(req) {
        this.logger.log(`[GuideService] 查询活动: ${JSON.stringify(req)}`);
        const items = req.sku_ids.map(skuId => {
            const product = MOCK_PRODUCTS.find(p => p.sku_id === skuId);
            if (!product) {
                return { sku_id: skuId, promo_text: '', final_price: 0 };
            }
            let promo_text = '暂无活动';
            let final_price = product.price;
            if (product.price > 5000) {
                promo_text = '限时免息分期至高24期';
                final_price = product.price;
            }
            else if (product.price > 2000) {
                promo_text = '赠配件免息分期';
                final_price = product.price;
            }
            return {
                sku_id: skuId,
                promo_text,
                final_price,
            };
        });
        return { items };
    }
    async createLead(req) {
        this.logger.log(`[GuideService] 创建留资: ${JSON.stringify(req)}`);
        let user = await this.prisma.user.findUnique({
            where: { phone: req.userPhone },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: { phone: req.userPhone },
            });
        }
        const lead = await this.prisma.lead.create({
            data: {
                userId: user.id,
                storeId: req.storeId,
                skuId: req.skuId,
                skuName: req.skuName,
                quantity: req.quantity || 1,
                price: req.price,
                intent: req.intent,
                userPhone: req.userPhone,
                status: client_1.LeadStatus.PENDING,
            },
        });
        this.logger.log(`[GuideService] 留资创建成功: ${lead.id}`);
        return {
            success: true,
            lead_id: lead.id,
            message: '感谢您的咨询，客服将尽快与您联系',
        };
    }
    async getLeads(storeId) {
        this.logger.log(`[GuideService] 获取留资列表, storeId: ${storeId}`);
        const where = {};
        if (storeId) {
            where.storeId = storeId;
        }
        return this.prisma.lead.findMany({
            where,
            include: {
                user: true,
                store: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateLeadStatus(leadId, status) {
        this.logger.log(`[GuideService] 更新留资状态: ${leadId} -> ${status}`);
        const lead = await this.prisma.lead.update({
            where: { id: leadId },
            data: { status },
        });
        return lead;
    }
};
exports.GuideService = GuideService;
exports.GuideService = GuideService = GuideService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GuideService);
//# sourceMappingURL=guide.service.js.map