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
  // 电子产品
  {
    sku_id: 'SKU001',
    name: 'iPhone 15 Pro Max 256GB',
    price: 9999,
    detail_url: '/product/SKU001',
    short_reason: '最新旗舰机型，A17 Pro芯片，钛金属设计',
    category: 'electronics',
  },
  {
    sku_id: 'SKU002',
    name: 'AirPods Pro 第二代',
    price: 1899,
    detail_url: '/product/SKU002',
    short_reason: '主动降噪，空间音频，MagSafe充电盒',
    category: 'electronics',
  },
  {
    sku_id: 'SKU003',
    name: 'MacBook Air 15寸 M2',
    price: 9499,
    detail_url: '/product/SKU003',
    short_reason: '轻薄便携，M2芯片，续航长达18小时',
    category: 'electronics',
  },
  {
    sku_id: 'SKU004',
    name: 'iPad Pro 12.9寸 M2',
    price: 9299,
    detail_url: '/product/SKU004',
    short_reason: '专业级平板，M2芯片，Liquid Retina XDR显示屏',
    category: 'electronics',
  },
  {
    sku_id: 'SKU005',
    name: 'Apple Watch Series 9',
    price: 3299,
    detail_url: '/product/SKU005',
    short_reason: '智能手表，S9芯片，全天健康监测',
    category: 'electronics',
  },
  {
    sku_id: 'SKU006',
    name: 'AirPods Max',
    price: 3999,
    detail_url: '/product/SKU006',
    short_reason: '头戴式降噪耳机，H1芯片，空间音频',
    category: 'electronics',
  },
  {
    sku_id: 'SKU007',
    name: '华为Mate 60 Pro',
    price: 6999,
    detail_url: '/product/SKU007',
    short_reason: 'Mate系列最新旗舰，卫星通话，昆仑玻璃',
    category: 'electronics',
  },
  {
    sku_id: 'SKU008',
    name: '小米14 Ultra',
    price: 6499,
    detail_url: '/product/SKU008',
    short_reason: '徕卡光学，1英寸大底，专业影像旗舰',
    category: 'electronics',
  },
  // 白酒
  {
    sku_id: 'SKU101',
    name: '贵州茅台 53度 500ml',
    price: 2999,
    detail_url: '/product/SKU101',
    short_reason: '酱香型白酒代表，千年酿酒工艺',
    category: 'baijiu',
  },
  {
    sku_id: 'SKU102',
    name: '五粮液 52度 500ml',
    price: 1299,
    detail_url: '/product/SKU102',
    short_reason: '浓香型白酒典范，五粮精华酿造',
    category: 'baijiu',
  },
  {
    sku_id: 'SKU103',
    name: '泸州老窖 1573 52度 500ml',
    price: 1099,
    detail_url: '/product/SKU103',
    short_reason: '国窖1573，浓香型白酒鼻祖',
    category: 'baijiu',
  },
  {
    sku_id: 'SKU104',
    name: '洋河梦之蓝 M6+ 52度 500ml',
    price: 899,
    detail_url: '/product/SKU104',
    short_reason: '绵柔型白酒，蓝色经典系列',
    category: 'baijiu',
  },
  {
    sku_id: 'SKU105',
    name: '郎酒 青花郎 53度 500ml',
    price: 1199,
    detail_url: '/product/SKU105',
    short_reason: '酱香典范，川酒代表',
    category: 'baijiu',
  },
  // 红酒
  {
    sku_id: 'SKU201',
    name: '拉菲城堡干红 2019',
    price: 5888,
    detail_url: '/product/SKU201',
    short_reason: '法国波尔多一级庄，82年经典年份',
    category: 'wine',
  },
  {
    sku_id: 'SKU202',
    name: '奔富葛兰许干红',
    price: 3288,
    detail_url: '/product/SKU202',
    short_reason: '澳大利亚红酒旗舰，设为 Grange 系列',
    category: 'wine',
  },
  {
    sku_id: 'SKU203',
    name: '张裕解百纳干红',
    price: 198,
    detail_url: '/product/SKU203',
    short_reason: '中国红酒百年品牌，珍藏版',
    category: 'wine',
  },
  // 电器
  {
    sku_id: 'SKU301',
    name: '戴森 V15 吸尘器',
    price: 4990,
    detail_url: '/product/SKU301',
    short_reason: '无线吸尘器，激光探测，自动调速',
    category: 'appliance',
  },
  {
    sku_id: 'SKU302',
    name: '美的 1.5匹变频空调',
    price: 2699,
    detail_url: '/product/SKU302',
    short_reason: '新一级能效，智能变频，节能省电',
    category: 'appliance',
  },
  {
    sku_id: 'SKU303',
    name: '海尔 600L 对开门冰箱',
    price: 4999,
    detail_url: '/product/SKU303',
    short_reason: '大容量嵌入式冰箱，风冷无霜',
    category: 'appliance',
  },
  {
    sku_id: 'SKU304',
    name: '西门子 10KG 滚筒洗衣机',
    price: 5999,
    detail_url: '/product/SKU304',
    short_reason: '智能投放，变频静音，节能洗烘',
    category: 'appliance',
  },
  // 服装
  {
    sku_id: 'SKU401',
    name: '海澜之家商务西服套装',
    price: 699,
    detail_url: '/product/SKU401',
    short_reason: '修身剪裁，商务正装，限时特惠',
    category: 'clothing',
  },
  {
    sku_id: 'SKU402',
    name: '优衣库联名款T恤',
    price: 99,
    detail_url: '/product/SKU402',
    short_reason: '纯棉舒适，多色可选，基础百搭',
    category: 'clothing',
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

    // 按关键词搜索 + 分类搜索
    let results = MOCK_PRODUCTS.filter(p => {
      const keywordMatch = p.name.toLowerCase().includes(req.query.toLowerCase()) ||
        p.short_reason.toLowerCase().includes(req.query.toLowerCase());
      // 分类匹配（如"电子"匹配"electronics"）
      const categoryMatch = p.category && (
        p.category.includes(req.query.toLowerCase()) ||
        (req.query.includes('电子') && p.category === 'electronics') ||
        (req.query.includes('白酒') && p.category === 'baijiu') ||
        (req.query.includes('红酒') && p.category === 'wine') ||
        (req.query.includes('电器') && p.category === 'appliance') ||
        (req.query.includes('服装') && p.category === 'clothing')
      );
      return keywordMatch || categoryMatch;
    });

    // 如果没有匹配的，返回空数组（不再返回所有商品）
    if (results.length === 0) {
      return { items: [] };
    }

    // 按预算过滤
    if (req.budget_min !== undefined) {
      results = results.filter(p => p.price >= req.budget_min!);
    }
    if (req.budget_max !== undefined) {
      results = results.filter(p => p.price <= req.budget_max!);
    }

    // 限制返回数量
    results = results.slice(0, 5);

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