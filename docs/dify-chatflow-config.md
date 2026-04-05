# Dify Chatflow 配置指南

本文档详细介绍如何配置 Dify Chatflow，实现：
- 知识库类问题 → Knowledge Retrieval
- 订单/物流类问题 → HTTP Request 调用 `/api/agent`
- 其他问题 → LLM 对话
- 转人工 → 提示转接人工

---

## Chatflow 整体结构

```
User Input
    │
    ▼
┌─────────────────┐
│ Question        │
│ Classifier      │
└────────┬────────┘
         │
    ┌────┼────┬────────┐
    │    │    │        │
    ▼    ▼    ▼        ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│知识库│ │订单 │ │转人 │ │其他 │
│问答  │ │物流 │ │工   │ │对话 │
└─┬───┘ └──┬──┘ └──┬──┘ └──┬──┘
  │        │       │       │
  ▼        ▼       ▼       ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│检索 │ │参数  │ │回复 │ │LLM  │
│+LLM │ │提取  │ │提示 │ │对话 │
└─────┘ └──┬──┘ └─────┘ └─────┘
           │
      ┌────┴────┐
      │ If-Else │
      │判断单号 │
      └────┬────┘
       ┌───┴───┐
       │       │
       ▼       ▼
   ┌───────┐ ┌───────┐
   │需要单号│ │ 有单号│
   │回复   │ │判断类型│
   └───────┘ └───────┘
              │
         ┌────┴────┐
         │ If-Else │
         │ 判断类型 │
         └────┬────┘
          ┌───┴───┐
          │       │
          ▼       ▼
    ┌─────────┐ ┌─────────┐
    │HTTP请求 │ │HTTP请求 │
    │(订单)   │ │(物流)   │
    └────┬────┘ └────┬────┘
         │           │
         ▼           ▼
    ┌─────────┐ ┌─────────┐
    │ LLM组织  │ │ LLM组织 │
    │ 回复    │ │ 回复   │
    └────┬────┘ └────┬────┘
         └──────┬─────┘
                ▼
            ┌──────┐
            │Answer│
            └──────┘
```

---

## 第1步：添加 User Input 节点

直接使用默认配置，无需自定义字段。

---

## 第2步：添加 Question Classifier 节点

### 2.1 基本配置

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 问题分类器 |
| Input Variable | `sys.query` 或 `userinput.query`（根据界面选择） |
| Model | 选择可用的聊天模型 |

### 2.2 Categories 配置

创建 4 个分类：

#### 分类 1：知识库问答
- **名称**: `knowledge_qa`
- **描述**: 商品参数、商品规格、材质、尺寸、功能、发票、支付方式、优惠券、积分、售后政策、平台规则、退换货规则

#### 分类 2：订单/物流
- **名称**: `order_logistics`
- **描述**: 订单状态、是否发货、发货时间、物流信息、快递、配送进度、什么时候送到、轨迹查询

#### 分类 3：转人工
- **名称**: `handoff`
- **描述**: 转人工、人工客服、联系客服、投诉、我要人工处理

#### 分类 4：其他
- **名称**: `other`
- **描述**: 与商城客服无关的问题，或者表达不清、暂时无法准确分类的问题

### 2.3 Instructions

在 Instructions 中添加：

```
如果问题涉及订单状态、物流、发货、配送、快递、送达时间，优先分类到 order_logistics。
如果问题涉及商品知识、平台规则、支付方式、发票、优惠券、积分、售后政策，分类到 knowledge_qa。
如果用户明确要求人工客服、投诉或人工处理，分类到 handoff。
其他无法明确判断的问题，分类到 other。
```

---

## 第3步：配置「知识库问答」分支

### 3.1 添加 Knowledge Retrieval 节点

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 知识库检索 |
| Query Text | `sys.query` 或 `userinput.query` |
| Knowledge Base | 选择已创建的知识库 |

### 3.2 添加 LLM 节点

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 知识库回答 |
| Context | `知识库检索.result` |

**System Prompt**:
```
你是商城智能客服助手。
请严格依据提供的知识内容回答用户问题，不要编造。
如果知识不足，请明确说"当前知识库暂无足够信息"。
回答时先给结论，再简短说明。
```

**User Prompt**:
```
用户问题：{{sys.query}}

知识内容：{{知识库检索.result}}
```

### 3.3 添加 Answer 节点

| 配置项 | 值 |
|--------|-----|
| 内容 | `{{知识库回答.text}}` |

---

## 第4步：配置「订单/物流」分支

### 4.1 添加 Parameter Extractor 节点

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 参数提取 |
| Input Variable | `sys.query` 或 `userinput.query` |
| Model | 选择结构化输出能力较好的模型 |

**Parameters**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| intent | String | 是 | 只能是 `order_status` 或 `logistics` |
| order_no | String | 否 | 提取的订单号，如果没有则为空 |

**Extraction Instructions**:
```
请从用户问题中提取两个字段：
1. intent：只能是 order_status 或 logistics
   - 如果用户问订单状态、是否发货、发货时间，提取为 order_status
   - 如果用户问物流、快递、配送进度、送达时间，提取为 logistics
2. order_no：如果用户明确给出了订单号则提取，否则为空

示例：
- "帮我查一下订单 123456 的状态" -> intent=order_status, order_no="123456"
- "查物流 99887766" -> intent=logistics, order_no="99887766"
- "我的订单到哪了" -> intent=order_status, order_no=""
```

