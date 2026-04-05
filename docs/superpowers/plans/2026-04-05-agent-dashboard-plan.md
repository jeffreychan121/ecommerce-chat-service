# 客服管理后台实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现客服管理后台，支持查看转人工队列、接入会话、与客户实时聊天

**Architecture:** 后端新增 Agent 模块提供客服 API，前端新增客服页面，通过 WebSocket 实现实时通信

**Tech Stack:** NestJS, React, TypeScript, Prisma, Socket.IO

---

### Task 0: 数据库 Schema 更新

**Files:**
- Modify: `prisma/schema.prisma:88-97`

- [ ] **Step 1: 添加 agentJoinedAt 字段**

```prisma
// prisma/schema.prisma 第 88-97 行
// 转人工工单
model HandoffTicket {
  id              String        @id @default(uuid())
  sessionId       String
  session         ChatSession   @relation(fields: [sessionId], references: [id])
  status          HandoffStatus @default(PENDING)
  queueNo         Int           // 排队号
  assignedAgentId String?       // 分配的客服ID
  agentJoinedAt   DateTime?     // 客服接入时间（新增）
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

- [ ] **Step 2: 同步数据库**

```bash
cd /Users/chan/Henson/CS/mall-chat-service
npx prisma db push
```

---

### Task 1: 后端 - HandoffService 新增方法

**Files:**
- Modify: `src/modules/handoff/handoff.service.ts:1-70`

- [ ] **Step 1: 添加 getPendingQueue 方法**

```typescript
// src/modules/handoff/handoff.service.ts 第 65 行后添加
async getPendingQueue(): Promise<AgentQueueItem[]> {
  const tickets = await this.prisma.handoffTicket.findMany({
    where: { status: HandoffStatus.PENDING },
    orderBy: { queueNo: 'asc' },
    include: {
      session: {
        include: { user: true },
      },
    },
  });

  return tickets.map(t => ({
    ticketId: t.id,
    queueNo: t.queueNo,
    sessionId: t.sessionId,
    userPhone: t.session.user.phone,
    createdAt: t.createdAt.toISOString(),
  }));
}
```

- [ ] **Step 2: 添加 acceptSession 方法**

```typescript
// 添加到 handoff.service.ts
async acceptSession(sessionId: string) {
  const ticket = await this.prisma.handoffTicket.findFirst({
    where: { sessionId, status: HandoffStatus.PENDING },
  });

  if (!ticket) {
    throw new NotFoundException('会话不存在或已处理');
  }

  await this.prisma.handoffTicket.update({
    where: { id: ticket.id },
    data: {
      status: HandoffStatus.ANSWERED,
      agentJoinedAt: new Date(),
    },
  });

  return { success: true, ticketId: ticket.id };
}
```

- [ ] **Step 3: 添加 closeSession 方法**

```typescript
// 添加到 handoff.service.ts
async closeSession(sessionId: string) {
  const ticket = await this.prisma.handoffTicket.findFirst({
    where: { sessionId, status: HandoffStatus.ANSWERED },
  });

  if (ticket) {
    await this.prisma.handoffTicket.update({
      where: { id: ticket.id },
      data: { status: HandoffStatus.CLOSED },
    });
  }

  await this.prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.CLOSED },
  });

  return { success: true };
}
```

- [ ] **Step 4: 添加 sendAgentMessage 方法**

```typescript
// 添加到 handoff.service.ts
async sendAgentMessage(sessionId: string, content: string) {
  const message = await this.prisma.chatMessage.create({
    data: {
      sessionId,
      senderType: SenderType.HUMAN,
      content,
      messageType: MessageType.TEXT,
    },
  });

  return {
    id: message.id,
    senderType: message.senderType,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
```

- [ ] **Step 5: 添加 getSessionMessages 方法**

```typescript
// 添加到 handoff.service.ts
async getSessionMessages(sessionId: string) {
  const messages = await this.prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map(m => ({
    id: m.id,
    senderType: m.senderType,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
}
```

- [ ] **Step 6: 添加类型定义**

在 `src/modules/handoff/dto/handoff.dto.ts` 或新建 `agent.dto.ts`:

```typescript
// src/modules/handoff/dto/agent.dto.ts (新建)
export interface AgentQueueItem {
  ticketId: string;
  queueNo: number;
  sessionId: string;
  userPhone: string;
  createdAt: string;
}

export class AcceptSessionDto {}
export class CloseSessionDto {}
export class SendMessageDto {
  content: string;
}
```

---

### Task 2: 后端 - HandoffController 新增路由

**Files:**
- Modify: `src/modules/handoff/handoff.controller.ts:1-30`

- [ ] **Step 1: 添加 AgentController 路由**

```typescript
// src/modules/handoff/handoff.controller.ts 文件末尾添加
@Controller('api/agent')
export class AgentController {
  constructor(private handoffService: HandoffService) {}

  // GET /api/agent/queue - 获取待处理队列
  @Get('queue')
  async getQueue() {
    return this.handoffService.getPendingQueue();
  }

  // GET /api/agent/session/:sessionId/messages - 获取会话消息
  @Get('session/:sessionId/messages')
  async getSessionMessages(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.getSessionMessages(sessionId);
  }

  // POST /api/agent/session/:sessionId/accept - 接入会话
  @Post('session/:sessionId/accept')
  async acceptSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.acceptSession(sessionId);
  }

  // POST /api/agent/session/:sessionId/close - 关闭会话
  @Post('session/:sessionId/close')
  async closeSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.handoffService.closeSession(sessionId);
  }

  // POST /api/agent/session/:sessionId/message - 发送消息
  @Post('session/:sessionId/message')
  async sendMessage(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: { content: string },
  ) {
    return this.handoffService.sendAgentMessage(sessionId, dto.content);
  }
}
```

- [ ] **Step 2: 更新 HandoffModule 注册新 Controller**

```typescript
// src/modules/handoff/handoff.module.ts
@Module({
  controllers: [HandoffController, AgentController],  // 添加 AgentController
  ...
})
export class HandoffModule {}
```

---

### Task 3: 后端 - ChatGateway WebSocket 事件

**Files:**
- Modify: `src/modules/chat/chat.gateway.ts:1-140`

- [ ] **Step 1: 添加队列广播方法**

```typescript
// chat.gateway.ts 构造函数后添加
/**
 * 广播转人工队列更新
 */
broadcastQueueUpdate() {
  this.handoffService.getPendingQueue().then(queue => {
    this.server.emit('handoff-queue-update', queue);
  });
}

/**
 * 发送客服消息给客户
 */
sendToCustomer(sessionId: string, message: any) {
  // 找到该 session 的客户端并发送
  this.server.to(sessionId).emit('agent-message', message);
}

/**
 * 发送客户消息给客服
 */
sendToAgent(sessionId: string, message: any) {
  this.server.emit('customer-message', {
    sessionId,
    ...message,
  });
}
```

- [ ] **Step 2: 在 HandoffService 发送消息后触发广播**

在 `handoff.service.ts` 的 `sendAgentMessage` 方法中，发送后广播给客户：

```typescript
// 在 sendAgentMessage 方法返回前添加
// 需要注入 EventEmitter2 或直接在 service 中调用
```

---

### Task 4: 前端 - 客服首页

**Files:**
- Create: `frontend/src/pages/AgentDashboard.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 AgentDashboard 页面并添加到 App.tsx**

由于前端使用条件渲染而非路由，客服页面需要作为条件组件添加：

```typescript
// frontend/src/App.tsx 添加
import AgentDashboard from './pages/AgentDashboard';
import AgentChat from './pages/AgentChat';

// 在 App 组件中添加 state
const [showAgentDashboard, setShowAgentDashboard] = useState(false);
const [agentSessionId, setAgentSessionId] = useState<string | null>(null);

// 添加条件渲染（在 MerchantTraining 之后）
{showAgentDashboard && !agentSessionId && (
  <AgentDashboard
    onSelectSession={(sessionId) => {
      setAgentSessionId(sessionId);
    }}
    onBack={() => setShowAgentDashboard(false)}
  />
)}

{showAgentDashboard && agentSessionId && (
  <AgentChat
    sessionId={agentSessionId}
    onBack={() => setAgentSessionId(null)}
  />
)}
```

更新 AgentDashboard 组件接收 onSelectSession 和 onBack props：

```typescript
// frontend/src/pages/AgentDashboard.tsx
interface Props {
  onSelectSession: (sessionId: string) => void;
  onBack: () => void;
}

const AgentDashboard: React.FC<Props> = ({ onSelectSession, onBack }) => {
  // ... 使用 onSelectSession 替代 navigate
  const handleAccept = async (sessionId: string) => {
    await fetch(`http://localhost:3000/api/agent/session/${sessionId}/accept`, { method: 'POST' });
    onSelectSession(sessionId);
  };
  // ...
};
```

更新 AgentChat 组件接收 onBack prop：

```typescript
// frontend/src/pages/AgentChat.tsx
interface Props {
  sessionId: string;
  onBack: () => void;
}

const AgentChat: React.FC<Props> = ({ sessionId, onBack }) => {
  // ... 使用 onBack 替代 navigate
  const handleClose = async () => {
    await fetch(`http://localhost:3000/api/agent/session/${sessionId}/close`, { method: 'POST' });
    onBack();
  };
  // ...
};
```

---

### Task 5: 前端 - 客服聊天页面

**Files:**
- Create: `frontend/src/pages/AgentChat.tsx`

- [ ] **Step 1: 创建 AgentChat 页面**

```typescript
// frontend/src/pages/AgentChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'USER' | 'AI' | 'HUMAN';
  content: string;
  createdAt: string;
}

