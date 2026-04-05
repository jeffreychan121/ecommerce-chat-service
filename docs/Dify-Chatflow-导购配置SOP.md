# Dify Chatflow 导购功能配置 SOP

## 一、现有 Chatflow 分析

你的 `商城智能客服PRO` 已有的流程：

```
用户输入 (store_type)
    ↓
Question Classifier → 分类: 商品知识 / 订单物流 / 其他
    ↓
IF/ELSE (判断store_type) → 自营知识库 / 第三方知识库
    ↓
知识库检索 → LLM生成回答 → 直接回复
```

**现有 HTTP Request 节点**:
- 订单查询: `POST http://host.docker.internal:3000/api/agent`
- 物流查询: `POST http://host.docker.internal:3000/api/agent`

## 二、添加导购流程步骤

### 步骤 1: 修改 Question Classifier

在 Dify 编辑器中找到 `Question Classifier` 节点，添加新分类：

- **分类名称**: 商品推荐
- **分类条件**: 当用户询问商品、购买、推荐、多少钱、有什么产品等
- **输出值**: `product_recommend`

### 步骤 2: 添加商品搜索 HTTP Request

在分类后的分支添加新节点：

1. **添加 HTTP Request 节点**
   - **名称**: 商品搜索
   - **URL**: `http://host.docker.internal:3000/api/guide/search-products`
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`
   - **Body**:
   ```json
   {
     "store_id": "{{inputs.store_id}}",
     "store_type": "{{inputs.store_type}}",
     "query": "{{sys.query}}"
   }
   ```

2. **输入变量** (在 Start 节点添加):
   - `store_id`: 店铺ID (string)
   - `store_type`: self 或 merchant

### 步骤 3: 添加推荐结果格式化 LLM

1. **添加 LLM 节点**
   - **名称**: 推荐结果处理
   - **Prompt**:
   ```
   你是商城智能客服助手。

   用户询问：{{sys.query}}

   商品搜索结果：
   {{商品搜索节点.response.body}}

   请根据搜索结果，为用户生成友好的推荐回复，包括：
   1. 商品名称
   2. 价格
   3. 推荐理由
   4. 如有多个商品，可推荐1-3个

   如果没有搜索结果，回复"抱歉，未找到相关商品"。
   ```

### 步骤 4: (可选) 添加留资功能

当用户明确表达购买意向时，调用留资接口：

1. **添加条件判断** (If-Else)
   - 判断用户是否说"我要买"、"下单"、"购买"等

2. **添加 HTTP Request 节点**
   - **URL**: `http://host.docker.internal:3000/api/guide/create-lead`
   - **Body**:
   ```json
   {
     "user_id": "{{inputs.customer_id}}",
     "store_id": "{{inputs.store_id}}",
     "sku_id": "{{选择的商品SKU}}",
     "intent": "buy",
     "phone": "{{inputs.phone}}"
   }
   ```

3. **回复留资成功消息**

## 三、完整流程图

```
用户输入
    ↓
Question Classifier
    ├─ 商品推荐 → 商品搜索 → 推荐结果处理 → 直接回复
    ├─ 订单/物流 → (现有流程)
    └─ 知识问答 → (现有流程)
```

## 四、Dify 变量对应关系

| Dify 变量 | 后端字段 | 说明 |
|-----------|----------|------|
| `inputs.store_id` | store_id | 店铺ID |
| `inputs.store_type` | store_type | self/merchant |
| `inputs.phone` | phone | 用户手机号 |
| `inputs.customer_id` | customer_id | 客户ID |
| `sys.query` | query | 用户问题 |
| `{{http节点.body}}` | response | HTTP响应 |

## 五、测试验证

### 本地测试 API

```bash
# 商品搜索
curl -X POST http://localhost:3000/api/guide/search-products \
  -H "Content-Type: application/json" \
  -d '{"store_id":"store_001","store_type":"self","query":"iPhone"}'

# 留资创建
curl -X POST http://localhost:3000/api/guide/create-lead \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_001","store_id":"store_001","sku_id":"SKU001","intent":"buy","phone":"13800138000"}'
```

### Dify 测试

在 Dify 的"预览"功能中测试：
1. 输入: "我想买 iPhone"
2. 观察商品搜索节点是否正确调用
3. 观察返回结果是否正确显示

## 六、注意事项

1. **URL 适配**: 如果 Dify 和后端不在同一机器，将 `host.docker.internal` 改为实际后端地址

2. **输入变量**: 确保在 Start 节点配置以下输入变量：
   - `store_id` (string, 必填)
   - `store_type` (select: self/merchant, 必填)
   - `phone` (string, 可选)
   - `customer_id` (string, 可选)

3. **错误处理**: HTTP 请求节点可配置重试次数，建议开启重试

4. **日志查看**: 后端日志路径 `/tmp/backend.log`，查看请求是否到达

## 七、现有 Dify 配置参考

```yaml
# 你的 Start 节点已有变量
start:
  variables:
    - store_type: self/merchant (select)

# Question Classifier 已有分类
- 1: 商品知识/平台规则/支付方式
- 2: 订单状态/物流信息
- other: 其他
```

## 八、常见问题

**Q: HTTP 请求返回 404?**
A: 检查 URL 是否正确，当前后端地址是 `http://localhost:3000`

**Q: 商品搜索结果为空?**
A: 检查 store_id 和 query 是否正确传递

**Q: 如何判断用户购买意向?**
A: 可使用 If-Else 节点判断用户消息中是否包含"买"、"下单"等关键词