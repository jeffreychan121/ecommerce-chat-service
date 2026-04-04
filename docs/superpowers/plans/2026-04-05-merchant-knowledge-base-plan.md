# 商家知识库训练功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为第三方商家提供独立入口的知识库训练页面，包含文件上传、文件管理、AI测试功能。

**Architecture:**
- 后端：新增 MerchantModule，处理文件上传、训练任务、Dify API 调用
- 前端：新增 `/merchant/training` 路由页面，包含三个 Tab（上传、管理、测试）
- 数据库：Store 表增加 difyDatasetId 字段，新增 TrainingJob 表

**Tech Stack:** NestJS + Prisma + React + Dify Dataset API

---

## 文件结构

### 后端新增
```
src/modules/merchant/
├── merchant.module.ts
├── merchant.service.ts       # 核心逻辑
├── merchant.controller.ts # API 入口
└── dto/
    └── index.ts        # DTO 定义
```

### 数据库变更
```
prisma/schema.prisma    # Store 增加字段，新增 TrainingJob 模型
```

### 前端新增
```
frontend/src/components/MerchantTraining.tsx  # 商家知识训练页面
frontend/src/services/api.ts               # 新增 API 接口
frontend/src/App.tsx                    # 新增路由
```

---

## 实现任务

### Task 1: 数据库变更

**Files:**
- Modify: `prisma/schema.prisma:19-32` (Store 模型)
- Create: 新增 TrainingJob 模型

- [ ] **Step 1: 添加 Store 字段**

```prisma
// prisma/schema.prisma 第 20-27 行
model Store {
  id              String    @id @default(uuid())
  name            String
  storeType       StoreType
  difyDatasetId   String?   // Dify 知识库 ID
  fileStoragePath String?   // 本地文件存储目录
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessions        ChatSession[]
  trainingJobs   TrainingJob[]
}
```

- [ ] **Step 2: 新增 TrainingJob 模型**

```prisma
// prisma/schema.prisma
model TrainingJob {
  id           String        @id @default(uuid())
  storeId      String
  store        Store         @relation(fields: [storeId], references: [id])
  fileName     String
  filePath     String        // 本地文件路径
  status       TrainingStatus @default(PENDING)
  errorMessage String?
  createdAt    DateTime      @default(now())
  completedAt  DateTime?
}

enum TrainingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

- [ ] **Step 3: 执行迁移**

Run: `npx prisma migrate dev --name add_merchant_knowledge_base`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: 添加商家知识库数据库结构"
```

---

### Task 2: 后端 - Dify Dataset API 集成

**Files:**
- Modify: `src/modules/dify/dify.client.ts` (增加 Dataset API 方法)
- Create: `src/modules/merchant/merchant.module.ts`
- Create: `src/modules/merchant/merchant.service.ts`

- [ ] **Step 1: 在 DifyClient 中增加 Dataset API 方法**

在 `src/modules/dify/dify.client.ts` 添加以下方法：

```typescript
// 创建知识库
async createDataset(name: string, description?: string): Promise<{ id: string }> {
  const response = await this.client.post('/v1/datasets', {
    name,
    description: description || '',
    indexing_technique: 'high_quality',
    permission: 'only_me',
  });
  return response.data;
}

// 上传文档到知识库
async createDocument(datasetId: string, filePath: string): Promise<{ document: { id: string } }> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('indexing_technique', 'high_quality');

  const response = await this.client.post(
    `/v1/datasets/${datasetId}/document/create-by-file`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

// 获取文档列表
async getDocuments(datasetId: string): Promise<{ documents: any[] }> {
  const response = await this.client.get(`/v1/datasets/${datasetId}/documents`);
  return response.data;
}

// 删除文档
async deleteDocument(datasetId: string, documentId: string): Promise<void> {
  await this.client.delete(`/v1/datasets/${datasetId}/documents/${documentId}`);
}
```

- [ ] **Step 2: 创建 MerchantModule**

```typescript
// src/modules/merchant/merchant.module.ts
import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { StoreModule } from '../store/store.module';
import { DifyModule } from '../dify/dify.module';

@Module({
  imports: [StoreModule, DifyModule],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
```

- [ ] **Step 3: 创建 MerchantService 核心逻辑**

```typescript
// src/modules/merchant/merchant.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { DifyService } from '../dify/dify.service';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly storeService: StoreService,
    private readonly difyService: DifyService,
    private readonly prisma: PrismaService,
  ) {}

  // 自动创建知识库（店铺入驻时调用）
  async createDatasetForStore(storeId: string, storeName: string): Promise<string> {
    const dataset = await this.difyService.createDataset(
      `Store-${storeName}`,
      `商家知识库 - ${storeName}`
    );
    await this.storeService.update(storeId, { difyDatasetId: dataset.id });
    return dataset.id;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/dify/dify.client.ts src/modules/merchant/
git commit -m "feat: 添加 Dify Dataset API 集成"
```

