# 客服工作台队列与历史会话实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善客服工作台，增加历史会话列表，队列显示店铺信息，修复消息同步问题

**Architecture:** 后端新增历史会话 API，前端添加历史会话 Tab 页面，双向显示店铺信息

**Tech Stack:** NestJS + Prisma + React + Socket.IO

---

## 文件结构

```
src/modules/handoff/
├── handoff.service.ts      # 修改：增强 getPendingQueue，新增 getHistory
├── handoff.controller.ts   # 修改：新增 /api/agent/history 接口

frontend/src/pages/
├── AgentDashboard.tsx      # 修改：添加 Tab 切换，历史会话列表
├── AgentChat.tsx            # 修改：显示店铺信息

src/modules/message/
├── message.service.ts       # 新增：获取最后一条消息的方法
```

---

## Task 1: 后端队列增强

**Files:**
- Modify: `src/modules/handoff/handoff.service.ts:85-130`
- Modify: `src/modules/handoff/handoff.controller.ts`

- [ ] **Step 1: 增强 handoff.service.ts 的 getPendingQueue 方法**

在 `getPendingQueue` 方法中添加店铺信息和最后消息：

```typescript
// 修改 getPendingQueue 方法（约第 85-103 行）
async getPendingQueue(): Promise<AgentQueueItem[]> {
  const tickets = await this.prisma.handoffTicket.findMany({
    where: { status: HandoffStatus.PENDING },
    orderBy: { queueNo: 'asc' },
    include: {
      session: {
        include: {
          user: true,
          store: true,  // 新增：包含店铺信息
        },
      },
    },
  });

  // 获取每个会话的最后一条消息
  const sessionIds = tickets.map(t => t.sessionId);
  const lastMessages = await this.getLastMessages(sessionIds);

  return tickets.map(t => ({
    ticketId: t.id,
    sessionId: t.sessionId,
    queueNo: t.queueNo,
    userPhone: t.session.user.phone,
    storeId: t.session.storeId,                    // 新增
    storeName: t.session.store.name,              // 新增
    storeType: t.session.store.storeType,          // 新增
    lastMessage: lastMessages[t.sessionId] || '',  // 新增
    createdAt: t.createdAt.toISOString(),
  }));
}

// 新增辅助方法：获取会话最后一条消息
private async getLastMessages(sessionIds: string[]): Promise<Record<string, string>> {
  if (sessionIds.length === 0) return {};

  const messages = await this.prisma.chatMessage.findMany({
    where: { sessionId: { in: sessionIds } },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true, content: true },
    distinct: ['sessionId'],
  });

  return messages.reduce((acc, m) => {
    acc[m.sessionId] = m.content;
    return acc;
  }, {} as Record<string, string>);
}
```

- [ ] **Step 2: 新增 getHistory 方法**

在 `handoff.service.ts` 中添加历史会话查询方法：

```typescript
// 新增方法（约第 130 行后）
async getHistory(page: number = 1, limit: number = 20) {
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
      orderBy: { agentJoinedAt: 'desc' },  // 按接入时间倒序
      skip,
      take: limit,
    }),
    this.prisma.handoffTicket.count({
      where: { status: { in: [HandoffStatus.ANSWERED, HandoffStatus.CLOSED] } },
    }),
  ]);

  // 获取最后消息
  const sessionIds = tickets.map(t => t.sessionId);
  const lastMessages = await this.getLastMessages(sessionIds);

  return {
    items: tickets.map(t => ({
      ticketId: t.id,
      sessionId: t.sessionId,
      queueNo: t.queueNo,
      userPhone: t.session.user.phone,
      storeId: t.session.storeId,
      storeName: t.session.store.name,
      storeType: t.session.store.storeType,
      lastMessage: lastMessages[t.sessionId] || '',
      createdAt: t.createdAt.toISOString(),
      agentJoinedAt: t.agentJoinedAt?.toISOString() || '',
      closedAt: t.closedAt?.toISOString() || '',
      status: t.status,
    })),
    total,
    page,
    limit,
  };
}
```

- [ ] **Step 3: 新增 history 接口**

修改 `handoff.controller.ts`：

```typescript
// 新增 import（约第 4 行）
import { PaginationDto } from './dto/handoff.dto';

// 新增接口（约第 40 行后）
@Get('history')
async getHistory(@Query() query: PaginationDto) {
  const { page = 1, limit = 20 } = query;
  return this.handoffService.getHistory(Number(page), Number(limit));
}
```

- [ ] **Step 4: 新增分页 DTO**

创建 `src/modules/handoff/dto/handoff.dto.ts`（如果不存在）：

