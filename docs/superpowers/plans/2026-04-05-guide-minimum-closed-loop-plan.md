# 导购最小闭环实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现商城聊天 + Dify 导购最小闭环，包括商品搜索、库存查询、活动查询、留资创建等接口

**Architecture:** 在现有后端新增导购模块（GuideModule），提供 RESTful API 供 Dify Chatflow HTTP Request 节点调用

**Tech Stack:** NestJS, Prisma, TypeScript

---

## 文件结构

```
src/modules/guide/
├── guide.module.ts          # 导购模块
├── guide.service.ts         # 导购服务（mock 数据 + 接口实现）
├── guide.controller.ts      # 导购 API 控制器
├── guide.types.ts          # 类型定义
└── dto/
    ├── search-products.dto.ts
    ├── check-stock.dto.ts
    ├── check-promo.dto.ts
    └── create-lead.dto.ts
```

---

## Task 1: 创建导购模块基础结构

**Files:**
- Create: `src/modules/guide/guide.module.ts`
- Create: `src/modules/guide/guide.types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/modules/guide/guide.types.ts

// 商品搜索请求
export interface SearchProductsRequest {
  store_id: string;
  store_type: 'self' | 'merchant';
  query: string;
  budget_min?: number;
  budget_max?: number;
  scene?: string;
  preference?: string;
}

// 商品项
export interface ProductItem {
  sku_id: string;
  name: string;
  price: number;
  detail_url: string;
  short_reason: string;
}

// 商品搜索响应
export interface SearchProductsResponse {
  items: ProductItem[];
}

// 库存查询请求
export interface CheckStockRequest {
  store_id: string;
  sku_ids: string[];
}

// 库存项
export interface StockItem {
  sku_id: string;
  in_stock: boolean;
  stock_text: string;
}

// 库存查询响应
export interface CheckStockResponse {
  items: StockItem[];
}

// 活动查询请求
export interface CheckPromoRequest {
  store_id: string;
  sku_ids: string[];
}

// 活动项
export interface PromoItem {
  sku_id: string;
  promo_text: string;
  final_price: number;
}

// 活动查询响应
export interface CheckPromoResponse {
  items: PromoItem[];
}

// 留资请求
export interface CreateLeadRequest {
  user_id: string;
  store_id: string;
  sku_id: string;
  intent: 'buy' | 'consult' | 'compare';
  phone: string;
  remark?: string;
}

// 留资响应
export interface CreateLeadResponse {
  success: boolean;
  lead_id: string;
  message: string;
}
```

- [ ] **Step 2: 创建模块文件**

```typescript
// src/modules/guide/guide.module.ts
import { Module } from '@nestjs/common';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';

@Module({
  controllers: [GuideController],
  providers: [GuideService],
  exports: [GuideService],
})
export class GuideModule {}
```

- [ ] **Step 3: 在 AppModule 中注册 GuideModule**

修改 `src/app.module.ts`，添加 GuideModule 导入

- [ ] **Step 4: 提交**

```bash
git add src/modules/guide/
git commit -m "feat: 添加导购模块基础结构"
```

---

## Task 2: 实现商品搜索接口 (Mock)

**Files:**
- Create: `src/modules/guide/guide.service.ts`
- Create: `src/modules/guide/dto/search-products.dto.ts`

- [ ] **Step 1: 创建搜索商品 DTO**

```typescript
// src/modules/guide/dto/search-products.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class SearchProductsDto {
  @IsString()
  store_id: string;

  @IsEnum(['self', 'merchant'])
  store_type: 'self' | 'merchant';

  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  budget_min?: number;

  @IsOptional()
  @IsNumber()
  budget_max?: number;

  @IsOptional()
  @IsString()
  scene?: string;

  @IsOptional()
  @IsString()
  preference?: string;
}
```

- [ ] **Step 2: 在 GuideService 中实现商品搜索（Mock）**

```typescript
// src/modules/guide/guide.service.ts
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
```

- [ ] **Step 3: 提交**

```bash
git add src/modules/guide/
git commit -m "feat: 实现商品搜索接口 (Mock)"
```

---

## Task 3: 实现其他导购接口

**Files:**
- Create: `src/modules/guide/dto/check-stock.dto.ts`
- Create: `src/modules/guide/dto/check-promo.dto.ts`
- Create: `src/modules/guide/dto/create-lead.dto.ts`
- Modify: `src/modules/guide/guide.service.ts` (已在 Task 2 实现)

