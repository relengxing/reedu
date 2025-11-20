# Schema 迁移指南

本文档说明如何将Reedu数据库从默认的 `public` schema 迁移到自定义 `reedu` schema。

## 为什么使用自定义 Schema?

参考 `SUPABASE_TROUBLESHOOTING.md` 文档的经验:

1. **更好的组织**: 将应用数据与系统数据分离
2. **避免命名冲突**: 防止与 Supabase 内置表冲突
3. **权限隔离**: 更精细的权限控制
4. **可扩展性**: 为未来多应用部署做准备

## 已完成的变更

### 1. 数据库 Schema (supabase-schema.sql)

**主要变更:**
- ✅ 创建 `reedu` schema
- ✅ 所有表移到 `reedu` schema:
  - `reedu.user_repos`
  - `reedu.public_coursewares`
  - `reedu.courseware_likes`
- ✅ 所有索引更新到 `reedu` schema
- ✅ 所有函数移到 `reedu` schema:
  - `reedu.update_updated_at_column()`
  - `reedu.sync_likes_count()`
  - `reedu.increment_view_count(UUID)` (新增)
- ✅ 所有触发器更新到 `reedu` schema
- ✅ 添加完整的权限授予:
  - Schema 使用权限
  - 表操作权限
  - 序列使用权限
  - 函数执行权限
  - 默认权限设置
- ✅ RLS 策略使用 `DROP POLICY IF EXISTS` 避免重复
- ✅ 使用 `SECURITY DEFINER` 函数避免 RLS 循环引用

### 2. 代码变更

**src/config/supabase.ts:**
```typescript
// 新增 SCHEMA 常量
export const SCHEMA = 'reedu';
```

**src/services/userRepoService.ts:**
- ✅ 所有查询添加 `.schema(SCHEMA)`
- ✅ 6处查询已更新

**src/services/coursewareSquareService.ts:**
- ✅ 所有查询添加 `.schema(SCHEMA)`
- ✅ 13处查询已更新
- ✅ RPC 调用更新为使用正确的参数名和schema

## 迁移步骤

### 如果是新项目 (推荐)

1. 直接在 Supabase SQL Editor 中执行更新后的 `supabase-schema.sql`
2. 代码已经更新，无需额外修改
3. 开始使用！

### 如果已有数据需要迁移

⚠️ **重要**: 请先备份数据！

#### 方案一：重建数据库 (推荐用于测试/开发环境)

1. **备份现有数据**:
```sql
-- 导出数据
COPY public.user_repos TO '/tmp/user_repos.csv' WITH CSV HEADER;
COPY public.public_coursewares TO '/tmp/public_coursewares.csv' WITH CSV HEADER;
COPY public.courseware_likes TO '/tmp/courseware_likes.csv' WITH CSV HEADER;
```

2. **删除旧表**:
```sql
DROP TABLE IF EXISTS public.courseware_likes CASCADE;
DROP TABLE IF EXISTS public.public_coursewares CASCADE;
DROP TABLE IF EXISTS public.user_repos CASCADE;
```

3. **执行新 Schema 脚本**:
   - 在 Supabase SQL Editor 中执行 `supabase-schema.sql`

4. **导入数据** (如果需要):
```sql
-- 导入数据
COPY reedu.user_repos FROM '/tmp/user_repos.csv' WITH CSV HEADER;
COPY reedu.public_coursewares FROM '/tmp/public_coursewares.csv' WITH CSV HEADER;
COPY reedu.courseware_likes FROM '/tmp/courseware_likes.csv' WITH CSV HEADER;
```

#### 方案二：数据迁移 (用于生产环境)

1. **创建新 Schema 和表**:
   - 执行 `supabase-schema.sql`

2. **迁移数据**:
```sql
-- 迁移 user_repos
INSERT INTO reedu.user_repos 
SELECT * FROM public.user_repos;

-- 迁移 public_coursewares
INSERT INTO reedu.public_coursewares 
SELECT * FROM public.public_coursewares;

-- 迁移 courseware_likes
INSERT INTO reedu.courseware_likes 
SELECT * FROM public.courseware_likes;
```

