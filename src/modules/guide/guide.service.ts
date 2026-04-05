import { Injectable, Logger } from '@nestjs/common';
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

    // Mock: 生成留资ID
    const lead_id = `LEAD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[GuideService] 留资创建成功: ${lead_id}`);

    return {
      success: true,
      lead_id,
      message: '感谢您的咨询，客服将尽快与您联系',
    };
  }
}