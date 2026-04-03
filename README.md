# Mall Chat Service

商城聊天服务 - 对接 Dify 知识库的智能客服系统

## 项目简介

Mall Chat Service 是一个基于 NestJS 开发的商城聊天服务，集成 Dify AI 知识库，为商城用户提供智能客服能力。支持多轮对话、会话续聊、店铺知识隔离、转人工等功能。

## 功能特性

### 核心功能
- **多轮对话**: 支持用户与 AI 的多轮交互，保持上下文连贯
- **会话续聊**: 用户重新进入时自动恢复最近会话，无需重新开始
- **知识隔离**: 按店铺隔离会话，不同店铺有独立的 Dify conversation
- **转人工**: 支持用户主动转接人工客服，创建转人工工单

### 扩展点设计
- **订单查询**: 预留订单服务扩展点，可对接真实订单系统
- **物流查询**: 预留物流服务扩展点，可对接真实物流系统

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **实时通信**: WebSocket (Socket.io)
- **AI 集成**: Dify API

## 快速开始

### 环境准备

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 配置

1. 复制环境变量示例文件

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置以下环境变量：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/mall_chat"

# Redis 连接
REDIS_HOST=localhost
REDIS_PORT=6379

# Dify 配置
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-api-key
DIFY_APP_ID=your-app-id

# 日志级别
LOG_LEVEL=info
```

### 初始化数据库

```bash
npx prisma migrate dev
```

### 启动服务

```bash
# 开发模式（热重载）
pnpm run start:dev

# 生产模式
pnpm run build
pnpm run start:prod
```

服务启动后，API 服务运行在 `http://localhost:3000`

## Dify 对接说明

### 配置

在 `.env` 中配置以下参数：

| 参数 | 说明 |
|------|------|
| `DIFY_BASE_URL` | Dify API 地址 |
| `DIFY_API_KEY` | Dify API 密钥 |
| `DIFY_APP_ID` | Dify 应用 ID |

### 工作原理

1. 用户进入商城时，系统创建或恢复会话
2. 用户发送消息时，会将消息连同店铺信息传递给 Dify
3. Dify 返回流式响应，系统实时推送给客户端
4. 每个店铺维护独立的 Dify conversation ID，实现知识隔离

### inputs 扩展

通过 `inputs` 字段可向 Dify 传递额外参数，例如：
- 用户画像信息
- 店铺商品信息
- 当前页面上下文

## 转人工说明

### 触发方式

用户可通过以下方式转接人工：
- 主动调用转人工 API
- AI 判断需要人工介入时自动触发（需在 Dify 端配置）

### API 调用

```bash
POST /api/chat/sessions/:sessionId/handoff
Content-Type: application/json

{
  "reason": "需要人工处理订单问题"
}
```

### 转人工流程

1. 用户发起转人工请求
2. 系统创建 `HandoffTicket` 工单
3. 将会话状态标记为 `HANDOFF`
4. 客服系统可通过工单 ID 获取会话信息

## 后续扩展

### 接入真实订单/物流服务

在 `src/modules/order` 和 `src/modules/logistics` 中实现具体业务逻辑：

```typescript
// src/modules/order/order.service.ts
@Injectable()
export class OrderService {
  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    // TODO: 调用真实订单 API
  }
}
```

### 添加更多消息类型

在 `schema.prisma` 的 `MessageType` 枚举中添加新类型：
- `IMAGE` - 图片消息
- `VOICE` - 语音消息
- `PRODUCT` - 商品卡片

### 客服工作台

可扩展客服工作台功能：
- 客服登录认证
- 工单列表与分配
- 实时消息回复
- 会话历史查看

### 消息已读/送达状态

扩展 WebSocket 事件，添加消息状态追踪：
- `message-read` - 消息已读
- `message-delivered` - 消息送达

## 项目结构

```
src/
├── modules/
│   ├── chat/          # 聊天模块（网关+编排）
│   ├── session/       # 会话管理
│   ├── message/       # 消息存储
│   ├── dify/          # Dify 适配层
│   ├── handoff/       # 转人工
│   ├── user/          # 用户服务
│   ├── store/         # 店铺服务
│   ├── order/         # 订单服务（扩展点）
│   └── logistics/    # 物流服务（扩展点）
├── infra/
│   ├── database/      # Prisma 服务
│   └── cache/         # Redis 缓存
└── config/            # 配置管理
```