---

### Task 3: 后端 - 文件上传与训练 API

**Files:**
- Create: `src/modules/merchant/dto/merchant.dto.ts`
- Create: `src/modules/merchant/merchant.controller.ts`

- [ ] **Step 1: 创建 DTO 定义**

```typescript
// src/modules/merchant/dto/merchant.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadFileDto {
  @IsString()
  fileName: string;
}

export class TrainDocumentDto {
  @IsString()
  jobId: string;
}

export class ChatDto {
  @IsString()
  query: string;
}
```

- [ ] **Step 2: 创建 MerchantController API**

```typescript
// src/modules/merchant/merchant.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { MerchantService } from './merchant.service';

@Controller('api/merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  // 上传文件
  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('storeId') storeId: string,
  ) {
    return this.merchantService.uploadFile(storeId, file);
  }

  // 获取文件列表
  @Get('files/:storeId')
  async getFiles(@Param('storeId') storeId: string) {
    return this.merchantService.getFiles(storeId);
  }

  // 删除文件
  @Delete('files/:jobId')
  async deleteFile(@Param('jobId') jobId: string) {
    return this.merchantService.deleteFile(jobId);
  }

  // 训练文件
  @Post('files/:jobId/train')
  async trainFile(@Param('jobId') jobId: string) {
    return this.merchantService.trainFile(jobId);
  }

  // 训练所有文件
  @Post('files/:storeId/train-all')
  async trainAllFiles(@Param('storeId') storeId: string) {
    return this.merchantService.trainAllFiles(storeId);
  }

  // AI 测试聊天
  @Post('chat')
  async chat(@Body() dto: { storeId: string; query: string }) {
    return this.merchantService.chat(dto.storeId, dto.query);
  }
}
```

- [ ] **Step 3: 完善 MerchantService**

添加文件上传、训练、AI测试逻辑：

```typescript
// src/modules/merchant/merchant.service.ts 补充

private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
private readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.md'];
private readonly TIMEOUT = 5 * 60 * 1000; // 5分钟

async uploadFile(storeId: string, file: Express.Multer.File) {
  // 验证文件大小和类型
  if (file.size > this.MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过10MB');
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`不支持的文件类型，支持: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // 保存到 store 目录
  const store = await this.storeService.findOne(storeId);
  const storagePath = store.fileStoragePath || `./uploads/${storeId}`;
  await fs.promises.mkdir(storagePath, { recursive: true });
  const destPath = `${storagePath}/${file.originalname}`;
  await fs.promises.rename(file.path, destPath);

  // 创建训练记录
  const job = await this.prisma.trainingJob.create({
    data: {
      storeId,
      fileName: file.originalname,
      filePath: destPath,
      status: 'PENDING',
    },
  });

  return { id: job.id, fileName: job.fileName, status: job.status };
}

async trainFile(jobId: string) {
  const job = await this.prisma.trainingJob.findUnique({ where: { id: jobId } });
  const store = await this.storeService.findOne(job.storeId);

  // 更新状态
  await this.prisma.trainingJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' },
  });

  try {
    // 调用 Dify API
    await this.difyService.createDocument(store.difyDatasetId, job.filePath);

    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  } catch (error) {
    await this.prisma.trainingJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: error.message },
    });
    throw error;
  }
}