const AgentChat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 加载历史消息
    fetch(`http://localhost:3000/api/agent/session/${sessionId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));

    // WebSocket 监听客户新消息
    socketRef.current = io('http://localhost:3000', { path: '/ws/chat' });
    socketRef.current.on('customer-message', (msg: Message) => {
      if (msg.sessionId === sessionId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => { socketRef.current?.disconnect(); };
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const res = await fetch(`http://localhost:3000/api/agent/session/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    });
    const msg = await res.json();
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const handleClose = async () => {
    await fetch(`http://localhost:3000/api/agent/session/${sessionId}/close`, { method: 'POST' });
    navigate('/agent');
  };

  const getSenderLabel = (type: string) => {
    if (type === 'USER') return '客户';
    if (type === 'AI') return 'AI';
    if (type === 'HUMAN') return '我';
    return type;
  };

  const getSenderStyle = (type: string): React.CSSProperties => {
    if (type === 'USER') return { background: '#e6f7ff', alignSelf: 'flex-end' };
    if (type === 'HUMAN') return { background: '#f6ffed', alignSelf: 'flex-start' };
    return { background: '#fafafa', alignSelf: 'center' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>会话详情</h2>
        <button onClick={handleClose} style={{ padding: '8px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          结束会话
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', marginBottom: '20px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{
              ...getSenderStyle(msg.senderType),
              padding: '12px',
              borderRadius: '8px',
              maxWidth: '70%',
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                {getSenderLabel(msg.senderType)}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="输入回复内容..."
          style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button onClick={handleSend} style={{ padding: '12px 24px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          发送
        </button>
      </div>
    </div>
  );
};

export default AgentChat;
```

- [ ] **Step 2: 添加路由**

```typescript
// frontend/src/App.tsx
import AgentChat from './pages/AgentChat';

<Route path="/agent/:sessionId" element={<AgentChat />} />
```

---

### Task 6: 构建并测试

**Files:**
- Build: `pnpm run build`

- [ ] **Step 1: 构建后端**

```bash
cd /Users/chan/Henson/CS/mall-chat-service
pnpm run build
```

- [ ] **Step 2: 构建前端**

```bash
cd /Users/chan/Henson/CS/mall-chat-service/frontend
pnpm run build
```

- [ ] **Step 3: 测试流程**

1. 启动后端: `pnpm run start:dev`
2. 启动前端: `cd frontend && pnpm run dev`
3. 客户在聊天窗口发送"转人工"
4. 打开 http://localhost:5173/agent 查看队列
5. 点击"接入"进入聊天页面
6. 双方发送消息测试实时通信