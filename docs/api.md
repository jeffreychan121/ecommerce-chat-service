# API 接口文档

## 目录

- [REST API](#rest-api)
  - [会话管理](#会话管理)
  - [消息管理](#消息管理)
  - [转人工](#转人工)
- [WebSocket API](#websocket-api)
- [错误响应格式](#错误响应格式)

---

## REST API

### Base URL

```
http://localhost:3000/api/chat
```

### 会话管理

#### 1. 创建或恢复会话

创建新会话，或恢复同一用户的最近未关闭会话。

**端点**: `POST /sessions`

**请求体**:

```json
{
  "userId": "用户ID",
  "storeId": "店铺ID",
  "storeType": "SELF" | "MERCHANT",
  "channel": "miniprogram"
}
```

**响应示例** (201 Created):

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "storeId": "store-456",
  "storeType": "SELF",
  "channel": "miniprogram",
  "status": "OPEN",
  "isNew": true,
  "difyConversationId": null
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| sessionId | string | 会话 ID |
| userId | string | 用户 ID |
| storeId | string | 店铺 ID |
| storeType | string | 店铺类型 (SELF/MERCHANT) |
| channel | string | 渠道 (miniprogram/h5/app) |
| status | string | 会话状态 (OPEN/HANDOFF/CLOSED) |
| isNew | boolean | 是否新建会话 |
| difyConversationId | string \| null | Dify 会话 ID |

---

#### 2. 获取会话详情

**端点**: `GET /sessions/:id`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 会话 ID |

**响应示例** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "storeId": "store-456",
  "storeType": "SELF",
  "channel": "miniprogram",
  "status": "OPEN",
  "difyConversationId": "diff-conversation-abc",
  "lastActiveAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

### 消息管理

#### 3. 发送消息（同步）

**端点**: `POST /sessions/:id/messages`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 会话 ID |

**请求体**:

```json
{
  "message": "我想查询订单",
  "inputs": {
    "orderId": "ORD-12345"
  }
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息内容 |
| inputs | object | 否 | 传递给 Dify 的额外参数 |

**响应示例** (200 OK):

```json
{
  "messageId": "msg-550e8400",
  "answer": "好的，我来帮您查询订单...",
  "conversationId": "diff-conversation-abc"
}
```

---

#### 4. 发送消息（流式 SSE）

**端点**: `POST /sessions/:id/messages/stream`

**路径参数**: 同上

**请求体**: 同上

**响应**: `text/event-stream`

**数据格式**:

```javascript
// 消息片段
data: {"answer": "好的，"}
data: {"answer": "我来帮您查"}
data: {"answer": "询订单..."}

// 完成消息
data: {"done": true, "messageId": "msg-xxx", "answer": "...", "conversationId": "xxx"}

// 错误消息
data: {"error": "Error message"}
```

**示例 (curl)**:

```bash
curl -X POST http://localhost:3000/api/chat/sessions/{id}/messages/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}' \
  -N
```

---

#### 5. 获取历史消息

**端点**: `GET /sessions/:id/messages`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 会话 ID |

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | number | 50 | 返回数量 |
| offset | number | 0 | 偏移量 |

**响应示例** (200 OK):

```json
[
  {
    "id": "msg-001",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "senderType": "USER",
    "content": "你好，我想咨询一下",
    "messageType": "TEXT",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "msg-002",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "senderType": "AI",
    "content": "您好，请问有什么可以帮助您的？",
    "messageType": "TEXT",
    "createdAt": "2024-01-15T10:00:05Z"
  }
]
```

---

### 转人工

#### 6. 发起转人工请求

**端点**: `POST /sessions/:sessionId/handoff`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | string (UUID) | 会话 ID |

**请求体**:

```json
{
  "reason": "需要人工处理订单问题"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 转人工原因 |

**响应示例** (200 OK):

```json
{
  "ticketId": "ticket-550e8400",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "queueNo": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| ticketId | string | 工单 ID |
| sessionId | string | 会话 ID |
| status | string | 工单状态 (PENDING/ANSWERED/CLOSED) |
| queueNo | number | 排队号 |
| createdAt | DateTime | 创建时间 |

---

## WebSocket API

### 连接地址

```
ws://localhost:3000/ws/chat
```

### 事件列表

#### 1. join-session

客户端加入会话房间

**客户端发送**:

```javascript
socket.emit('join-session', { sessionId: 'xxx' });
```

**服务端响应**:

```javascript
// 成功
{ success: true, sessionId: 'xxx' }

// 失败
{ success: false, error: 'Session not found' }
```

---

#### 2. leave-session

客户端离开会话房间

**客户端发送**:

```javascript
socket.emit('leave-session', { sessionId: 'xxx' });
```

**服务端响应**:

```javascript
{ success: true, sessionId: 'xxx' }
```

---

#### 3. send-message

发送消息（流式响应）

**客户端发送**:

```javascript
socket.emit('send-message', {
  sessionId: 'xxx',
  message: '我想查询订单',
  inputs: { orderId: 'ORD-123' }
});
```

**服务端推送 - 消息片段**:

```javascript
socket.on('message-chunk', (data) => {
  // data: { event: 'message', answer: '好的', conversationId: 'xxx' }
});
```

**服务端推送 - 消息完成**:

```javascript
socket.on('message-complete', (data) => {
  // data: { messageId: 'msg-xxx', answer: '...', conversationId: 'xxx' }
});
```

---

### WebSocket 示例

```javascript
// JavaScript
const socket = io('http://localhost:3000/ws/chat');

// 加入会话
socket.emit('join-session', { sessionId: 'session-123' });

// 监听消息片段
socket.on('message-chunk', (data) => {
  console.log('Chunk:', data.answer);
});

// 监听消息完成
socket.on('message-complete', (data) => {
  console.log('Complete:', data);
});

// 发送消息
socket.emit('send-message', {
  sessionId: 'session-123',
  message: '你好'
});
```

---

## 错误响应格式

### HTTP 错误响应

所有 API 错误返回标准 JSON 格式：

```json
{
  "statusCode": 404,
  "message": "Session with ID xxx not found",
  "error": "Not Found"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### WebSocket 错误

```javascript
socket.on('send-message', (data) => {
  if (!data.success) {
    console.error('Error:', data.error);
  }
});
```