- [ ] **Step 1: 创建库存查询 DTO**

```typescript
// src/modules/guide/dto/check-stock.dto.ts
import { IsString, IsArray, IsEnum } from 'class-validator';

export class CheckStockDto {
  @IsString()
  store_id: string;

  @IsArray()
  @IsString({ each: true })
  sku_ids: string[];
}
```

- [ ] **Step 2: 创建活动查询 DTO**

```typescript
// src/modules/guide/dto/check-promo.dto.ts
import { IsString, IsArray, IsEnum } from 'class-validator';

export class CheckPromoDto {
  @IsString()
  store_id: string;

  @IsArray()
  @IsString({ each: true })
  sku_ids: string[];
}
```

- [ ] **Step 3: 创建留资创建 DTO**

```typescript
// src/modules/guide/dto/create-lead.dto.ts
import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  user_id: string;

  @IsString()
  store_id: string;

  @IsString()
  sku_id: string;

  @IsEnum(['buy', 'consult', 'compare'])
  intent: 'buy' | 'consult' | 'compare';

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
```

- [ ] **Step 4: 提交**

```bash
git add src/modules/guide/
git commit -m "feat: 实现库存/活动/留资接口 DTO"
```

---

## Task 4: 创建导购控制器

**Files:**
- Create: `src/modules/guide/guide.controller.ts`

- [ ] **Step 1: 创建控制器**

```typescript
// src/modules/guide/guide.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GuideService } from './guide.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { CheckStockDto } from './dto/check-stock.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('api/guide')
export class GuideController {
  private readonly logger = new Logger(GuideController.name);

  constructor(private readonly guideService: GuideService) {}

  /**
   * 商品搜索
   * Dify Chatflow HTTP Request 节点调用此接口搜索商品
   */
  @Post('search-products')
  @HttpCode(HttpStatus.OK)
  async searchProducts(@Body() dto: SearchProductsDto) {
    this.logger.log(`[GuideController] search-products: ${JSON.stringify(dto)}`);
    return this.guideService.searchProducts(dto);
  }

  /**
   * 库存查询
   */
  @Post('check-stock')
  @HttpCode(HttpStatus.OK)
  async checkStock(@Body() dto: CheckStockDto) {
    this.logger.log(`[GuideController] check-stock: ${JSON.stringify(dto)}`);
    return this.guideService.checkStock(dto);
  }

  /**
   * 活动查询
   */
  @Post('check-promo')
  @HttpCode(HttpStatus.OK)
  async checkPromo(@Body() dto: CheckPromoDto) {
    this.logger.log(`[GuideController] check-promo: ${JSON.stringify(dto)}`);
    return this.guideService.checkPromo(dto);
  }

  /**
   * 留资创建
   */
  @Post('create-lead')
  @HttpCode(HttpStatus.OK)
  async createLead(@Body() dto: CreateLeadDto) {
    this.logger.log(`[GuideController] create-lead: ${JSON.stringify(dto)}`);
    return this.guideService.createLead(dto);
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/modules/guide/
git commit -m "feat: 添加导购 API 控制器"
```

---

## Task 5: 更新 Dify Inputs 配置

**Files:**
- Modify: `src/modules/dify/dto/dify.dto.ts`

- [ ] **Step 1: 检查现有 DifyInputs 并添加注释说明**

```typescript
// src/modules/dify/dto/dify.dto.ts

// Dify 输入参数
// 注意：这些参数会在每次调用 Dify Chatflow 时传递
// Dify Chatflow 内部会维护 cv_budget, cv_scene, cv_preference, cv_last_products 等会话变量
export class DifyInputs {
  phone: string;           // 用户手机号
  store_id: string;       // 店铺ID
  store_type: 'self' | 'merchant';  // 店铺类型
  channel: string;        // 渠道（H5/小程序/APP）
  customer_id?: string;  // 客户ID（可选）
  // === 导购相关参数（可选）===
  // cv_budget?: string;    // 预算（由 Dify 维护）
  // cv_scene?: string;    // 场景（由 Dify 维护）
  // cv_preference?: string; // 偏好（由 Dify 维护）
}
```

- [ ] **Step 2: 提交**

