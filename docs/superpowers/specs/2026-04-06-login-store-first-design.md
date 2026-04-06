# 登录逻辑修改 - 第一个店铺优先

## 需求

修改登录逻辑：
- 如果数据库没有任何店铺 → 创建新店铺
- 如果已有店铺 → 使用任意第一个现有店铺

## 修改内容

修改 `src/modules/user/user.service.ts` 中 `findOrCreateWithStore()` 方法：

```typescript
// 查找或创建店铺（改为使用第一个现有店铺）
let store = await this.prisma.store.findFirst({
  orderBy: { createdAt: 'asc' }, // 按创建时间升序，获取最早创建的店铺
});

if (!store) {
  // 没有店铺时创建新店铺
  store = await this.prisma.store.create({
    data: {
      name: `Store-Shared`,
      storeType: 'MERCHANT' as any,
      fileStoragePath: './uploads/shared',
    },
  });
}
```

## 影响

- 所有用户登录后使用同一个共享店铺
- 店铺切换功能保持不变（仍可切换到其他店铺）