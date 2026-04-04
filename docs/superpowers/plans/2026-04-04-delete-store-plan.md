# 删除店铺功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有店铺管理模块中增加删除功能，支持手动删除店铺及其关联数据（会话、消息、转人工工单）。

**Architecture:** 后端 StoreController 新增 DELETE 接口，StoreService 实现级联删除；前端在店铺下拉选择器中增加删除按钮和确认对话框。

**Tech Stack:** NestJS + Prisma + React

---

## 文件结构

| 层级 | 文件 | 改动 |
|------|------|------|
| 后端 | `src/modules/store/store.controller.ts` | 新增 DELETE 接口 |
| 后端 | `src/modules/store/store.service.ts` | 新增 deleteStore 方法 |
| 前端 | `frontend/src/services/api.ts` | 新增 deleteStore API 调用 |
| 前端 | `frontend/src/components/MainPage.tsx` | 店铺列表增加删除按钮和确认弹窗 |

---

## 实现计划

### Task 1: 后端 - StoreController 新增 DELETE 接口

**Files:**
- Modify: `src/modules/store/store.controller.ts:1-24`

- [ ] **Step 1: 添加 Delete 导入**

修改 `src/modules/store/store.controller.ts` 文件开头：

```typescript
import { Controller, Get, Post, Delete, Body, Param, Logger, NotFoundException } from '@nestjs/common';
```

- [ ] **Step 2: 新增删除接口**

在 `StoreController` 类末尾（`createStore` 方法后）添加：

```typescript
// 删除店铺
@Delete(':id')
async deleteStore(@Param('id') id: string) {
  this.logger.log(`Deleting store: ${id}`);
  return this.storeService.deleteStore(id);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/store/store.controller.ts
git commit -m "feat(store): add DELETE /:id endpoint for store deletion"
```

---

### Task 2: 后端 - StoreService 实现删除逻辑

**Files:**
- Modify: `src/modules/store/store.service.ts`

- [ ] **Step 1: 添加 NotFoundException 导入并添加 deleteStore 方法**

修改 `src/modules/store/store.service.ts` 文件开头：

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
```

在 `StoreService` 类中添加以下方法（可放在 `findAll` 方法之前）：

```typescript
// 删除店铺及其关联数据
async deleteStore(id: string): Promise<void> {
  // 先检查店铺是否存在
  const store = await this.prisma.store.findUnique({ where: { id } });
  if (!store) {
    throw new NotFoundException('店铺不存在');
  }
  // 删除所有关联的会话（Messages 和 HandoffTickets 会级联删除）
  await this.prisma.chatSession.deleteMany({ where: { storeId: id } });
  // 删除店铺
  await this.prisma.store.delete({ where: { id } });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/store/store.service.ts
git commit -m "feat(store): implement deleteStore with cascade deletion"
```

---

### Task 3: 前端 - API 层新增删除接口

**Files:**
- Modify: `frontend/src/services/api.ts:44-47`

- [ ] **Step 1: 新增 deleteStore 函数**

在 `createStore` 函数之后添加：

```typescript
// 删除店铺
export async function deleteStore(id: string): Promise<void> {
  await api.delete(`/api/stores/${id}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(api): add deleteStore API function"
```

---

### Task 4: 前端 - MainPage 店铺列表增加删除按钮

**Files:**
- Modify: `frontend/src/components/MainPage.tsx:359-374`

- [ ] **Step 1: 添加状态和函数**

在 `MainPage` 组件中，添加状态和删除处理函数：

```typescript
const [deleteConfirmStore, setDeleteConfirmStore] = useState<Store | null>(null);

const handleDeleteStore = async (store: Store) => {
  try {
    await deleteStore(store.id);
    setStores(prev => prev.filter(s => s.id !== store.id));
    // 如果删除的是当前选中的店铺，清除选择
    if (selectedStore?.id === store.id) {
      setSelectedStore(null);
    }
    setDeleteConfirmStore(null);
  } catch (error) {
    alert('删除失败，请重试');
  }
};
```

- [ ] **Step 2: 修改店铺选择 UI 为可删除的下拉列表**

将现有的 `<select>` 替换为自定义下拉列表，支持显示删除按钮：

```typescript
<div style={{ position: 'relative', display: 'inline-block' }}>
  <select
    value={selectedStore?.id || ''}
    onChange={(e) => {
      const store = stores.find(s => s.id === e.target.value);
      if (store) handleStoreChange(store);
    }}
    style={storeSelectStyle}
  >
    {stores.length === 0 && <option value="">暂无店铺</option>}
    {stores.map(store => (
      <option key={store.id} value={store.id}>
        {store.name} ({store.storeType === 'SELF' ? '自营' : '商家'})
      </option>
    ))}
  </select>
  {/* 删除按钮 */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      const store = stores.find(s => s.id === selectedStore?.id);
      if (store) setDeleteConfirmStore(store);
    }}
    style={{
      position: 'absolute',
      right: '30px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      color: '#999',
      cursor: 'pointer',
      fontSize: '14px',
    }}
    title="删除当前店铺"
  >
    🗑️
  </button>
</div>
```

- [ ] **Step 3: 添加删除确认对话框**

在组件的 JSX 中，在 `<select>` 之后添加确认弹窗：

```typescript
{/* 删除确认对话框 */}
{deleteConfirmStore && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }} onClick={() => setDeleteConfirmStore(null)}>
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '360px',
      textAlign: 'center',
    }} onClick={e => e.stopPropagation()}>
      <h3 style={{ margin: '0 0 16px', color: '#333' }}>确认删除</h3>
      <p style={{ margin: '0 0 24px', color: '#666' }}>
        确定删除店铺「{deleteConfirmStore.name}」吗？删除后该店铺的所有会话记录将被一并删除。
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => setDeleteConfirmStore(null)}
          style={{
            padding: '8px 24px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          取消
        </button>
        <button
          onClick={() => handleDeleteStore(deleteConfirmStore)}
          style={{
            padding: '8px 24px',
            border: 'none',
            borderRadius: '6px',
            background: '#ff4d4f',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          删除
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: 导入 deleteStore**

确保文件开头导入了 `deleteStore`：

```typescript
import { getStores, createStore, deleteStore, Store } from '../services/api';
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/MainPage.tsx
git commit -m "feat(frontend): add store deletion with confirmation dialog"
```

---

## 验证

完成所有任务后，执行以下验证：

1. **后端测试**：
   ```bash
   # 启动后端
   pnpm run start:dev

   # 测试删除接口（使用 curl 或 Postman）
   curl -X DELETE http://localhost:3000/api/stores/<store-id>
   # 预期：204 No Content
   ```

2. **前端测试**：
   ```bash
   cd frontend
   pnpm run dev

   # 打开浏览器访问 http://localhost:5173
   # 选择一个店铺，点击删除按钮
   # 确认对话框出现，点击确认后店铺应被删除
   ```

3. **数据库验证**：
   ```bash
   # 确认店铺及关联会话已被删除
   npx prisma studio
   ```