```bash
git add src/modules/dify/dto/dify.dto.ts
git commit -m "docs: 补充 Dify Inputs 参数说明"
```

---

## Task 6: 添加测试用例（可选）

**Files:**
- Create: `test/guide.service.spec.ts`

- [ ] **Step 1: 创建基础测试**

```typescript
// test/guide.service.spec.ts
import { describe, it, expect } from 'vitest';
import { GuideService } from '../src/modules/guide/guide.service';

describe('GuideService', () => {
  const guideService = new GuideService({} as any);

  describe('searchProducts', () => {
    it('should return products', async () => {
      const result = await guideService.searchProducts({
        store_id: 'store_001',
        store_type: 'self',
        query: 'iPhone',
      });
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('checkStock', () => {
    it('should return stock info', async () => {
      const result = await guideService.checkStock({
        store_id: 'store_001',
        sku_ids: ['SKU001', 'SKU002'],
      });
      expect(result.items.length).toBe(2);
    });
  });

  describe('createLead', () => {
    it('should create lead', async () => {
      const result = await guideService.createLead({
        user_id: 'user_001',
        store_id: 'store_001',
        sku_id: 'SKU001',
        intent: 'buy',
        phone: '13800138000',
      });
      expect(result.success).toBe(true);
      expect(result.lead_id).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: 提交**

```bash
git add test/guide.service.spec.ts
git commit -m "test: 添加导购服务基础测试"
```

---

## Task 7: 更新文档

**Files:**
- Modify: `README.md` 或 Create: `docs/guide-api.md`

- [ ] **Step 1: 创建导购 API 文档**

```markdown
# 导购 API 文档

## 概述
本系统提供导购相关 API，供 Dify Chatflow HTTP Request 节点调用。

## 接口列表

### 1. 商品搜索
- **路径**: POST /api/guide/search-products
- **请求体**:
```json
{
  "store_id": "store_001",
  "store_type": "self",
  "query": "iPhone",
  "budget_min": 5000,
  "budget_max": 10000,
  "scene": "礼物",
  "preference": "高端"
}
```
- **响应**:
```json
{
  "items": [
    {
      "sku_id": "SKU001",
      "name": "iPhone 15 Pro Max 256GB",
      "price": 9999,
      "detail_url": "/product/SKU001",
      "short_reason": "最新旗舰机型..."
    }
  ]
}
```

### 2. 库存查询
- **路径**: POST /api/guide/check-stock
- **请求体**:
```json
{
  "store_id": "store_001",
  "sku_ids": ["SKU001", "SKU002"]
}
```

### 3. 活动查询
- **路径**: POST /api/guide/check-promo
- **请求体**:
```json
{
  "store_id": "store_001",
  "sku_ids": ["SKU001", "SKU002"]
}
```

### 4. 留资创建
- **路径**: POST /api/guide/create-lead
- **请求体**:
```json
{
  "user_id": "user_001",
  "store_id": "store_001",
  "sku_id": "SKU001",
  "intent": "buy",
  "phone": "13800138000",
  "remark": "想要256GB版本"
}
```

## Dify Chatflow 配置

在 Dify Chatflow 中添加 HTTP Request 节点，配置上述接口地址：
- Base URL: http://your-server:3000
- 认证: 可选（当前无认证）

## 注意事项

1. 所有接口返回 JSON 格式
2. store_type 必须为 "self" 或 "merchant"
3. intent 必须为 "buy", "consult" 或 "compare"
```

- [ ] **Step 2: 提交**

```bash
git add docs/guide-api.md
git commit -m "docs: 添加导购 API 文档"
```

---

## 验证步骤

1. **启动后端服务**
```bash
pnpm run build && pnpm run start:dev
```

2. **测试商品搜索接口**
```bash
curl -X POST http://localhost:3000/api/guide/search-products \
  -H "Content-Type: application/json" \
  -d '{"store_id":"store_001","store_type":"self","query":"iPhone"}'
```

3. **测试留资接口**
```bash
curl -X POST http://localhost:3000/api/guide/create-lead \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_001","store_id":"store_001","sku_id":"SKU001","intent":"buy","phone":"13800138000"}'
```

4. **在前端聊天窗口测试完整流程**
   - 输入商品需求（如"我想买 iPhone"）
   - 观察 Dify 返回推荐结果