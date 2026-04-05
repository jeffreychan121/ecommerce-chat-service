# 客服管理后台设计

## 概述

为商城聊天服务增加客服管理后台，支持客服查看转人工队列、接入会话、与客户实时聊天。

## 功能需求

- 客服后台独立页面 (`/agent`)
- 待处理转人工队列展示
- 客服接入会话
- 实时双向聊天

## 设计

### 1. 页面结构

```
/agent                    # 客服首页 - 队列列表
/agent/:sessionId        # 客服聊天界面
```

### 2. 客服首页

展示待处理的转人工队列：

| 字段 | 说明 |
|------|------|
| queueNo | 排队号 |
| userPhone | 用户手机号 |
| createdAt | 转人工时间 |
| action | 接入按钮 |

**API:**
```typescript
// GET /api/agent/queue
interface AgentQueueItem {
  ticketId: string;
  queueNo: number;
  sessionId: string;
  userPhone: string;
  createdAt: string;
}

// GET /api/agent/session/:sessionId/messages
interface ChatMessage {
  id: string;
  senderType: 'USER' | 'AI' | 'HUMAN';
  content: string;
  createdAt: string;
}

// POST /api/agent/session/:sessionId/message
interface SendAgentMessageRequest {
  content: string;
}

// POST /api/agent/session/:sessionId/accept
// 接入会话，更新工单状态为 ANSWERED

// POST /api/agent/session/:sessionId/close
// 结束会话，关闭工单
```

### 3. 客服聊天页面

- 加载会话历史消息（GET `/api/agent/session/:sessionId/messages`）
- 客服输入框发送消息（POST `/api/agent/session/:sessionId/message`）
- 实时接收客户消息（WebSocket）

**消息类型：**
- `USER` - 客户发送
- `AI` - AI 回复
- `HUMAN` - 客服发送

### 4. 数据模型扩展

```prisma
// HandoffTicket 新增字段
model HandoffTicket {
  ...
  assignedAgentId String?    // 暂不使用，演示用
  agentJoinedAt  DateTime?  // 客服接入时间
}
```

### 5. 消息流程

```
客户: "转人工" → 创建 HandoffTicket(PENDING)
                              ↓
客服首页: 显示队列 [排队号:1, 手机号:138xxx, 时间:10:30]
                              ↓
客服点击"接入" → POST /api/agent/session/:sessionId/accept
                              → 更新 ticket(ANSWERED) + agentJoinedAt
                              ↓
客服聊天页面: GET /api/agent/session/:sessionId/messages
                              ↓
客服发送: "您好，请问有什么可以帮助？"
       → POST /api/agent/session/:sessionId/message
       → 保存 ChatMessage(senderType=HUMAN)
       → WebSocket 推送给客户
```

### 6. WebSocket 事件

连接到 `ws://localhost:3000/ws/chat`

| 事件 | 方向 | 说明 |
|------|------|------|
| `handoff-queue-update` | 后端→客服 | 队列变化通知，payload: AgentQueueItem[] |
| `agent-message` | 后端→客户 | 客服消息推送，payload: { sessionId, content, senderType: 'HUMAN' } |
| `customer-message` | 后端→客服 | 客户新消息，payload: ChatMessage |

### 7. 前端页面

**客服首页 (`/agent`)**
- 轮询 GET `/api/agent/queue` 或监听 WebSocket
- 展示队列列表，点击「接入」跳转 `/agent/:sessionId`

**客服聊天页面 (`/agent/:sessionId`)**
- 加载历史消息
- 发送消息表单
- WebSocket 监听 `customer-message` 事件

## 测试用例

| 场景 | 预期 |
|------|------|
| 客户转人工 | 客服首页队列显示新条目 |
| 客服接入 | 队列移除该条目，聊天界面可交互 |
| 客服发送消息 | 客户窗口实时显示 |
| 客户发送消息 | 客服窗口实时显示 |
| 客服关闭会话 | 工单状态变为 CLOSED |

## 风险与限制

- 暂不支持多客服分流（所有队列显示给所有客服）
- 暂不支持会话转接
- 客服无需登录（演示用）
- 不支持消息已读状态