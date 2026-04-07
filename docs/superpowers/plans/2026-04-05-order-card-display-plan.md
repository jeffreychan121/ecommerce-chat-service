# 订单卡片与消息展示优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现两个功能：1) 卡片下单后订单列表实时刷新 2) 聊天消息正确渲染商品卡片（非 JSON 原文）

**Architecture:**
- 订单实时通知：后端创建订单后通过 Socket 广播事件，前端监听并刷新
- 消息卡片解析：后端保存 AI 消息时提取 JSON 到 card 字段，前端直接渲染
- 数据库新增 card 字段存储商品卡片数据

**Tech Stack:** NestJS, Prisma, Socket.io, React

---

## 文件结构

```
prisma/schema.prisma              # 新增 card 字段
src/modules/order/order.service.ts  # emit order-created 事件
src/modules/chat/chat.gateway.ts    # 广播事件
src/modules/chat/chat.service.ts    # 保存消息时解析 JSON
src/modules/message/message.service.ts  # 保存消息
src/modules/chat/dto/chat.dto.ts     # API 返回类型
frontend/src/hooks/useChat.ts        # 监听订单事件
frontend/src/components/OrderTest.tsx  # 监听订单事件刷新列表
frontend/src/components/MessageBubble.tsx  # 已有 ProductCard 渲染
```

---

### Task 1: 数据库添加 card 字段

**Files:**
- Modify: `prisma/schema.prisma:65-74`
- Test: 无需测试，数据迁移

- [ ] **Step 1: 修改 schema.prisma 添加 card 字段**

```prisma
model ChatMessage {
  id          String      @id @default(uuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  senderType  SenderType
  content     String
  messageType MessageType @default(TEXT)
  card        Json?       // 新增：商品卡片数据 {"type":"product","items":[...]}
  rawPayload  Json?       // Dify 原始响应
  createdAt   DateTime   @default(now())
}
```

- [ ] **Step 2: 执行数据库迁移**

Run: `npx prisma db push`
Expected: 表结构更新，新增 card 字段

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add card field to ChatMessage for product display"
```

---

### Task 2: 订单创建后 Socket 广播

**Files:**
- Modify: `src/modules/order/order.service.ts`
- Test: `curl` 测试

- [ ] **Step 1: 修改 OrderService，注入 EventEmitter**

```typescript
// src/modules/order/order.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

constructor(
  private readonly prisma: PrismaService,
  private eventEmitter: EventEmitter2,
) {}

async createOrder(params: {...}) {
  // ... 现有创建订单逻辑 ...

  // 创建订单后广播事件
  this.eventEmitter.emit('order.created', {
    phone: params.phone,
    orderNo: order.orderNo,
    amount: order.actualAmount,
  });

  return await this.toOrderInfo(order);
}
```

- [ ] **Step 2: 修改 ChatGateway 监听并广播**

```typescript
// src/modules/chat/chat.gateway.ts
constructor(
  private eventEmitter: EventEmitter2,
) {
  // 监听订单创建事件并广播给客户端
  this.eventEmitter.on('order.created', (data: any) => {
    this.logger.log(`Broadcasting order-created: ${JSON.stringify(data)}`);
    // 广播给所有连接的客户端
    this.server.emit('order-created', data);
  });
}
```

- [ ] **Step 3: 测试**

Run: `curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"phone":"13800138000","items":[{"skuId":"test","quantity":1}],"shippingAddress":"","receiverName":"test","receiverPhone":"13800138000"}'`
Expected: 返回订单创建成功，前端应收到 'order-created' 事件

- [ ] **Step 4: Commit**

```bash
git add src/modules/order/order.service.ts src/modules/chat/chat.gateway.ts
git commit -m "feat: add socket broadcast for order creation"
```

---

### Task 3: 前端监听订单事件刷新列表

**Files:**
- Modify: `frontend/src/hooks/useChat.ts`
- Modify: `frontend/src/components/OrderTest.tsx`
- Test: 手动测试

- [ ] **Step 1: 修改 useChat.ts 添加 onOrderCreated 回调**

```typescript
// frontend/src/hooks/useChat.ts
interface UseChatOptions {
  initialConfig: CreateSessionRequest;
  onHandoff?: (queueNo: number) => void;
  onOrderCreated?: (order: any) => void;  // 新增
}

// 在 Socket 连接后添加监听
socketRef.current?.on('order-created', (data: any) => {
  console.log('[useChat] 收到订单创建事件:', data);
  if (optionsRef.current.onOrderCreated) {
    optionsRef.current.onOrderCreated(data);
  }
});
```

- [ ] **Step 2: 修改 OrderTest.tsx 传递 onOrderCreated**

```typescript
// frontend/src/components/OrderTest.tsx
const { onOrderCreated } = props;

// 监听订单创建事件
useEffect(() => {
  if (!socket.current) return;

  socket.current.on('order-created', (data) => {
    console.log('订单创建:', data);
    setRefreshKey(prev => prev + 1);  // 触发订单列表刷新
  });

  return () => {
    socket.current?.off('order-created');
  };
}, []);
```

- [ ] **Step 3: 测试**

Run: 前端点击下单按钮，验证订单列表自动刷新

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useChat.ts frontend/src/components/OrderTest.tsx
git commit -m "feat: add socket listener for order creation refresh"
```

---

### Task 4: 后端保存消息时解析 JSON 为 card 字段

**Files:**
- Modify: `src/modules/chat/chat.service.ts`
- Test: `curl` 测试

- [ ] **Step 1: 添加解析函数**

```typescript
// src/modules/chat/chat.service.ts

