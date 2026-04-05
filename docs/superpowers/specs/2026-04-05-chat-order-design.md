# 聊天下单功能设计

## 概述

在现有聊天服务中增加下单功能，用户可以通过自然对话（如「买2个空滤器总成」）直接创建订单。

## 功能需求

- 意图识别：识别用户下单意图（关键词 + 数量+产品名模式）
- 下单能力：指定产品名和数量，随机生成单价
- 物流信息：自动创建物流信息（随机快递公司和运单号）
- 支付流程：无需支付，下单后直接设为已支付状态（演示用）

## 设计

### 1. 意图识别层 (IntentRouter)

新增下单意图 `ORDER_CREATE`：
- 关键词：购买、订货、下单、买、要、订购
- 模式：`\d+个?(.+)` 或 `\d+件?(.+)` 或 `(.+)\d+个?`

```typescript
// src/modules/intent-router/intent-router.service.ts
export enum BusinessIntent {
  ORDER_STATUS_QUERY = 'order_status_query',
  LOGISTICS_QUERY = 'logistics_query',
  ORDER_CREATE = 'order_create',  // 新增
  GENERAL_AI_QUERY = 'general_ai_query',
}
```

### 2. 订单服务层 (OrderService)

新增方法：
```typescript
// src/modules/order/order.service.ts
async createOrderFromChat(
  productName: string,
  quantity: number,
  storeId: string,
  userId?: string,
): Promise<OrderInfo>
```

**实现逻辑**：
1. 随机生成单价（10-500 元区间）
2. 计算总价 = 单价 × 数量
3. 创建订单，状态设为 `PAID`（跳过支付）
4. 自动创建物流信息（随机快递公司和运单号）
5. 返回订单信息

### 3. 聊天服务层 (ChatService)

处理 `ORDER_CREATE` 意图：
```typescript
// src/modules/chat/chat.service.ts
private async handleOrderCreate(
  productName: string,
  quantity: number,
  session: ChatSession,
): Promise<string>
```

**响应格式**：
```
订单已创建！
订单号：DD20260405120001
商品：{productName} x {quantity}
单价：¥{price}
总价：¥{total}
状态：已支付
快递：{carrier} {trackingNo}
```

### 4. 消息流程

```
用户发送消息 → IntentRouter 识别 ORDER_CREATE
  ↓
解析产品名和数量 → ChatService.handleOrderCreate
  ↓
调用 OrderService.createOrderFromChat
  ↓
创建订单 + 物流 → 返回订单信息
  ↓
AI 响应用户
```

## 数据库

无需新增表，复用现有 Order、Logistics 模型。

## 测试用例

| 输入 | 解析结果 |
|-----|---------|
| 买2个空滤器 | 产品名=空滤器, 数量=2 |
| 订购5件SC1599 | 产品名=SC1599, 数量=5 |
| 我要买3个过滤器 | 产品名=过滤器, 数量=3 |

## 风险与限制

- 随机单价仅用于演示，生产环境需对接真实价格系统
- 产品名解析依赖 Dify AI 的理解能力
- 未集成真实支付渠道