# 自营/第三方店铺 Dify 知识库隔离配置指南

本文档说明如何在 Dify Chatflow 中实现：
1. **知识库隔离** - 自营和第三方店铺检索不同知识库
2. **订单/物流隔离** - 根据店铺类型调用不同业务接口

---

## 整体架构

```
用户消息 → ChatService → Dify (带 store_type)
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Dify Chatflow                                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Question     │───▶│ If-Else      │───▶│ 知识库检索   │  │
│  │ Classifier   │    │ (店铺类型)    │    │ (根据分支)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                                 │
│         │            ┌─────┴─────┐                         │
│         │            │           │                         │
│         ▼            ▼           ▼                         │
│   ┌──────────┐  ┌──────────┐ ┌──────────┐                    │
│   │ HTTP请求 │  │ HTTP请求 │ │ LLM对话 │                    │
│   │ 订单查询 │  │ 物流查询 │ │(知识库)  │                    │
│   └──────────┘  └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 需要哪些节点

| 节点 | 用途 | 是否必需 |
|------|------|---------|
| User Input | 用户输入 | ✅ 必需 |
| Question Classifier | 区分问题类型（知识库/订单/物流/其他） | ✅ 必需 |
| Parameter Extractor | 提取订单号等参数 | ✅ 必需（用于订单物流） |
| If-Else (店铺类型) | 根据 store_type 路由 | ✅ 必需 |
| If-Else (意图) | 判断是查订单还是查物流 | ✅ 必需 |
| Knowledge Retrieval | 知识库检索 | ✅ 必需 |
| HTTP Request | 调用后端业务接口 | ✅ 必需 |
| LLM | 整合结果，生成回复 | ✅ 必需 |
| Answer | 返回最终答案 | ✅ 必需 |

---

## 完整配置步骤

### 第1步：User Input 节点

直接使用默认配置，无需修改。

---

### 第2步：Question Classifier 节点

**作用**：把问题分类到不同分支

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 问题分类器 |
| Input Variable | `sys.query` |
| Model | 选择可用的聊天模型 |

**Categories 配置**：

```
分类1: knowledge_qa
  描述: 商品参数、商品规格、材质、尺寸、功能、发票、支付方式、优惠券、积分、售后政策

分类2: order_logistics
  描述: 订单状态、是否发货、发货时间、物流信息、快递、配送进度

分类3: handoff
  描述: 转人工、人工客服、联系客服、投诉

分类4: other
  描述: 其他问题
```

---

### 第3步：Parameter Extractor 节点（订单/物流用）

**作用**：从用户问题中提取订单号和意图类型

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 参数提取 |
| Input Variable | `sys.query` |
| Model | 选择结构化输出能力强的模型 |

**Parameters**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| intent | String | 是 | order_status 或 logistics |
| order_no | String | 否 | 提取的订单号 |

**Extraction Instructions**：
```
请从用户问题中提取：
1. intent：只能是 order_status 或 logistics
   - 订单状态、是否发货、发货时间 → order_status
   - 物流、快递、配送、送达时间 → logistics
2. order_no：如果用户给了订单号就提取，没有则为空

示例：
- "查订单 DD123456 的状态" → intent=order_status, order_no=DD123456
- "我的快递到哪了" → intent=logistics, order_no=""
```

---

### 第4步：If-Else 节点 - 判断问题类型

**作用**：把问题分配到不同处理分支

```
节点名称: 判断问题类型

条件配置:
条件1: {{question_classifier.category}} == "knowledge_qa"  → 知识库
条件2: {{question_classifier.category}} == "order_logistics" → 订单物流
条件3: {{question_classifier.category}} == "handoff" → 转人工
默认: true → 其他
```

---

### 第5步：知识库分支 - If-Else 节点（判断店铺类型）

**作用**：根据店铺类型选择知识库

```
节点名称: 判断店铺类型

条件配置:
条件1: {{inputs.store_type}} == "self" → 自营店铺
条件2: {{inputs.store_type}} == "merchant" → 第三方店铺
默认: true → 默认知识库
```

---

### 第6步：知识库检索节点

**自营分支**：
```
节点名称: 自营知识库检索
Knowledge Base: 自营商品知识库
Query Text: {{sys.query}}
```

**商家分支**：
```
节点名称: 商家知识库检索
Knowledge Base: 商家商品知识库
Query Text: {{sys.query}}
```

---

### 第7步：订单/物流分支 - If-Else 节点（判断是否有订单号）

```
节点名称: 判断订单号

条件1: {{参数提取.order_no}} != "" → 有订单号
默认: true → 无订单号
```

**无订单号分支** → Answer 节点：
```
请提供订单号，我来帮您查询。
```

---

### 第8步：订单/物流分支 - If-Else 节点（判断查询类型）

```
节点名称: 判断查询类型

条件1: {{参数提取.intent}} == "order_status" → 订单查询
条件2: {{参数提取.intent}} == "logistics" → 物流查询
```

---

### 第9步：HTTP Request 节点

#### 订单查询

```
节点名称: 订单查询接口
Method: POST
URL: http://host.docker.internal:3000/api/agent