```typescript
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/handoff/handoff.service.ts src/modules/handoff/handoff.controller.ts src/modules/handoff/dto/handoff.dto.ts
git commit -m "feat: 增强队列显示店铺信息，新增历史会话接口"
```

---

## Task 2: 前端历史会话

**Files:**
- Modify: `frontend/src/pages/AgentDashboard.tsx`
- Modify: `frontend/src/pages/AgentChat.tsx`

- [ ] **Step 1: 修改 AgentDashboard.tsx 添加 Tab**

读取当前 `AgentDashboard.tsx`，添加 Tab 切换：

```typescript
// 添加状态
const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

// 添加 history 状态
const [history, setHistory] = useState<HistoryItem[]>([]);

// 添加 fetchHistory 方法
const fetchHistory = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/agent/history?page=1&limit=50');
    const data = await res.json();
    setHistory(data.items || []);
  } catch (e) {
    console.error('Failed to fetch history:', e);
  }
};

// Tab 切换时加载数据
useEffect(() => {
  if (activeTab === 'pending') {
    fetchQueue();
  } else {
    fetchHistory();
  }
}, [activeTab]);
```

- [ ] **Step 2: 添加历史会话列表 UI**

在 AgentDashboard.tsx 中添加 Tab 内容：

```typescript
// Tab 头部
<div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
  <button
    onClick={() => setActiveTab('pending')}
    style={{
      padding: '12px 24px',
      border: 'none',
      background: activeTab === 'pending' ? '#1677ff' : 'transparent',
      color: activeTab === 'pending' ? '#fff' : '#666',
      cursor: 'pointer',
    }}
  >
    待处理 ({queue.length})
  </button>
  <button
    onClick={() => setActiveTab('history')}
    style={{
      padding: '12px 24px',
      border: 'none',
      background: activeTab === 'history' ? '#1677ff' : 'transparent',
      color: activeTab === 'history' ? '#fff' : '#666',
      cursor: 'pointer',
    }}
  >
    历史会话
  </button>
</div>

// Tab 内容
{activeTab === 'pending' ? (
  // 待处理队列内容（现有）
) : (
  // 历史会话内容
  <div>
    {history.map(item => (
      <div key={item.ticketId} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.userPhone}</span>
          <span>{item.storeName}</span>
          <span>{item.status === 'CLOSED' ? '已关闭' : '已接听'}</span>
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
          接入时间：{new Date(item.agentJoinedAt).toLocaleString('zh-CN')}
        </div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: 修改 AgentChat.tsx 显示店铺信息**

读取当前 AgentChat.tsx，在头部显示店铺信息：

```typescript
// 添加 store 状态（在现有 state 后添加）
const [storeInfo, setStoreInfo] = useState<{ name: string; type: string } | null>(null);

// 修改 useEffect 加载会话信息
useEffect(() => {
  // 加载历史消息
  fetch(`http://localhost:3000/api/agent/session/${sessionId}`)
    .then(res => res.json())
    .then(data => {
      if (data.store) {
        setStoreInfo(data.store);
      }
      setMessages(data.messages || []);
      setLoading(false);
    })
    .catch(e => {
      console.error('Failed to load session:', e);
      setLoading(false);
    });

  // WebSocket 监听...
}, [sessionId]);
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AgentDashboard.tsx frontend/src/pages/AgentChat.tsx
git commit -m "feat: 添加历史会话 Tab，显示店铺信息"
```

---

## Task 3: 消息同步验证

**Files:**
- 检查前端 WebSocket 监听

- [ ] **Step 1: 验证客服→客户消息**

测试流程：
1. 客服接入会话
2. 客服发送消息
3. 验证客户界面是否收到

检查代码：
- `src/modules/chat/chat.gateway.ts:44-47` - agent.message 事件广播
- `frontend/src/hooks/useChat.ts` - agent-message 监听

- [ ] **Step 2: 验证客户→客服消息**

测试流程：
1. 客户在转人工状态发送消息
2. 验证客服界面是否收到

检查代码：
- `src/modules/chat/chat.service.ts:100-108` - customer.message 事件
- `src/modules/chat/chat.gateway.ts:50-56` - 广播给所有客户端
- `frontend/src/pages/AgentChat.tsx:39-43` - customer-message 监听

- [ ] **Step 3: Commit**

```bash
git commit -m "fix: 验证消息同步功能"
```

---

## 验证命令

### 后端构建
```bash
cd /Users/chan/Henson/CS/mall-chat-service
pnpm run build
```

### 前端构建
```bash
cd /Users/chan/Henson/CS/mall-chat-service/frontend
pnpm run build
```

### 测试 API
```bash
# 待处理队列
curl http://localhost:3000/api/agent/queue

# 历史会话
curl http://localhost:3000/api/agent/history
```