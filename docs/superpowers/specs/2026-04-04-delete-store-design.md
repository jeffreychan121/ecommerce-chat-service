# 删除店铺功能设计

## 概述

在现有店铺管理模块中增加删除功能，支持手动删除店铺及其关联数据。

## 数据模型

```
Store (1) ─── (N) ChatSession
  │                │
  │                ├── (N) ChatMessage (已有 Cascade)
  │                └── (N) HandoffTicket
```

## 实现方案

### 后端

**1. StoreController - 新增 DELETE 接口**

```typescript
@Delete(':id')
async deleteStore(@Param('id') id: string) {
  return this.storeService.deleteStore(id);
}
```

**2. StoreService - 实现删除逻辑**

- 删除该店铺下的所有 ChatSession（通过 Prisma 级联删除关联的 Messages 和 HandoffTickets）
- 删除 Store 本身

```typescript
async deleteStore(id: string): Promise<void> {
  // 删除所有关联的会话（Messages 和 HandoffTickets 会级联删除）
  await this.prisma.chatSession.deleteMany({ where: { storeId: id } });
  // 删除店铺
  await this.prisma.store.delete({ where: { id } });
}
```

### 前端

- 店铺列表每行增加删除按钮（图标按钮）
- 点击后弹出确认框：
  - 标题：「确认删除」
  - 内容：「确定删除店铺 "{店铺名}" 吗？删除后该店铺的所有会话记录将被一并删除。」

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | /api/stores/:id | 删除店铺及关联会话 |

## 错误处理

- 店铺不存在：返回 404
- 删除失败：返回 500 并记录日志