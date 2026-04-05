# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Mall Chat Service 是一个基于 NestJS 的商城智能客服系统，集成 Dify AI 知识库。支持多轮对话、会话续聊、店铺知识隔离、转人工等功能。

## 开发命令

### 后端 (NestJS)
```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm run start:dev

# 生产构建
pnpm run build

# 生产启动
pnpm run start:prod

# 运行测试
pnpm run test
```

### 前端 (React + Vite)
```bash
cd frontend

# 开发模式 (http://localhost:5173)
pnpm run dev

# 构建
pnpm run build
```

### 数据库
```bash
# 执行迁移
npx prisma migrate dev

# 生成 Prisma 客户端
npx prisma generate
```

### 启动项目

```bash
# 每次修改代码后，需要重建并重启后端：

# 后端：重建 + 启动 (热重载)
cd /Users/chan/Henson/CS/mall-chat-service
pnpm run build && pnpm run start:dev

# 前端：直接运行 (Vite 热重载)
cd /Users/chan/Henson/CS/mall-chat-service/frontend
pnpm run dev
```

### 修改代码后的重启流程

由于 NestJS 需要重新编译，每次修改后端代码后必须：

1. `pnpm run build` - 重建编译后的 JS
2. `pnpm run start:dev` - 启动（或重启）开发服务器

前端 Vite 有热重载，但修改后端后需要重建。

## 项目架构

### 后端模块结构
```
src/modules/
├── chat/           # 主编排 - 消息处理、意图路由
├── session/        # 会话管理 - 创建/恢复/状态
├── message/        # 消息持久化
├── dify/           # Dify API 适配器 - 流式AI响应
├── handoff/        # 转人工服务
├── user/           # 用户服务 - 手机号认证
├── store/          # 店铺服务 - storeType (SELF/MERCHANT)
├── order/          # 订单服务 - Mock数据, MallApiService适配器
├── logistics/      # 物流服务（已集成到OrderService）
└── intent-router/  # 意图检测 - 路由到 ORDER_STATUS_QUERY,
                    # LOGISTICS_QUERY 或 GENERAL_AI_QUERY
```

### 消息流程
1. 用户发送消息 → ChatService.sendMessage()
2. IntentRouter 检测业务意图（订单查询、物流查询、普通AI）
3. 如果是订单/物流查询：调用 OrderService → 格式化响应
4. 如果是普通AI：调用 DifyService → 流式AI响应
5. 保存消息到数据库 → 通过 WebSocket 推送给前端

### 前端入口
- `/` - 主页聊天界面 (LoginPage → MainPage)
- `/test-orders` - 订单测试抽屉（通过右上角"订单测试"按钮打开）

### 关键集成
- **Dify**: 每个会话存储 `difyConversationId` 实现多轮上下文
- **Prisma**: PostgreSQL 持久化数据（会话、消息、订单、物流）
- **WebSocket**: 实时消息推送

---

## 开发经验沉淀

### 1. 订单号识别与意图路由

**问题**: 用户发送纯订单号（如 "DD85326802390"）时，AI 无法识别为订单查询。

**解决方案**: 在 IntentRouter 中实现：
- 优先提取订单号 `extractOrderNo()`
- 如果存在 `extractedOrderNo` 但没有关键词，仍路由到 LOGISTICS_QUERY
- 订单号格式支持：DD/ORD 前缀 + 6-20位数字

```typescript
// intent-router.service.ts
const extractedOrderNo = this.extractOrderNo(normalizedMessage);
if (logisticsMatchScore > 0 || extractedOrderNo) {
  // 有物流关键词 OR 有订单号（可能是物流查询）
  return { intent: BusinessIntent.LOGISTICS_QUERY, ... };
}
```

### 2. 前端 Drawer 抽屉样式

**需求**: 订单测试页面改为从右侧滑出的抽屉样式。

**实现方式**: 在 App.tsx 中使用条件渲染 + CSS transform 实现滑动效果。

```typescript
// 遮罩层
{showOrderTest && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
    animation: 'fadeIn 0.3s ease',
  }} onClick={() => setShowOrderTest(false)} />
)}

 {/* 抽屉主体 */}
<div style={{
  position: 'fixed', top: 0, right: 0,
  width: '420px', height: '100vh',
  transform: showOrderTest ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  zIndex: 2001,
}}>
  {/* 内容 */}
</div>
```

### 3. 深色主题适配

**问题**: 订单中心卡片原本是白色背景，与抽屉深色背景不协调。

**解决方案**: 将所有颜色改为半透明深色系：

```typescript
const cardStyle = {
  background: 'rgba(255,255,255,0.08)',  // 半透明白
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)',  // 淡边框
};

const inputStyle = {
  background: 'rgba(0,0,0,0.3)',  // 深色输入框
  color: '#fff',  // 白色文字
};
```

### 4. React 内联样式 placeholder

**问题**: input 的 placeholder 样式无法通过 JS 变量传递。

**解决方案**: 使用 CSS 类 + 内联 `<style>` 标签：

```typescript
// 在组件最后添加
<style>{`
  .order-input::placeholder {
    color: rgba(255,255,255,0.5);
  }
`}</style>

// 在 input 上添加 className
<input className="order-input" ... />
```

### 5. 订单与物流自动创建

**实现**: 在 OrderService 中，创建订单后自动创建物流信息：

```typescript
// order.service.ts
async createOrder(params) {
  const order = await this.prisma.order.create({ ... });

  // 如果已支付，自动创建物流信息
  if (order.status === OrderStatus.PAID || order.status === OrderStatus.TO_BE_SHIPPED) {
    await this.createLogistics(order.id, order.orderNo);
  }

  return this.toOrderInfo(order);
}
```

### 6. 外部业务系统适配层

