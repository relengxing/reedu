# Supabase 调试经验与最佳实践

本文档记录了在 MemoriTree 项目中使用 Supabase 时遇到的问题、解决方案和最佳实践。

## 目录

1. [版本选择](#版本选择)
2. [Schema 配置](#schema-配置)
3. [RLS 策略与循环引用](#rls-策略与循环引用)
4. [认证与 Cookie 处理](#认证与-cookie-处理)
5. [常见错误与解决方案](#常见错误与解决方案)

---

## 版本选择

### ⚠️ 重要：使用最新版本的 @supabase/ssr

**问题**：使用旧版本 `@supabase/ssr@0.1.0` 会导致：
- Cookie 处理 API 不兼容
- 认证状态无法正确同步
- 服务端和客户端状态不一致

**解决方案**：
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.7.0"  // 使用最新版本，不要用 0.1.0
  }
}
```

**原因**：
- 新版本（0.7.0+）使用 `getAll()` 和 `setAll()` API，更稳定可靠
- 旧版本（0.1.0）使用已废弃的 `get()`, `set()`, `remove()` API
- 新版本修复了多个认证和 cookie 同步的 bug

---

## Schema 配置

### 1. 使用自定义 Schema（非 public）

当表在自定义 schema（如 `memoritree`）中时，需要特殊处理。

#### 方法一：使用 `.schema()` 方法（推荐）

**在客户端代码中**：
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ✅ 正确：使用 .schema() 方法
const { data } = await supabase
  .schema('memoritree')
  .from('profiles')
  .select('*')
```

**注意**：
- 必须在 `.from()` 之前调用 `.schema()`
- 不需要在 Supabase 控制台配置 exposed schemas
- 这是最推荐的方法

#### 方法二：配置 Exposed Schemas（备选）

如果不想在代码中使用 `.schema()`，可以在 Supabase 控制台配置：

1. 进入 **Settings** > **API**
2. 找到 **Exposed schemas** 设置
3. 添加 `memoritree`（多个用逗号分隔，如：`public,memoritree`）
4. 刷新 schema 缓存：在 SQL Editor 执行 `NOTIFY pgrst, 'reload schema';`

然后就可以直接使用表名：
```typescript
// 配置 exposed schemas 后可以直接使用
const { data } = await supabase
  .from('profiles')  // 不需要 schema 前缀
  .select('*')
```

### 2. 授予 Schema 权限

**必须在迁移文件中包含**：
```sql
-- 授予 schema 访问权限
GRANT USAGE ON SCHEMA memoritree TO anon, authenticated;

-- 授予表操作权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA memoritree TO anon, authenticated;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA memoritree TO anon, authenticated;

-- 授予函数执行权限（用于 RLS 策略）
GRANT EXECUTE ON FUNCTION memoritree.user_has_tree_permission(UUID, UUID) TO anon, authenticated;
-- ... 其他函数

-- 为将来创建的表自动授予权限
ALTER DEFAULT PRIVILEGES IN SCHEMA memoritree
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA memoritree
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA memoritree
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
```

---

## RLS 策略与循环引用

### ⚠️ 无限递归问题

**问题**：当 RLS 策略中存在循环引用时，会出现 `infinite recursion detected in policy` 错误。

**示例问题场景**：
```sql
-- ❌ 错误：trees 表的策略查询 tree_permissions
CREATE POLICY "Users can view shared trees" ON memoritree.trees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memoritree.tree_permissions
            WHERE tree_permissions.tree_id = trees.id
        )
    );

-- ❌ 错误：tree_permissions 表的策略查询 trees
CREATE POLICY "Users can view permissions" ON memoritree.tree_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memoritree.trees
            WHERE trees.id = tree_permissions.tree_id
        )
    );
```

这会导致循环：查询 trees → 检查 tree_permissions → 检查 trees → ...

### ✅ 解决方案：使用 SECURITY DEFINER 函数

**创建辅助函数**：
```sql
-- 使用 SECURITY DEFINER 绕过 RLS，避免循环引用
CREATE OR REPLACE FUNCTION memoritree.user_has_tree_permission(tree_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- 关键：以函数所有者权限运行，绕过 RLS
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM memoritree.tree_permissions
        WHERE tree_permissions.tree_id = tree_uuid
        AND tree_permissions.user_id = user_uuid
    );
END;
$$;

-- 在策略中使用函数
CREATE POLICY "Users can view shared trees" ON memoritree.trees
    FOR SELECT USING (
        memoritree.user_has_tree_permission(memoritree.trees.id, auth.uid())
    );
```

**关键点**：
- `SECURITY DEFINER`：函数以函数所有者的权限运行，绕过 RLS
- 函数内部的查询不会触发 RLS 策略，从而打破循环
- 必须授予函数执行权限：`GRANT EXECUTE ON FUNCTION ... TO anon, authenticated;`

---

## 认证与 Cookie 处理

### 1. Middleware 配置

**必须创建 middleware.ts** 来刷新 session：

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 刷新 session（关键步骤）
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. 客户端和服务端客户端

**客户端（Browser）**：
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**服务端（Server Components）**：
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中无法设置 cookie，由 middleware 处理
          }
        },
      },
    }
  )
}
```

### 3. 登录后重定向

**使用 `window.location.href` 而不是 `router.push()`**：
```typescript
// ✅ 正确：完整页面跳转，确保 cookie 被正确设置
if (!error) {
  window.location.href = '/dashboard'
}

