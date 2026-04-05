# 聊天下单功能实现计划

> **For agentic workers:** 使用 superpowers:subagent-driven-development 或 superpowers:executing-plans 执行此计划。

**目标：** 在聊天服务中增加下单功能，用户可通过自然对话创建订单

**架构：** 在 IntentRouter 新增 ORDER_CREATE 意图，ChatService 处理下单逻辑，OrderService 创建订单和物流

**技术栈：** NestJS, Prisma, TypeScript

---

### Task 1: 新增 ORDER_CREATE 意图类型

**Files:**
- Modify: `src/modules/intent-router/intent-router.service.ts:3-7`

- [ ] **Step 1: 添加意图类型**

```typescript
// src/modules/intent-router/intent-router.service.ts 第3-7行
export enum BusinessIntent {
  ORDER_STATUS_QUERY = 'order_status_query',
  LOGISTICS_QUERY = 'logistics_query',
  ORDER_CREATE = 'order_create',  // 新增
  GENERAL_AI_QUERY = 'general_ai_query',
}
```

- [ ] **Step 2: 添加 IntentResult 扩展**

```typescript
// IntentResult 接口添加 productName 和 quantity 字段
export interface IntentResult {
  intent: BusinessIntent;
  orderNo?: string;
  productName?: string;  // 新增：产品名
  quantity?: number;      // 新增：数量
  confidence: number;
  needMoreInfo: boolean;
  promptForInfo?: string;
}
```

- [ ] **Step 3: 添加下单关键词和模式**

```typescript
// IntentRouterService 类中添加
private readonly ORDER_CREATE_KEYWORDS = ['购买', '订货', '下单', '买', '要', '订购', '下单'];

private readonly ORDER_CREATE_PATTERNS = [
  /(\d+)个?(.+)/,           // 买2个xxx
  /(\d+)件?(.+)/,           // 买2件xxx
  /(.+?)(\d+)个?$/,         // xxx2个
  /(.+?)(\d+)件?$/,        // xxx2件
];
```

- [ ] **Step 4: 实现 detectIntent 方法扩展**

在 IntentRouterService.detectIntent 方法中添加下单意图检测逻辑（放在订单查询之前）：

```typescript
// 在 detectIntent 方法中，订单查询之前添加
const orderCreateResult = this.matchOrderCreate(normalizedMessage);
if (orderCreateResult) {
  return {
    intent: BusinessIntent.ORDER_CREATE,
    productName: orderCreateResult.productName,
    quantity: orderCreateResult.quantity,
    confidence: 0.9,
    needMoreInfo: false,
  };
}
```

- [ ] **Step 5: 添加 matchOrderCreate 方法**

```typescript
private matchOrderCreate(message: string): { productName: string; quantity: number } | null {
  // 检查关键词
  const hasKeyword = this.ORDER_CREATE_KEYWORDS.some(k => message.includes(k));
  if (!hasKeyword) return null;

  // 匹配数量+产品名模式
  for (const pattern of this.ORDER_CREATE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const quantity = parseInt(match[1]) || parseInt(match[2]);
      const productName = (match[2] || match[1]).trim();
      if (quantity && productName) {
        return { productName, quantity };
      }
    }
  }
  return null;
}
```

---

### Task 2: OrderService 新增 createOrderFromChat 方法

**Files:**
- Modify: `src/modules/order/order.service.ts:1-70`

- [ ] **Step 1: 添加 createOrderFromChat 方法**

在 OrderService 类中添加新方法（约第70行后）：

```typescript
/**
 * 从聊天创建订单（用于聊天下单功能）
 */
async createOrderFromChat(
  productName: string,
  quantity: number,
  storeId: string,
): Promise<OrderInfo> {
  this.logger.log(`createOrderFromChat: productName=${productName}, quantity=${quantity}, storeId=${storeId}`);

  // 生成订单号
  const orderNo = this.generateOrderNo();

  // 随机生成单价（10-500元）
  const productPrice = Math.floor(Math.random() * 490) + 10;
  const amount = productPrice * quantity;
  const discountAmount = 0;
  const actualAmount = amount;

  // 创建订单，状态设为 PAID（跳过支付）
  const order = await this.prisma.order.create({
    data: {
      orderNo,
      status: OrderStatus.PAID,  // 已支付
      payStatus: PayStatus.PAID,
      amount,
      discountAmount,
      actualAmount,
      quantity,
      productName,
      productPrice,
      createdAt: new Date(),
      paidAt: new Date(),
    },
  });

  // 自动创建物流信息
  await this.createLogistics(order.id, order.orderNo);

  return this.toOrderInfo(order);
}
```

- [ ] **Step 2: 添加 toOrderInfo 物流信息**

确保 toOrderInfo 方法返回物流信息（检查现有代码）：

```typescript
// 在 toOrderInfo 方法中添加 logistics 字段
const logistics = await this.prisma.logistics.findUnique({
  where: { orderId: order.id },
});

return {
  ...,
  logistics: logistics ? {
    carrier: logistics.carrier,
    trackingNo: logistics.trackingNo,
    status: logistics.status,
  } : null,
};
```

---

### Task 3: ChatService 处理 ORDER_CREATE 意图

**Files:**
- Modify: `src/modules/chat/chat.service.ts:70-160`

- [ ] **Step 1: 添加 handleOrderCreate 方法**

在 ChatService 中添加处理下单的方法：

```typescript
/**
 * 处理下单请求
 */
private async handleOrderCreate(
  productName: string,
  quantity: number,
  storeId: string,
): Promise<string> {
  try {
    const order = await this.orderService.createOrderFromChat(
      productName,
      quantity,
      storeId,
    );

    // 格式化响应
    const lines = [
      '订单已创建！',
      '',
      `订单号：${order.orderNo}`,
      `商品：${order.productName} x ${order.quantity}`,
      `单价：¥${order.productPrice?.toFixed(2)}`,
      `总价：¥${order.actualAmount?.toFixed(2)}`,
      `状态：${order.statusText}`,
    ];

    if (order.logistics) {
      lines.push(`快递：${order.logistics.carrier} ${order.logistics.trackingNo}`);
    }

    return lines.join('\n');
  } catch (error) {
    this.logger.error(`handleOrderCreate failed: ${error.message}`);
    return '抱歉，创建订单失败，请稍后重试。';
  }
}
```

- [ ] **Step 2: 修改 sendMessage 方法**

在 ChatService.sendMessage 方法中添加 ORDER_CREATE 处理（约第115行，在订单查询处理之前）：

```typescript
// 在 handleOrderQuery 之前添加
if (intentResult.intent === BusinessIntent.ORDER_CREATE) {
  return this.handleOrderCreate(
    intentResult.productName || '',
    intentResult.quantity || 1,
    session.storeId,
  );
}
```

---

### Task 4: 构建并测试

**Files:**
- Build: `pnpm run build`

- [ ] **Step 1: 构建后端**

```bash
cd /Users/chan/Henson/CS/mall-chat-service
pnpm run build
```

- [ ] **Step 2: 测试意图识别**

测试 IntentRouter 可以识别：
- "买2个空滤器" → ORDER_CREATE, productName=空滤器, quantity=2
- "下单购买5件SC1599" → ORDER_CREATE, productName=SC1599, quantity=5

- [ ] **Step 3: 端到端测试**

1. 启动后端：`pnpm run start:dev`
2. 启动前端：`cd frontend && pnpm run dev`
3. 发送消息"买2个空滤器"
4. 验证返回订单信息