3. **验证数据**:
```sql
-- 检查记录数是否一致
SELECT 'user_repos' as table_name, 
       (SELECT COUNT(*) FROM public.user_repos) as old_count,
       (SELECT COUNT(*) FROM reedu.user_repos) as new_count;

SELECT 'public_coursewares' as table_name,
       (SELECT COUNT(*) FROM public.public_coursewares) as old_count,
       (SELECT COUNT(*) FROM reedu.public_coursewares) as new_count;

SELECT 'courseware_likes' as table_name,
       (SELECT COUNT(*) FROM public.courseware_likes) as old_count,
       (SELECT COUNT(*) FROM reedu.courseware_likes) as new_count;
```

4. **测试应用**:
   - 部署更新后的代码
   - 验证所有功能正常

5. **删除旧表** (确认无误后):
```sql
DROP TABLE IF EXISTS public.courseware_likes CASCADE;
DROP TABLE IF EXISTS public.public_coursewares CASCADE;
DROP TABLE IF EXISTS public.user_repos CASCADE;
```

## 验证

### 1. 检查 Schema 是否创建

```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'reedu';
```

### 2. 检查表是否存在

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'reedu';
```

应该返回:
- `user_repos`
- `public_coursewares`
- `courseware_likes`

### 3. 检查权限

```sql
-- 检查 schema 权限
SELECT grantee, privilege_type
FROM information_schema.usage_privileges
WHERE object_schema = 'reedu';

-- 检查表权限
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'reedu';
```

应该能看到 `anon` 和 `authenticated` 角色有相应权限。

### 4. 检查 RLS 策略

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'reedu';
```

应该能看到所有 RLS 策略。

### 5. 测试查询

```sql
-- 测试基本查询（需要先登录）
SELECT * FROM reedu.user_repos LIMIT 1;
SELECT * FROM reedu.public_coursewares WHERE is_public = true LIMIT 1;
SELECT * FROM reedu.courseware_likes LIMIT 1;

-- 测试函数
SELECT reedu.increment_view_count('some-uuid-here');
```

## 常见问题

### Q: 为什么不用 exposed schemas 配置?

A: 根据 `SUPABASE_TROUBLESHOOTING.md`:
- 使用 `.schema('reedu')` 方法更明确
- 不依赖 Supabase 控制台配置
- 代码可移植性更好
- 避免缓存问题

### Q: 遇到 "relation does not exist" 错误?

A: 检查以下几点:
1. 确认已执行 `supabase-schema.sql`
2. 确认代码中使用了 `.schema(SCHEMA)`
3. 确认权限已正确授予
4. 查看浏览器控制台的详细错误信息

### Q: RLS 策略不生效?

A: 检查:
1. 表是否启用了 RLS: `ALTER TABLE reedu.xxx ENABLE ROW LEVEL SECURITY;`
2. 策略是否正确创建
3. 用户是否已登录
4. 策略条件是否正确（如 `auth.uid() = user_id`）

### Q: 增加浏览次数失败?

A: 检查:
1. 函数 `reedu.increment_view_count(UUID)` 是否存在
2. 函数是否有 `SECURITY DEFINER` 属性
3. 函数执行权限是否已授予
4. RPC 调用参数名是否正确: `courseware_uuid` 而不是 `courseware_id`

### Q: 需要回滚怎么办?

A: 如果迁移出现问题:
1. 如果还保留旧表，可以临时修改代码回到 `public` schema
2. 或者重新执行旧的 schema 脚本
3. 确保有数据备份

## 最佳实践

根据 `SUPABASE_TROUBLESHOOTING.md`:

1. ✅ **总是使用 `.schema('reedu')` 方法**
2. ✅ **使用 `SECURITY DEFINER` 避免 RLS 循环引用**
3. ✅ **授予所有必要的权限**
4. ✅ **使用 `DROP IF EXISTS` 避免重复创建**
5. ✅ **使用 `maybeSingle()` 而不是 `single()`**
6. ✅ **添加详细的错误日志**

## 性能考虑

使用自定义 schema 不会影响性能:
- Schema 只是逻辑组织，不影响查询速度
- 索引和约束都正常工作
- RLS 策略性能与 public schema 相同

## 参考资料

- `SUPABASE_TROUBLESHOOTING.md` - Supabase 使用经验
- [Supabase Schema 文档](https://supabase.com/docs/guides/api/using-custom-schemas)
- [PostgreSQL Schema 文档](https://www.postgresql.org/docs/current/ddl-schemas.html)

---

**最后更新**: 2025-11-20  
**状态**: ✅ 已完成