**架构设计**: 使用 Adapter 模式预留真实 API 对接点。

```
src/modules/order/
├── order.service.ts      # 业务逻辑
├── order.controller.ts  # API 入口
├── order.types.ts       # 类型定义
├── mall-api.service.ts  # 外部商城API适配层（当前返回Mock）
└── order.module.ts      # 模块定义
```

未来替换真实 API 时，只需修改 `MallApiService` 而不影响业务逻辑。

### 7. 代码组织原则

- **单一职责**: 聊天服务负责编排，订单服务负责订单，物流服务负责物流
- **先跑通再优化**: 第一版用 Mock 数据，确保链路可跑通
- **预留扩展点**: 代码结构支持后续添加售后、优惠券、商品查询等功能
- **不破坏现有功能**: 新增功能不影响已有的 Dify 多轮会话逻辑

### 8. 级联删除注意

**问题**: 删除店铺时，`HandoffTicket` 与 `ChatSession` 没有配置级联删除，导致外键约束报错。

**解决方案**: 在删除 `ChatSession` 前，先删除关联的 `HandoffTicket`：

```typescript
// store.service.ts
async deleteStore(id: string): Promise<void> {
  const sessions = await this.prisma.chatSession.findMany({
    where: { storeId: id },
    select: { id: true },
  });
  const sessionIds = sessions.map(s => s.id);
  // 先删除关联的转人工工单
  if (sessionIds.length > 0) {
    await this.prisma.handoffTicket.deleteMany({
      where: { sessionId: { in: sessionIds } },
    });
  }
  // 删除会话（Messages 会级联删除）
  await this.prisma.chatSession.deleteMany({ where: { storeId: id } });
  // 删除店铺
  await this.prisma.store.delete({ where: { id } });
}
```

### 9. Dify inputs 类型转换

**问题**: 前端发送的 `store_type` 是大写 `"SELF" | "MERCHANT"`，但 Dify 需要小写 `"self" | "merchant"`。

**解决方案**: 在前端将 `store_type` 转换为小写：

```typescript
// useChat.ts
store_type: configRef.current.storeType.toLowerCase() as 'self' | 'merchant',
```

### 10. CSS 语法错误检查

**问题**: `chat.css` 中出现重复的 CSS 代码块导致语法错误，样式不生效。

**解决**: 定期检查 CSS 文件，确保没有重复的代码块。可以用构建工具的 CSS 校验功能。

### 11. Dify API Token 区分

**问题**: Dify 有两种 Token，API Token (dataset-xxx) 用于知识库操作，App Token (app-xxx) 用于聊天消息。

**解决**: 在 DifyClient 中创建两个 axios 实例：

```typescript
// API Token client (for knowledge base operations)
this.client = axios.create({
  baseURL,
  headers: { 'Authorization': `Bearer ${apiKey}` },  // dataset-xxx
});

// App Token client (for chat messages)
this.appClient = axios.create({
  baseURL,
  headers: { 'Authorization': `Bearer ${appToken}` },  // app-xxx
});
```

### 12. 商家知识库训练功能

**功能**: 商家可上传文件(PDF/Word/Excel/MD)训练知识库

**实现**:
- 新增 TrainingJob 模型，存储文件路径和 Dify documentId
- 支持创建/删除知识库
- 支持启用/禁用文档（本地状态 + Dify API）
- 训练状态：PENDING → PROCESSING → COMPLETED/FAILED

**关键代码**:
```typescript
// 防止重复训练
if (job.status === 'COMPLETED') {
  throw new BadRequestException('文件已完成训练，请勿重复训练');
}
```

### 13. AI 消息格式化工具

**需求**: 将 AI 回复的 markdown 转换为干净的聊天文本

**实现**: 新增 `frontend/src/utils/formatMessage.ts`

**核心函数**:
- `formatAssistantMessage(text)` - 移除 markdown 残留
- `isTableFormat(text)` / `parseTable(text)` - 检测和解析表格
- `isKeyValueFormat(text)` / `parseKeyValue(text)` - 属性-值格式

**格式化处理**:
- 移除代码围栏 ``` 和行内反引号 `
- 移除加粗/斜体标记 **, __, *, _
- 移除标题 # ##
- 压缩连续空行

**前端渲染**: MessageBubble 和 MerchantTraining 组件使用 AIMessageContent 组件渲染 AI 消息

### 14. 表格格式检测

**问题**: AI 返回的表格可能是 | 格式或空格分隔格式

**解决**: 优先检查第一行是否包含 `|`

```typescript
const firstRow = lines[0];
const usePipeFormat = firstRow.includes('|');
```

### 15. Dify create-by-text API

**问题**: Dify 的 create-by-file API 有参数限制

**解决**: 使用 create-by-text API 直接上传文本内容：

```typescript
// dify.client.ts
async createDocument(datasetId: string, filePath: string) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const response = await this.client.post(
    `/datasets/${datasetId}/document/create-by-text`,
    { name: fileName, text: fileContent, indexing_technique: 'high_quality' }
  );
}
```

### 16. Prisma 数据库字段更新

**场景**: 给已有模型添加新字段（如 TrainingJob 添加 enabled 字段）

**步骤**:
1. 修改 `prisma/schema.prisma` 添加字段
2. 执行 `npx prisma generate` 生成客户端
3. 执行 `npx prisma db push` 同步到数据库（开发环境）

```prisma
// schema.prisma
model TrainingJob {
  enabled Boolean @default(true)  // 新增字段
}
```

### 17. 前端组件内联样式优先级

**问题**: 修改 React 内联样式后样式不生效

**排查**:
1. 检查 build 是否成功（无编译错误）
2. 检查热更新是否生效
3. 清除浏览器缓存或强制刷新
4. 检查样式是否被其他规则覆盖