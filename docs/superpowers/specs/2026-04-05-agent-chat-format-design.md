# 客服聊天窗口消息格式化设计

**日期**: 2026-04-05

## 背景

客户聊天窗口 (`MessageBubble`) 使用 `AIMessageContent` 组件格式化 AI 消息，支持：
- 移除 markdown 残留（代码围栏、加粗、斜体、标题等）
- 表格渲染（| 分隔和空格分隔）
- 属性-值格式渲染
- 商品卡片显示

客服聊天窗口 (`AgentChat`) 目前直接渲染原始文本，没有格式化处理，导致 AI 返回的 markdown 表格等格式显示混乱。

## 目标

统一两个聊天窗口的消息渲染方式，让客服看到和客户一致的格式化消息。

## 方案

### 采用方案 A: 复用 MessageBubble 组件

在 `AgentChat.tsx` 中引入并使用现有的 `MessageBubble` 组件。

## 设计要点

### 1. 修改消息渲染

将当前内联的消息渲染 JSX：
```tsx
<div style={{ lineHeight: '1.6', color: '#fff' }}>{msg.content}</div>
```

替换为使用 `MessageBubble` 组件：
```tsx
<MessageBubble
  message={{
    ...msg,
    position: msg.senderType === 'USER' ? 'right' : 'left',
  }}
  userPhone={userPhone}
/>
```

### 2. MessageBubble 适配

`MessageBubble` 的 props:
- `message: ChatMsg` - 包含 id, content, senderType, position, timestamp, card, imageUrl
- `userPhone?: string` - 可选

当前 `AgentChat` 的消息格式：
```tsx
interface Message {
  id: string;
  senderType: 'USER' | 'AI' | 'HUMAN';
  content: string;
  createdAt: string;
}
```

需要转换为 `ChatMsg` 格式：
- `position`: 'right' for USER, 'left' for others
- `timestamp`: createdAt 转 number
- `card`: 默认 undefined

### 3. 需要import的类型

```tsx
import { MessageBubble } from '../components/MessageBubble';
```

## 实现步骤

1. 在 `AgentChat.tsx` 中导入 `MessageBubble` 组件
2. 修改消息列表渲染部分，使用 `MessageBubble` 替代内联 JSX
3. 确保 senderType → position 映射正确

## 不包含

- 商品卡片显示（按需求不需要）
- 其他复杂功能

## 文件变更

- `frontend/src/pages/AgentChat.tsx` - 引入 MessageBubble，修改消息渲染逻辑