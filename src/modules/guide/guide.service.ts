import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import {
  SearchProductsRequest,
  SearchProductsResponse,
  ProductItem,
  CheckStockRequest,
  CheckStockResponse,
  CheckPromoRequest,
  CheckPromoResponse,
  CreateLeadRequest,
  CreateLeadResponse,
} from './guide.types';
import { Lead, LeadIntent, LeadStatus, Prisma } from '@prisma/client';

// Mock 商品数据
const MOCK_PRODUCTS: ProductItem[] = [
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

@Injectable()
export class GuideService {
  private readonly logger = new Logger(GuideService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 商品搜索
   * 根据关键词、预算、场景等条件搜索商品
   */
  async searchProducts(req: SearchProductsRequest): Promise<SearchProductsResponse> {
    this.logger.log(`[GuideService] 搜索商品: ${JSON.stringify(req)}`);

    // 简单 mock 逻辑：返回包含关键词的商品
    let results = MOCK_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(req.query.toLowerCase()) ||
      p.short_reason.toLowerCase().includes(req.query.toLowerCase())
    );

    // 如果没有匹配的，返回所有商品
    if (results.length === 0) {
      results = MOCK_PRODUCTS;
    }

    // 按预算过滤
    if (req.budget_min !== undefined) {
      results = results.filter(p => p.price >= req.budget_min!);
    }
    if (req.budget_max !== undefined) {
      results = results.filter(p => p.price <= req.budget_max!);
    }

    return { items: results };
  }

  /**
   * 库存查询
   */
  async checkStock(req: CheckStockRequest): Promise<CheckStockResponse> {
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

  /**
   * 活动查询
   */
  async checkPromo(req: CheckPromoRequest): Promise<CheckPromoResponse> {
    this.logger.log(`[GuideService] 查询活动: ${JSON.stringify(req)}`);

    const items = req.sku_ids.map(skuId => {
      const product = MOCK_PRODUCTS.find(p => p.sku_id === skuId);
      if (!product) {
        return { sku_id: skuId, promo_text: '', final_price: 0 };
      }

      // Mock 活动逻辑
      let promo_text = '暂无活动';
      let final_price = product.price;

      if (product.price > 5000) {
        promo_text = '限时免息分期至高24期';
        final_price = product.price;
      } else if (product.price > 2000) {
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

  /**
   * 留资创建
   */
  async createLead(req: CreateLeadRequest): Promise<CreateLeadResponse> {
    this.logger.log(`[GuideService] 创建留资: ${JSON.stringify(req)}`);

    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { phone: req.userPhone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: req.userPhone },
      });
    }

    // 创建留资记录
    const lead = await this.prisma.lead.create({
      data: {
        userId: user.id,
        storeId: req.storeId,
        skuId: req.skuId,
        skuName: req.skuName,
        quantity: req.quantity || 1,
        price: req.price,
        intent: req.intent as LeadIntent,
        userPhone: req.userPhone,
        status: LeadStatus.PENDING,
      },
    });

    this.logger.log(`[GuideService] 留资创建成功: ${lead.id}`);

    return {
      success: true,
      lead_id: lead.id,
      message: '感谢您的咨询，客服将尽快与您联系',
    };
  }

  /**
   * 获取留资列表
   */
  async getLeads(storeId?: string): Promise<Lead[]> {
    this.logger.log(`[GuideService] 获取留资列表, storeId: ${storeId}`);

    const where: Prisma.LeadWhereInput = {};
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

  /**
   * 更新留资状态
   */
  async updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead> {
    this.logger.log(`[GuideService] 更新留资状态: ${leadId} -> ${status}`);

    const lead = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    return lead;
  }
}