async chat(storeId: string, query: string) {
  const store = await this.storeService.findOne(storeId);
  return this.difyService.sendMessage(null, {
    query,
    inputs: { dataset_id: store.difyDatasetId },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/merchant/
git commit -m "feat: 添加商家文件上传与训练 API"
```

---

### Task 4: 前端 - 商家知识训练页面

**Files:**
- Create: `frontend/src/components/MerchantTraining.tsx`
- Modify: `frontend/src/services/api.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建 API 接口**

在 `frontend/src/services/api.ts` 添加：

```typescript
// 上传文件
export const uploadTrainingFile = async (storeId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('storeId', storeId);
  return api.post('/api/merchant/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// 获取文件列表
export const getTrainingFiles = (storeId: string) =>
  api.get(`/api/merchant/files/${storeId}`);

// 删除文件
export const deleteTrainingFile = (jobId: string) =>
  api.delete(`/api/merchant/files/${jobId}`);

// 训练文件
export const trainFile = (jobId: string) =>
  api.post(`/api/merchant/files/${jobId}/train`);

// 训练所有文件
export const trainAllFiles = (storeId: string) =>
  api.post(`/api/merchant/files/${storeId}/train-all`);

// AI 测试聊天
export const chatWithKnowledge = (storeId: string, query: string) =>
  api.post('/api/merchant/chat', { storeId, query });
```

- [ ] **Step 2: 创建 MerchantTraining 页面**

```typescript
// frontend/src/components/MerchantTraining.tsx
import React, { useState, useEffect } from 'react';
import { uploadTrainingFile, getTrainingFiles, deleteTrainingFile, trainFile, chatWithKnowledge } from '../services/api';

interface TrainingJob {
  id: string;
  fileName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  position: 'left' | 'right';
}

export const MerchantTraining: React.FC<{ storeId: string; onBack: () => void }> = ({ storeId, onBack }) => {
  const [files, setFiles] = useState<TrainingJob[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // 加载文件列表
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const res = await getTrainingFiles(storeId);
    setFiles(res.data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await uploadTrainingFile(storeId, file);
      await loadFiles();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    await deleteTrainingFile(jobId);
    await loadFiles();
  };

  const handleTrain = async (jobId: string) => {
    setLoading(true);
    try {
      await trainFile(jobId);
      await loadFiles();
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) return;
    const userMsg = { id: Date.now().toString(), content: query, position: 'right' as const };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    setLoading(true);
    try {
      const res = await chatWithKnowledge(storeId, query);
      const aiMsg = { id: (Date.now() + 1).toString(), content: res.data.answer, position: 'left' as const };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merchant-training">
      <div className="header">
        <button onClick={onBack}>← 返回</button>
        <h2>商家知识库训练</h2>
      </div>

      {/* 文件上传 */}
      <div className="section">
        <h3>上传文件</h3>
        <input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.md" onChange={handleUpload} />
        <p className="hint">支持 PDF、Word、Excel、MD 文件，最大 10MB</p>
      </div>

      {/* 文件管理 */}
      <div className="section">
        <h3>文件管理</h3>
        <div className="file-list">
          {files.map(file => (
            <div key={file.id} className="file-item">
              <span>{file.fileName}</span>
              <span className={`status ${file.status.toLowerCase()}`}>{file.status}</span>
              <button onClick={() => handleTrain(file.id)} disabled={loading}>训练</button>
              <button onClick={() => handleDelete(file.id)} disabled={loading}>删除</button>
            </div>
          ))}
        </div>
      </div>

      {/* AI 测试 */}
      <div className="section">
        <h3>AI 测试</h3>
        <div className="chat-window">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.position}`}>{msg.content}</div>
          ))}
        </div>
        <div className="chat-input">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="输入问题测试..." />
          <button onClick={handleChat} disabled={loading}>发送</button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 修改 App.tsx 添加路由**

```typescript
// frontend/src/App.tsx
import MerchantTraining from './components/MerchantTraining';

// 添加状态
const [showMerchantTraining, setShowMerchantTraining] = useState(false);

// 添加按钮
<button onClick={() => setShowMerchantTraining(true)}>
  知识训练
</button>

// 条件渲染
{showMerchantTraining && (
  <MerchantTraining
    storeId={userInfo.storeId}
    onBack={() => setShowMerchantTraining(false)}
  />
)}
```

- [ ] **Step 4: 添加样式**

在 `frontend/src/index.css` 添加：

```css
.merchant-training {
  padding: 20px;
  color: #fff;
}

.merchant-training .section {
  margin-bottom: 24px;
}

.merchant-training h3 {
  margin-bottom: 12px;
}

.merchant-training .file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.merchant-training .file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
}

.merchant-training .status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.merchant-training .status.pending { background: #666; }
.merchant-training .status.processing { background: #f59e0b; }
.merchant-training .status.completed { background: #10b981; }
.merchant-training .status.failed { background: #ef4444; }
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: 添加商家知识库训练页面"
```

---

### Task 5: 集成测试

- [ ] **Step 1: 启动后端服务**

```bash
npm run start:dev
```

- [ ] **Step 2: 启动前端服务**

```bash
cd frontend && npm run dev
```

- [ ] **Step 3: 测试上传文件**

1. 点击"知识训练"按钮
2. 选择一个 PDF 文件上传
3. 验证文件出现在列表中

- [ ] **Step 4: 测试训练功能**

1. 点击文件后的"训练"按钮
2. 等待训练完成（查看状态变为 COMPLETED）

- [ ] **Step 5: 测试 AI 聊天**

1. 输入问题如"你们有哪些产品？"
2. 验证返回相关回答

- [ ] **Step 6: Commit**

```bash
git commit -m "test: 商家知识库功能测试"
```

---

## 执行方式

**Plan complete. Two execution options:**

**1. Subagent-Driven (recommended)** - 调度子任务代理逐个完成任务

**2. Inline Execution** - 在当前会话中批量执行任务

选择哪种方式？