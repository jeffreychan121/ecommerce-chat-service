# 导购 API 文档

## 概述

本系统提供导购相关 API，供 Dify Chatflow HTTP Request 节点调用。

## 接口列表

### 1. 商品搜索

- **路径**: POST /api/guide/search-products
- **请求体**:
```json
{
  "store_id": "store_001",
  "store_type": "self",
  "query": "iPhone",
  "budget_min": 5000,
  "budget_max": 10000,
  "scene": "礼物",
  "preference": "高端"
}
```
- **响应**:
```json
{
  "items": [
    {
      "sku_id": "SKU001",
      "name": "iPhone 15 Pro Max 256GB",
      "price": 9999,
      "detail_url": "/product/SKU001",
      "short_reason": "最新旗舰机型..."
    }
  ]
}
```

### 2. 库存查询

- **路径**: POST /api/guide/check-stock
- **请求体**:
```json
{
  "store_id": "store_001",
  "sku_ids": ["SKU001", "SKU002"]
}
```
- **响应**:
```json
{
  "items": [
    {
      "sku_id": "SKU001",
      "in_stock": true,
      "stock_text": "有货"
    },
    {
      "sku_id": "SKU002",
      "in_stock": true,
      "stock_text": "有货"
    }
  ]
}
```

### 3. 活动查询

- **路径**: POST /api/guide/check-promo
- **请求体**:
```json
{
  "store_id": "store_001",
  "sku_ids": ["SKU001", "SKU002"]
}
```
- **响应**:
```json
{
  "items": [
    {
      "sku_id": "SKU001",
      "promo_text": "限时免息分期至高24期",
      "final_price": 9999
    }
  ]
}
```

### 4. 留资创建

- **路径**: POST /api/guide/create-lead
- **请求体**:
```json
{
  "user_id": "user_001",
  "store_id": "store_001",
  "sku_id": "SKU001",
  "intent": "buy",
  "phone": "13800138000",
  "remark": "想要256GB版本"
}
```
- **响应**:
```json
{
  "success": true,
  "lead_id": "LEAD_1234567890_abc123",
  "message": "感谢您的咨询，客服将尽快与您联系"
}
```

## Dify Chatflow 配置

在 Dify Chatflow 中添加 HTTP Request 节点，配置上述接口地址：

- **Base URL**: http://your-server:3000
- **认证**: 可选（当前无认证）

### Dify 请求示例

**商品搜索**:
```
URL: http://localhost:3000/api/guide/search-products
Method: POST
Content-Type: application/json
Body:
{
  "store_id": "{{inputs.store_id}}",
  "store_type": "{{inputs.store_type}}",
  "query": "{{query}}"
}
```

**留资创建**:
```
URL: http://localhost:3000/api/guide/create-lead
Method: POST
Content-Type: application/json
Body:
{
  "user_id": "{{inputs.customer_id}}",
  "store_id": "{{inputs.store_id}}",
  "sku_id": "{{cv_selected_sku}}",
  "intent": "buy",
  "phone": "{{inputs.phone}}"
}
```

## 注意事项

1. 所有接口返回 JSON 格式
2. store_type 必须为 "self" 或 "merchant"
3. intent 必须为 "buy", "consult" 或 "compare"
4. 当前为 Mock 实现，后续可替换为真实商品系统 API

## 环境变量

当前系统已有以下 Dify 配置：

```bash
DIFY_BASE_URL=http://localhost/v1
DIFY_API_KEY=dataset-xxx
DIFY_APP_TOKEN=app-xxx
DIFY_APP_ID=xxx
```