# 系统架构文档

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端                                     │
│  (小程序 / H5 / App)                                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐            ┌─────▼─────┐
              │  REST API │            │ WebSocket │
              │ (HTTP)    │            │  (WS)     │
              └─────┬─────┘            └─────┬─────┘
                    │                         │
                    └─────────┬───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Chat Module     │
                    │   (ChatGateway    │
                    │    + ChatService)│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌────────▼────────┐  ┌────────▼────────┐
│ Session Module│   │  Message Module  │  │  Dify Module    │
│               │   │                  │  │                 │
│ - 创建会话    │   │ - 存储消息       │  │ - 调用 Dify API │
│ - 恢复会话    │   │ - 查询历史       │  │ - 流式响应      │
│ - 会话状态    │   │                  │  │ - 会话管理      │
└───────┬───────┘   └────────┬─────────┘  └────────┬────────┘
        │                    │                    │
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐  ┌────────▼────────┐
│  User Module  │   │   Store Module  │  │  Handoff Module │
│               │   │                  │  │                 │
│ - 用户信息    │   │ - 店铺信息      │  │ - 创建工单      │
│ - 手机号      │   │ - 店铺类型      │  │ - 状态管理      │
└───────────────┘   └──────────────────┘  └─────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌────────▼────────┐  ┌────────▼────────┐
│   Order       │   │   Logistics    │  │   Cache         │
│   (扩展点)    │   │   (扩展点)      │  │   (Redis)       │
└───────────────┘   └──────────────────┘  └─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL     │
                    │   (Prisma ORM)   │
                    └──────────────────┘
```

## 模块划分说明

### 1. Chat Module（聊天模块）

**职责**: 对外提供聊天服务的入口，包括 REST API 和 WebSocket 网关

**主要组件**:
- `ChatGateway`: WebSocket 网关，处理实时消息
- `ChatController`: REST API 控制器
- `ChatService`: 聊天业务编排层

**功能**:
- 会话创建/恢复
- 消息发送（同步/流式）
- WebSocket 事件处理

### 2. Session Module（会话模块）

**职责**: 管理聊天会话的生命周期

**功能**:
- 创建新会话
- 恢复已有会话（同一用户+店铺的最新未关闭会话）
- 维护会话状态（OPEN / HANDOFF / CLOSED）
- 关联 Dify conversation ID

### 3. Message Module（消息模块）

**职责**: 存储和管理聊天消息

**功能**:
- 消息持久化存储
- 历史消息分页查询
- 消息类型支持（TEXT / EVENT / CARD）

### 4. Dify Module（Dify 适配层）

**职责**: 与 Dify AI 服务对接

**主要组件**:
- `DifyClient`: Dify API HTTP 客户端
- `DifyService`: Dify 业务服务封装

**功能**:
- 流式消息发送/接收
- Conversation 管理
- inputs 参数传递

### 5. Handoff Module（转人工模块）

**职责**: 处理用户转人工请求

**功能**:
- 创建转人工工单
- 维护工单状态（PENDING / ANSWERED / CLOSED）
- 队列号生成

### 6. User Module（用户模块）

**职责**: 用户信息管理

**功能**:
- 用户创建（通过手机号）
- 用户查询

### 7. Store Module（店铺模块）

**职责**: 店铺信息管理

**功能**:
- 店铺创建
- 店铺类型（SELF / MERCHANT）管理

### 8. Order / Logistics Module（订单/物流扩展点）

**职责**: 预留的业务扩展模块

**当前状态**: 提供 Mock 实现，可后续对接真实服务

## 数据流说明

### 1. 用户发送消息流程

```
客户端 (WebSocket/REST)
    │
    ▼
ChatGateway / ChatController
    │
    ▼
ChatService.sendMessage(sessionId, message)
    │
    ├─► SessionService: 获取会话信息
    │
    ├─► DifyService: 发送消息到 Dify
    │       │
    │       ▼
    │   DifyClient (HTTP streaming)
    │       │
    │       ▼
    │   Dify API (流式响应)
    │
    ├─► onChunk 回调: 实时推送消息给客户端
    │
    └─► MessageService: 持久化消息
            │
            ▼
        PostgreSQL
```

### 2. 会话创建/恢复流程

```
客户端 (POST /api/chat/sessions)
    │
    ▼
ChatService.createOrResumeSession(dto)
    │
    ├─► UserService: 确保用户存在
    │
    ├─► StoreService: 确保店铺存在
    │
    ├─► SessionService: 查找最近未关闭会话
    │       │
    │       ├─► 有: 返回现有会话 (isNew: false)
    │       │
    │       └─► 无: 创建新会话 (isNew: true)
    │
    └─► 返回会话信息给客户端
```

### 3. 转人工流程

```
客户端 (POST /api/chat/sessions/:id/handoff)
    │
    ▼
HandoffService.createTicket(sessionId, reason)
    │
    ├─► SessionService: 更新会话状态为 HANDOFF
    │
    └─► HandoffTicket: 创建工单
            │
            ▼
        PostgreSQL
```

## 扩展点设计

### 1. 订单服务扩展

在 `src/modules/order/order.service.ts` 中实现：

```typescript
@Injectable()
export class OrderService {
  // 可扩展的方法
  async getOrderDetail(orderId: string): Promise<OrderDetail> {}

  async getUserOrders(userId: string): Promise<Order[]> {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {}
}
```

### 2. 物流服务扩展

在 `src/modules/logistics/logistics.service.ts` 中实现：

```typescript
@Injectable()
export class LogisticsService {
  // 可扩展的方法
  async getLogisticsDetail(trackingNo: string): Promise<LogisticsInfo> {}

  async getUserLogistics(userId: string): Promise<LogisticsInfo[]> {}
}
```

### 3. 消息类型扩展

在 `prisma/schema.prisma` 的 MessageType 枚举中添加新类型：

```prisma
enum MessageType {
  TEXT
  EVENT
  CARD
  IMAGE    // 新增
  VOICE    // 新增
  PRODUCT  // 新增
}
```

### 4. Dify inputs 扩展

在调用 Dify 时可传递更多上下文信息：

```typescript
const inputs = {
  userId: userId,
  storeId: storeId,
  storeType: storeType,
  channel: channel,
  // 扩展字段
  userLevel: 'VIP',
  cartItems: [...],
};
```