/**
 * 解析消息内容，提取商品卡片 JSON
 * 返回: { content: 纯文本, card: card对象 }
 */
private parseProductCard(content: string): { content: string; card: any | null } {
  // 检测是否包含商品 JSON（格式如 {"type":"products", "items":[...]}）
  const jsonMatch = content.match(/\{[\s\S]*"type"\s*:\s*"products"[\s\S]*\}/);

  if (!jsonMatch) {
    return { content, card: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.type === 'products' && parsed.items && parsed.items.length > 0) {
      // 从内容中移除 JSON 部分
      const pureContent = content.replace(jsonMatch[0], '').trim();

      // 转换格式以匹配前端
      const card = {
        type: 'product',
        products: parsed.items,
      };

      return { content: pureContent, card };
    }
  } catch (e) {
    this.logger.warn(`Failed to parse product card JSON: ${e}`);
  }

  return { content, card: null };
}
```

- [ ] **Step 2: 修改保存 AI 消息的逻辑**

```typescript
// src/modules/chat/chat.service.ts
// 在 handleAIQuery 或相关方法中

const { content: aiContent } = dto.message;  // Dify 返回的完整内容

// 解析商品卡片
const { content: pureContent, card } = this.parseProductCard(aiContent);

// 保存 AI 消息（包含 card 字段）
const aiMessage = await this.messageService.create({
  sessionId,
  senderType: SenderType.AI,
  content: pureContent,  // 纯文本（不含 JSON）
  messageType: MessageType.TEXT,
  card,                   // 商品卡片数据
});
```

- [ ] **Step 3: 修改 API 返回类型**

```typescript
// src/modules/chat/dto/chat.dto.ts
export class MessageResponseDto {
  id: string;
  sessionId: string;
  senderType: string;
  content: string;
  messageType: string;
  card?: any;  // 新增
  createdAt: Date;
}

// 在 chat.service.ts 的 getMessages 方法返回 card
return messages.map((msg) => ({
  id: msg.id,
  sessionId: msg.sessionId,
  senderType: msg.senderType,
  content: msg.content,
  messageType: msg.messageType,
  card: msg.card,  // 新增
  createdAt: msg.createdAt,
}));
```

- [ ] **Step 4: 测试**

Run:
```bash
# 1. 发送商品推荐消息
curl -X POST http://localhost:3000/api/chat/sessions/{sessionId}/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"推荐一些电子产品"}'

# 2. 获取历史消息
curl http://localhost:3000/api/chat/sessions/{sessionId}/messages
```

Expected: 返回的消息中包含 card 字段，前端渲染为卡片

- [ ] **Step 5: Commit**

```bash
git add src/modules/chat/chat.service.ts src/modules/chat/dto/chat.dto.ts
git commit -m "feat: parse product card JSON when saving AI messages"
```

---

### Task 5: 前端渲染卡片（验证现有代码）

**Files:**
- Verify: `frontend/src/components/MessageBubble.tsx`
- Verify: `frontend/src/components/MessageList.tsx`
- Test: 手动测试

- [ ] **Step 1: 确认 MessageBubble 渲染 card 字段**

检查 MessageBubble.tsx 中 renderCard 函数是否正确渲染 ProductCard：

```typescript
// frontend/src/components/MessageBubble.tsx
const renderCard = () => {
  if (!card) return null;

  if (card.type === 'product' && card.products) {
    return (
      <ProductCard products={card.products} userPhone={userPhone} />
    );
  }
  // ...
};
```

- [ ] **Step 2: 确认 MessageList 传递 card 数据**

检查 MessageList 是否将 card 传递给 MessageBubble：

```typescript
// frontend/src/components/MessageList.tsx
<MessageBubble message={msg} userPhone={userPhone} />
```

- [ ] **Step 3: 确认前端能正确映射数据库 card 字段**

前端已有解析逻辑在 useChat.ts，但数据库返回的 card 字段需要正确映射：

```typescript
// frontend/src/hooks/useChat.ts 中历史消息映射
const historicalMessages: ChatMessage[] = historyMsgs.map((msg: any) => ({
  type: msg.messageType === 'TEXT' ? 'text' : msg.messageType,
  content: msg.content,
  position: msg.senderType === 'USER' ? 'right' : 'left',
  timestamp: new Date(msg.createdAt).getTime(),
  card: msg.card,  // 直接传递
}));
```

- [ ] **Step 4: 测试**

1. 发送商品推荐消息
2. 刷新页面，验证历史消息显示为卡片
3. 验证客服后台历史消息也显示为卡片

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: verify ProductCard rendering for historical messages"
```

---

## 验证步骤

所有任务完成后：

1. **订单实时刷新测试**
   - 在聊天窗口点击"立即下单"
   - 观察订单列表是否立即显示新订单

2. **消息卡片渲染测试**
   - 发送"推荐一些电子产品"
   - 刷新页面，验证消息显示为卡片（非 JSON）
   - 打开客服后台，验证历史消息也显示为卡片

---

## 预期效果

- ✅ 用户点击下单 → 订单列表立即刷新
- ✅ 刷新页面后商品推荐显示为卡片
- ✅ 客服后台历史消息显示为卡片