### 4.2 添加 If-Else 节点（判断是否有订单号）

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 判断订单号 |

**条件配置**:

| 条件 | 表达式 |
|------|--------|
| 条件1 | `{{参数提取.order_no}}` != "" |
| 条件2（默认） | true |

**条件1 分支**（有订单号）：
- 添加另一个 If-Else 节点，判断 intent

**条件2 分支**（无订单号）：
- 添加 Answer 节点，内容：`请提供订单号，我来帮您查询订单状态或物流信息。`

### 4.3 添加 If-Else 节点（判断 intent 类型）

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 判断查询类型 |

**条件配置**:

| 条件 | 表达式 |
|------|--------|
| 条件1 | `{{参数提取.intent}}` == "order_status" |
| 条件2 | `{{参数提取.intent}}` == "logistics" |

---

## 第5步：配置 HTTP Request 节点

### 5.1 订单查询 HTTP Request

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 订单查询接口 |
| Method | POST |
| URL | `http://localhost:3000/api/agent`（生产环境替换为实际域名） |

**Headers**:

| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body (JSON)**:
```json
{
  "system": "order",
  "action": "order_status",
  "params": {
    "order_no": "{{参数提取.order_no}}"
  },
  "context": {
    "phone": "{{sys.phone}}"
  }
}
```

### 5.2 物流查询 HTTP Request

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 物流查询接口 |
| Method | POST |
| URL | `http://localhost:3000/api/agent` |

**Body (JSON)**:
```json
{
  "system": "order",
  "action": "logistics",
  "params": {
    "order_no": "{{参数提取.order_no}}"
  },
  "context": {
    "phone": "{{sys.phone}}"
  }
}
```

---

## 第6步：配置 LLM 组织回复

### 6.1 订单查询 LLM

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 订单回复 |
| Context | `订单查询接口.response.body` |

**System Prompt**:
```
你是商城智能客服助手。
你只能根据订单接口返回结果回答，不要编造。
如果接口返回没有订单信息，请明确告知用户未查询到订单。
回答时先说当前订单状态，再做简短说明。
```

**User Prompt**:
```
用户问题：{{sys.query}}

订单接口返回：{{订单查询接口.response.body}}
```

### 6.2 物流查询 LLM

| 配置项 | 值 |
|--------|-----|
| 节点名称 | 物流回复 |
| Context | `物流查询接口.response.body` |

**System Prompt**:
```
你是商城智能客服助手。
你只能根据物流接口返回结果回答，不要编造。
如果接口没有物流信息，请明确告知用户暂未查询到物流信息。
回答时先说当前物流状态，再补充最近节点或预计送达时间。
```

**User Prompt**:
```
用户问题：{{sys.query}}

物流接口返回：{{物流查询接口.response.body}}
```

---

## 第7步：配置「转人工」分支

添加 Answer 节点：

| 配置项 | 值 |
|--------|-----|
| 内容 | 已为您转接人工客服，请稍候。 |

---

## 第8步：配置「其他」分支

添加 Answer 节点：

| 配置项 | 值 |
|--------|-----|
| 内容 | 抱歉，我暂时无法准确判断您的问题。您可以换一种说法，或者联系人工客服。 |

---

## 完整变量引用表

| 变量名 | 来源 | 用途 |
|--------|------|------|
| `sys.query` | User Input | 用户问题 |
| `sys.phone` | 会话上下文 | 用户手机号 |
| `参数提取.intent` | Parameter Extractor | 意图类型 |
| `参数提取.order_no` | Parameter Extractor | 订单号 |
| `知识库检索.result` | Knowledge Retrieval | 知识库内容 |
| `订单查询接口.response.body` | HTTP Request | 订单接口响应 |
| `物流查询接口.response.body` | HTTP Request | 物流接口响应 |

---

## 测试清单

1. **知识库问题**: "你们支持什么支付方式？" → 应走知识库分支
2. **订单查询**: "帮我查一下订单 DD85326802390 的状态" → 应调用订单接口
3. **物流查询**: "我的快递到哪了？" → 应调用物流接口（需要先提供订单号）
4. **转人工**: "我要人工客服" → 应提示转人工
5. **其他**: "今天天气怎么样" → 应回复无法判断

---

## 常见问题

### Q1: HTTP Request 返回 JSON 怎么解析？
Dify HTTP Request 节点默认会把响应放在 `response.body` 变量中，LLM 可以直接读取。

### Q2: 需要鉴权怎么办？
在 HTTP Request 节点中配置 Authentication：
- API Key: 填入 key
- Bearer: 填入 token
- Custom Header: 添加自定义 Header

### Q3: phone 变量从哪里获取？
需要在会话创建时把 phone 通过 `inputs` 传给 Dify，这样 `sys.phone` 才能生效。

### Q4: 接口超时怎么办？
在 HTTP Request 节点中设置 Timeout（默认 30 秒）。

---

## 生产环境配置

1. 把 `http://localhost:3000` 替换为实际域名
2. 添加鉴权（API Key 或 Bearer Token）
3. 配置 HTTPS
4. 在 AgentController 添加鉴权中间件