Headers:
  Content-Type: application/json

Body (JSON):
{
  "system": "order",
  "action": "order_status",
  "params": {
    "order_no": "{{参数提取.order_no}}"
  },
  "context": {
    "phone": "{{sys.phone}}",
    "store_type": "{{inputs.store_type}}"
  }
}
```

#### 物流查询

```
节点名称: 物流查询接口
Method: POST
URL: http://host.docker.internal:3000/api/agent

Headers:
  Content-Type: application/json

Body (JSON):
{
  "system": "order",
  "action": "logistics",
  "params": {
    "order_no": "{{参数提取.order_no}}"
  },
  "context": {
    "phone": "{{sys.phone}}",
    "store_type": "{{inputs.store_type}}"
  }
}
```

---

### 第10步：LLM 节点（整合回复）

#### 知识库回复 LLM

```
节点名称: 知识库回复
Context: 自营知识库检索.result 或 商家知识库检索.result

System: 你是一个商城智能客服。请严格依据提供的知识回答。
User: 用户问题：{{sys.query}}

知识内容：{{自营知识库检索.result}}
```

#### 订单回复 LLM

```
节点名称: 订单回复
Context: 订单查询接口.body

System: 你只能根据接口返回结果回答。
User: 订单信息：{{订单查询接口.body}}
```

#### 物流回复 LLM

```
节点名称: 物流回复
Context: 物流查询接口.body

System: 你只能根据接口返回结果回答。
User: 物流信息：{{物流查询接口.body}}
```

---

### 第11步：Answer 节点

每个分支最后接 Answer 节点，直接输出对应 LLM 的 text：

```
{{知识库回复.text}}
{{订单回复.text}}
{{物流回复.text}}
```

---

## 完整流程图

```
User Input
     │
     ▼
┌─────────────────┐
│ Question        │
│ Classifier      │
└────────┬────────┘
         │
    ┌────┼────┬────┐
    ▼    ▼    ▼    ▼
┌────┐ ┌────┐ ┌────┐ ┌────┐
│知识│ │订单│ │转人│ │其他│
│库  │ │物流│ │工  │ │   │
└─┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
  │      │       │       │
  ▼      │       │       ▼
┌────────┐│       │   ┌────────┐
│If-Else││       │   │LLM对话 │
│店铺类型││       │   │Answer  │
└──┬─────┘│       │   └────────┘
 ┌─┴─┐    │       │
 │   │    │       │
 ▼   ▼    ▼       ▼
自营 商家   ┌─────┴─────┐
知识库      │ 参数提取  │
  │        └─────┬─────┘
  │              │
  │        ┌─────┴─────┐
  │        │ If-Else  │
  │        │ 判断单号  │
  │        └─────┬─────┘
  │         ┌───┴───┐
  │         │       │
  │         ▼       ▼
  │    ┌───────┐ ┌───────┐
  │    │需要单号│ │ 有单号│
  │    │回复   │ │判断类型│
  │    └───────┘ └───────┘
  │              │
  │        ┌─────┴─────┐
  │        │ If-Else  │
  │        │ 判断类型  │
  │        └─────┬─────┘
  │         ┌───┴───┐
  │         │       │
  ▼         ▼       ▼
┌─────────┐ ┌─────────┐
│ LLM回复 │ │HTTP请求│
│ Answer  │ │订单/物流│
└─────────┘ └────┬────┘
                 │
                 ▼
            ┌─────────┐
            │ LLM回复 │
            │ Answer  │
            └─────────┘
```

---

## 变量引用表

| 变量 | 来源 | 用途 |
|------|------|------|
| `sys.query` | User Input | 用户问题 |
| `sys.phone` | 会话上下文 | 用户手机号 |
| `inputs.store_type` | 后端传入 | self / merchant |
| `inputs.store_id` | 后端传入 | 店铺ID |
| `question_classifier.category` | Question Classifier | 问题分类 |
| `参数提取.intent` | Parameter Extractor | order_status / logistics |
| `参数提取.order_no` | Parameter Extractor | 订单号 |
| `自营知识库检索.result` | Knowledge Retrieval | 知识库内容 |
| `订单查询接口.body` | HTTP Request | 订单数据 |
| `物流查询接口.body` | HTTP Request | 物流数据 |

---

## 后端配合

后端 `/api/agent` 接口需要支持 `store_type`：

```json
{
  "system": "order",
  "action": "order_status",
  "params": { "order_no": "DD123" },
  "context": {
    "phone": "1380000",
    "store_type": "self"
  }
}
```

这样后端可以根据 `store_type` 调对应业务系统。

---

## 测试清单

1. 自营店铺问知识库问题 → 检索自营知识库
2. 商家店铺问知识库问题 → 检索商家知识库
3. 自营店铺查订单 → 返回自营订单信息
4. 商家店铺查订单 → 返回商家订单信息
5. 查订单没给订单号 → 提示补充订单号