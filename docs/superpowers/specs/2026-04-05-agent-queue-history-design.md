# 客服工作台队列与历史会话设计

> **Goal:** 完善客服工作台，增加历史会话列表，队列显示店铺信息，修复消息同步问题

**Architecture:** 后端新增历史会话 API，前端添加历史会话 Tab 页面，双向显示店铺信息

**Tech Stack:** NestJS + Prisma + React + Socket.IO

---

## 需求

1. 待处理队列显示店铺信息
2. 新增历史会话列表，显示已接听/已关闭的工单
3. 排查并修复客户与客服消息同步问题

---

## 数据结构

### AgentQueueItem（待处理队列）

```typescript
interface AgentQueueItem {
  ticketId: string;
  sessionId: string;
  queueNo: number;
  userPhone: string;
  storeId: string;          // 新增
  storeName: string;       // 新增
  storeType: 'SELF' | 'MERCHANT';  // 新增
  lastMessage: string;      // 新增：最后一条消息预览
  createdAt: string;
}
```

### AgentHistoryItem（历史会话）

```typescript
interface AgentHistoryItem {
  ticketId: string;
  sessionId: string;
  queueNo: number;
  userPhone: string;
  storeId: string;
  storeName: string;
  storeType: 'SELF' | 'MERCHANT';
  lastMessage: string;
  createdAt: string;
  agentJoinedAt: string;    // 接入时间
  closedAt?: string;        // 关闭时间
  status: 'ANSWERED' | 'CLOSED';
}
```

---

## API 设计

### 1. 获取待处理队列（已增强）

```
GET /api/agent/queue

Response: AgentQueueItem[]
```

新增返回字段：storeId, storeName, storeType, lastMessage

### 2. 获取历史会话

```
GET /api/agent/history?page=1&limit=20

Response: {
  items: AgentHistoryItem[],
  total: number,
  page: number,
  limit: number
}
```

查询条件：status=ANSWERED 或 CLOSED，按 createdAt 倒序

### 3. 获取会话详情（含消息）

```
GET /api/agent/session/:sessionId

Response: {
  session: ChatSession,
  messages: ChatMessage[],
  store: { id, name, storeType }
}
```

---

## 数据库查询

### getPendingQueue 增强

```typescript
async getPendingQueue(): Promise<AgentQueueItem[]> {
  const tickets = await this.prisma.handoffTicket.findMany({
    where: { status: HandoffStatus.PENDING },
    include: {
      session: {
        include: {
          user: true,
          store: true,  // 新增：包含店铺信息
        },
      },
    },
  });

  return tickets.map(t => ({
    ticketId: t.id,
    sessionId: t.sessionId,
    queueNo: t.queueNo,
    userPhone: t.session.user.phone,
    storeId: t.session.storeId,
    storeName: t.session.store.name,
    storeType: t.session.store.storeType,
    lastMessage: '',  // TODO: 查询最后一条消息
    createdAt: t.createdAt.toISOString(),
  }));
}
```

### getHistory 新增

```typescript
async getHistory(page: number, limit: number): Promise<PaginatedHistory> {
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    this.prisma.handoffTicket.findMany({
      where: {
        status: { in: [HandoffStatus.ANSWERED, HandoffStatus.CLOSED] },
      },
      include: {
        session: {
          include: { user: true, store: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    this.prisma.handoffTicket.count({
      where: { status: { in: [HandoffStatus.ANSWERED, HandoffStatus.CLOSED] } },
    }),
  ]);

  return {
    items: tickets.map(t => ({
      ticketId: t.id,
      sessionId: t.sessionId,
      queueNo: t.queueNo,
      userPhone: t.session.user.phone,
      storeId: t.session.storeId,
      storeName: t.session.store.name,
      storeType: t.session.store.storeType,
      lastMessage: '',
      createdAt: t.createdAt.toISOString(),
      agentJoinedAt: t.agentJoinedAt?.toISOString() || '',
      closedAt: t.closedAt?.toISOString(),
      status: t.status,
    })),
    total,
    page,
    limit,
  };
}
```

---

## 前端设计

### AgentDashboard.tsx

```
┌─────────────────────────────────────────┐
│  客服工作台                              │
│  ┌────────────┬────────────┐           │
│  │ 待处理(3)  │ 历史会话(10)│           │
│  └────────────┴────────────┘           │
├─────────────────────────────────────────┤
│  Tab 内容区域                           │
│  - 待处理：队列列表                     │
│  - 历史：已接听/已关闭的会话列表         │
└─────────────────────────────────────────┘
```

### 列表字段

| 字段 | 待处理队列 | 历史会话 |
|------|-----------|---------|
| 排队号 | ✓ | ✓ |
| 用户手机 | ✓ | ✓ |
| 店铺名称 | ✓ (新增) | ✓ (新增) |
| 店铺类型 | ✓ (新增) | ✓ (新增) |
| 最后消息 | ✓ (新增) | ✓ (新增) |
| 转人工时间 | ✓ | ✓ |
| 接入时间 | - | ✓ |
| 关闭时间 | - | ✓ |
| 操作 | 接入 | 查看/关闭 |

---

## 消息同步排查

### 问题分析

1. 客户发送消息 → 是否正确存储？
2. 消息是否通过 WebSocket 广播？
3. 客服是否正确订阅事件？

### 检查点

- [x] ChatService 在 HANDOFF 状态下保存消息并广播 customer.message 事件
- [x] ChatGateway 监听 customer.message 并广播给所有客户端
- [x] ChatGateway 监听 agent.message 并推送给对应 sessionId 的客户端
- [x] 前端 useChat 在 isHandoff 时监听 agent-message 事件
- [ ] 前端 AgentChat 正确监听 customer-message 事件

### 已确认修复

1. useChat.ts 添加了 WebSocket 监听 agent-message 事件
2. socket.ts 添加了 onAgentMessage 方法

---

## 实现步骤

### Task 1: 后端队列增强

- [ ] 修改 getPendingQueue 返回店铺信息
- [ ] 添加 getHistory 接口
- [ ] 添加 lastMessage 字段查询

### Task 2: 前端历史会话

- [ ] AgentDashboard 添加 Tab 切换
- [ ] 历史会话列表 UI
- [ ] 分页功能

### Task 3: 消息同步验证

- [ ] 测试客户→客服消息
- [ ] 测试客服→客户消息