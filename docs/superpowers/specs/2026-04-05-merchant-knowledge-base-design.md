# 商家知识库训练功能设计

## 功能概述

为第三方商家提供一个独立入口的知识库训练页面，包含文件上传、文件管理、AI 测试三个功能区。

## 需求背景

- 第三方商家需要管理自己的产品知识库
- 不希望直接暴露 Dify 给商家
- 需要一个简单易用的管理界面

## 支持的文档格式

- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xlsx, .xls)
- Markdown (.md)

## 架构设计

```
┌─────────────────────────────────────────────────┐
│                商家门户                         │
│  /merchant/training                             │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────┐│
│  │ 文件上传    │ │ 文件管理    │ │ AI 测试   ││
│  │ - PDF      │ │ - 文件列表  │ │ - 聊天气泡││
│  │ - Word    │ │ - 删除     │ │ - 输入问题││
│  │ - Excel   │ │ - 重新训练 │ │ - 查看回复││
│  │ - MD      │ │ - 训练状态 │ │           ││
│  └─────────────┘ └─────────────┘ └───────────┘│
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│               后端服务                           │
│  Store.datasetId ← → Dify Dataset API          │
│  （创建知识库 / 上传文档 / 创建索引）            │
└─────────────────────────────────────────────────┘
```

## 数据库变更

### Store 模型

```prisma
model Store {
  id              String    @id @default(uuid())
  name            String
  storeType       StoreType
  difyDatasetId   String?   // Dify 知识库 ID（商家入驻时自动创建）
  fileStoragePath String?   // 本地文件存储目录
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessions        ChatSession[]
}
```

## 核心流程

### 1. 商家入驻（自动创建 Dify Dataset）

当新的第三方店铺（MERCHANT）创建时，后端自动调用 Dify API 创建空白知识库：

```typescript
// Dify Dataset API: POST /v1/datasets
{
  name: `Store-${storeId}`,
  description: `商家知识库`,
  indexing_technique: "high_quality",
  permission: "only_me"
}
```

返回的 `dataset.id` 存入 Store.difyDatasetId。

### 2. 文件上传

- 商家选择文件后上传到 `/api/merchant/files/upload`
- 后端保存到 `{fileStoragePath}/{storeId}/` 目录
- 返回文件信息（文件名、大小、上传时间）

### 3. 手动训练

商家点击"训练"后，后端调用 Dify API：

```typescript
// 1. 上传文档
// POST /v1/datasets/{datasetId}/document/create-by-file
{
  file_path: localFilePath,
  indexing_technique: "high_quality"
}

// 2. 创建索引（自动触发）
// Dify 会自动处理
```

### 4. AI 测试

商家输入问题测试知识库效果：

```typescript
// POST /v1/chat-messages
{
  query: userMessage,
  inputs: {
    dataset_id: store.difyDatasetId
  },
  response_mode: "streaming"
}
```

## 前端设计

### 页面路由

- `/merchant/training` - 商家知识训练页面

### 界面布局

```
┌────────────────────────────────────────────────┐
│  商家知识库训练                              │
├────────────────────────────────────────────────┤
│  [上传文件]  选择文件 (.pdf/.doc/.docx/.xlsx) │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  文件管理                                 │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │ product-guide.pdf  上传成功  [训练]  │ │ │
│  │  │ faq.docx           上传成功  [训练]  │ │ │
│  │  │ price-list.xlsx    上传成功  [训练]│ │ │
│  │  └─────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  AI 测试                                 │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │ [用户] 你们有售后吗？                │ │ │
│  │  │ [AI] 我们的保修期是12个月...         │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │ 输入问题...                    [发送]│ │ │
│  │  └─────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 交互设计

1. **文件上传**：拖拽或点击选择文件，显示上传进度条
2. **文件管理**：显示文件列表，每行有文件名、状态、操作按钮
3. **训练状态**： Pending / Processing / Completed / Failed
4. **AI 测试**：流式输出回复，带 Markdown 渲染

## 后端 API 设计

### 新增模块

```
src/modules/merchant/
├── merchant.module.ts
├── merchant.service.ts      # 核心逻辑
├── merchant.controller.ts # API 入口
├── dto/
│   ├── upload-file.dto.ts
│   └── train-document.dto.ts
└── interfaces/
    └── merchant.types.ts
```

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/merchant/files/upload | 上传文件 |
| GET | /api/merchant/files | 获取文件列表 |
| DELETE | /api/merchant/files/:id | 删除文件 |
| POST | /api/merchant/files/:id/train | 训练单个文件 |
| POST | /api/merchant/files/train-all | 训练所有文件 |
| POST | /api/merchant/chat | AI 测试聊天 |
| GET | /api/merchant/training | 获取训练状态 |

## 安全设计

1. **商家身份验证**：通过 token 或 session 验证商家身份
2. **数据隔离**：每个商家只能访问自己的文件���知识库
3. **Dify API 隐藏**：商家不直接接触 Dify，所有操作通过后端代理
4. **文件存储隔离**：文件保存到以 storeId 命名的独立目录

## 待定事项

1. **文件大小限制**：10MB
2. **训练超时时间**：5 分钟
3. **训练历史记录**：需要记录每次训练的时间、状态、成功/失败

---

## 补充设计：训练历史记录

### 数据库表

```prisma
model TrainingJob {
  id            String    @id @default(uuid())
  storeId       String
  fileId        String
  fileName      String
  status        TrainingStatus
  errorMessage  String?   // 失败时记录错误信息
  createdAt     DateTime  @default(now())
  completedAt  DateTime?   // 完成时间
}

enum TrainingStatus {
  PENDING     // 待处理
  PROCESSING  // 训练中
  COMPLETED  // 已完成
  FAILED     // 失败
}
```