// ❌ 错误：可能 cookie 还未设置完成
if (!error) {
  router.push('/dashboard')
  router.refresh()
}
```

---

## 常见错误与解决方案

### 1. PGRST116: "Cannot coerce the result to a single JSON object"

**原因**：使用 `.single()` 但查询返回 0 行

**解决方案**：使用 `.maybeSingle()` 代替 `.single()`
```typescript
// ❌ 错误
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()  // 如果没有记录会报错

// ✅ 正确
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .maybeSingle()  // 没有记录返回 null，不会报错
```

### 2. "relation does not exist" 或 "schema cache" 错误

**原因**：
- Schema 未正确配置
- 权限未授予
- Schema 缓存未刷新

**解决方案**：
1. 确保使用 `.schema('memoritree')` 方法
2. 确保执行了 GRANT 语句
3. 如果使用 exposed schemas，执行 `NOTIFY pgrst, 'reload schema';`

### 3. 触发器已存在错误

**错误**：`trigger "xxx" for relation "yyy" already exists`

**解决方案**：在创建触发器前先删除
```sql
-- ✅ 正确
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION memoritree.handle_new_user();
```

### 4. RLS 策略导致无法读取插入的数据

**问题**：插入成功但 `.select()` 返回 null

**原因**：RLS 策略不允许读取刚插入的数据

**解决方案**：
1. 检查 RLS 策略是否正确
2. 使用 `.maybeSingle()` 处理 null 情况
3. 确保策略中的条件正确（如 `auth.uid() = id`）

### 5. 307 重定向循环

**原因**：
- Middleware 未正确刷新 session
- Cookie 未正确设置
- 服务端无法读取认证状态

**解决方案**：
1. 确保 middleware.ts 存在并正确配置
2. 确保使用最新版本的 @supabase/ssr
3. 登录后使用 `window.location.href` 进行完整页面跳转

---

## 最佳实践总结

1. **版本管理**：
   - ✅ 始终使用最新版本的 `@supabase/ssr`（当前 0.7.0+）
   - ✅ 定期更新依赖

2. **Schema 处理**：
   - ✅ 优先使用 `.schema('memoritree')` 方法
   - ✅ 确保授予所有必要的权限（USAGE, SELECT, INSERT, UPDATE, DELETE, EXECUTE）

3. **RLS 策略**：
   - ✅ 使用 `SECURITY DEFINER` 函数避免循环引用
   - ✅ 为所有函数授予执行权限
   - ✅ 测试策略是否允许必要的操作

4. **认证流程**：
   - ✅ 必须配置 middleware 刷新 session
   - ✅ 登录后使用完整页面跳转
   - ✅ 服务端和客户端使用不同的客户端创建方法

5. **错误处理**：
   - ✅ 使用 `.maybeSingle()` 而不是 `.single()`
   - ✅ 添加详细的错误日志
   - ✅ 提供用户友好的错误提示

6. **迁移文件**：
   - ✅ 使用 `DROP TRIGGER IF EXISTS` 避免重复创建
   - ✅ 使用 `CREATE OR REPLACE FUNCTION` 更新函数
   - ✅ 确保所有权限和策略都在迁移文件中

---

## 调试技巧

1. **添加日志**：
   ```typescript
   console.log('[Middleware] User check:', {
     hasUser: !!user,
     userEmail: user?.email,
     error: error?.message
   })
   ```

2. **检查 Cookie**：
   ```typescript
   console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => c.name))
   ```

3. **验证 Schema**：
   - 在 Supabase SQL Editor 中直接查询表
   - 检查 RLS 策略是否正确应用

4. **测试权限**：
   - 使用 Supabase Dashboard 的 Table Editor
   - 检查不同用户角色的访问权限

---

## 参考资源

- [Supabase SSR 文档](https://supabase.com/docs/guides/auth/server-side)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [@supabase/ssr GitHub](https://github.com/supabase/ssr)

---

**最后更新**：2025-11-18  
**维护者**：MemoriTree 开发团队

