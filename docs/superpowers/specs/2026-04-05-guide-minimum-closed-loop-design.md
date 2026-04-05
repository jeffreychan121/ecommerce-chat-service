# 商城聊天 + Dify 导购最小闭环设计

> 本设计文档描述如何在现有商城聊天系统中实现最小可上线的导购闭环功能。

## 一、架构概览

```
用户 → 前端聊天 → 后端 ChatService → Dify Chatflow
                  ↓                         ↑
              导购 API ←←←←←←←←←←←←←← (HTTP Request 节点)
```

**核心链路：**
1. 用户在聊天窗口输入商品需求
2. 后端把消息发给 Dify Chatflow
3. Dify 通过 HTTP Request 节点调用后端导购 API
4. 后端返回商品/库存/活动数据
5. Dify 生成推荐结果返回给前端

## 二、现有代码分析

### 2.1 Dify 集成层
- **文件**: `src/modules/dify/dify.service.ts`, `dify.client.ts`
- **能力**: sendMessage(), 管理 conversation_id, streaming/blocking
- **已传 inputs**: phone, store_id, store_type, channel, customer_id

### 2.2 会话管理
- **文件**: `src/modules/session/session.service.ts`
- **字段**: ChatSession.difyConversationId 已持久化
- **方法**: updateDifyConversationId() 可更新会话 ID

### 2.3 消息发送
- **文件**: `src/modules/chat/chat.service.ts`
- **路径**: POST /api/chat/sessions/:id/messages
- **流程**: 消息 → Dify → 保存响应 → 返回

## 三、需要实现的功能

### 3.1 导购业务接口 (Mock)

| 接口 | 路径 | 说明 |
|------|------|------|
| search-products | POST /api/guide/search-products | 商品搜索 |
| check-stock | POST /api/guide/check-stock | 库存查询 |
| check-promo | POST /api/guide/check-promo | 活动查询 |
| create-lead | POST /api/guide/create-lead | 留资创建 |

### 3.2 Dify 变量约定

**输入变量 (inputs):**
```json
{
  "phone": "13800138000",
  "store_id": "store_001",
  "store_type": "self",
  "channel": "H5",
  "customer_id": "user_xxx"
}
```

**会话变量 (Dify 内部维护):**
- cv_budget: 预算
- cv_scene: 场景（送礼/自用/办公等）
- cv_preference: 偏好
- cv_last_products: 最近推荐商品

### 3.3 conversation_id 管理规则

```
1. 同一商城会话复用同一个 difyConversationId
2. 如果店铺上下文变化（store_id/store_type 变化），新建 Dify 会话
3. 原因：Dify Chatflow 按会话维护上下文，不同店铺需要不同会话
```

## 四、数据结构

### 4.1 商品推荐
```typescript
interface ProductItem {
  sku_id: string;
  name: string;
  price: number;
  detail_url: string;
  short_reason: string;
}
```

### 4.2 留资记录
```typescript
interface LeadRecord {
  lead_id: string;
  user_id: string;
  store_id: string;
  sku_id: string;
  intent: 'buy' | 'consult' | 'compare';
  phone: string;
  remark?: string;
  created_at: string;
}
```

## 五、错误处理

| 场景 | 处理 |
|------|------|
| Dify 请求失败 | 返回友好错误消息给用户 |
| conversation_id 缺失 | 自动创建新会话 |
| 导购接口超时 | 返回"商品查询超时，请稍后重试" |
| create-lead 失败 | 记录日志，返回"留资失败，请稍后重试" |

## 六、前端展示

### 6.1 推荐商品卡片
当 Dify 返回包含商品推荐时，前端展示：
- 商品名称
- 价格
- 推荐理由
- 商品链接

### 6.2 留资引导
当用户表达购买意向时，显示留资表单

## 七、环境变量

```bash
# Dify 配置（已有）
DIFY_BASE_URL=http://localhost/v1
DIFY_API_KEY=dataset-xxx
DIFY_APP_TOKEN=app-xxx
DIFY_APP_ID=xxx

# 可选：导购功能开关
ENABLE_GUIDE=true
```

## 八、后续扩展

1. **替换真实商品系统**: 修改 GuideService 的 mock 实现为真实 API 调用
2. **CRM 对接**: create-lead 接口对接真实 CRM 系统
3. **更多推荐策略**: Dify Chatflow 增加商品排序/推荐算法