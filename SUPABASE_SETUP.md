# Supabase 配置指南

本文档详细说明如何配置Supabase以支持Reedu课件系统的账号和数据库功能。

## 步骤1: 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 注册或登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息:
   - **Name**: reedu-coursewares (或其他名称)
   - **Database Password**: 设置一个强密码
   - **Region**: 选择离您最近的区域
5. 等待项目创建完成 (约1-2分钟)

## 步骤2: 获取API密钥

1. 在项目面板中,点击左侧菜单的 "Settings" → "API"
2. 找到以下信息:
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon/public key**: 一长串字符串
3. 复制这两个值

## 步骤3: 配置环境变量

在项目根目录创建 `.env` 文件:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
```

**注意**: 
- 不要提交 `.env` 文件到Git仓库
- `.env.example` 文件可以作为模板

## 步骤4: 创建数据库表

1. 在Supabase项目面板中,点击左侧菜单的 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 粘贴到SQL编辑器
5. 点击 "Run" 执行SQL

执行成功后,会创建以下表:
- `user_repos` - 用户仓库表
- `public_coursewares` - 公开课件表
- `courseware_likes` - 点赞记录表

以及相关的:
- 索引 (提高查询性能)
- 触发器 (自动更新统计数据)
- RLS策略 (行级安全策略)

## 步骤5: 验证配置

### 5.1 检查表是否创建成功

1. 在Supabase面板中,点击 "Table Editor"
2. 应该能看到以下表:
   - user_repos
   - public_coursewares
   - courseware_likes

### 5.2 测试认证功能

1. 启动开发服务器: `npm run dev`
2. 访问 `/auth` 页面
3. 尝试注册一个账号
4. 检查是否收到验证邮件

### 5.3 检查邮件模板 (可选)

1. 在Supabase面板中,点击 "Authentication" → "Email Templates"
2. 可以自定义邮件模板:
   - Confirm signup (确认注册)
   - Reset password (重置密码)
   - etc.

## 步骤6: 配置认证设置

### 6.1 启用邮箱认证

1. 在Supabase面板中,点击 "Authentication" → "Providers"
2. 确保 "Email" 提供商已启用
3. 配置选项:
   - **Enable email signup**: 勾选
   - **Confirm email**: 勾选 (推荐)
   - **Secure email change**: 勾选 (推荐)

### 6.2 配置站点URL

1. 在 "Authentication" → "URL Configuration" 中
2. 设置 **Site URL**: 
   - 开发环境: `http://localhost:5173`
   - 生产环境: `https://yourdomain.com`
3. 添加 **Redirect URLs**:
   - `http://localhost:5173/auth/callback` (开发)
   - `https://yourdomain.com/auth/callback` (生产)

## 步骤7: 配置Row Level Security (RLS)

RLS已在 `supabase-schema.sql` 中自动配置,但您可以检查:

1. 点击 "Authentication" → "Policies"
2. 检查各表的策略:
   - **user_repos**: 用户只能访问自己的仓库
   - **public_coursewares**: 所有人可查看公开课件,用户可管理自己的
   - **courseware_likes**: 用户可查看所有点赞,但只能管理自己的

## 步骤8: 数据库函数 (可选)

如果需要增加浏览次数统计,创建以下函数:

```sql
CREATE OR REPLACE FUNCTION increment_view_count(courseware_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public_coursewares
  SET views_count = views_count + 1
  WHERE id = courseware_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

在SQL Editor中执行上述SQL。

## 步骤9: 测试完整流程

1. **注册用户**:
   - 访问 `/auth`
   - 注册新账号
   - 验证邮箱

2. **绑定仓库**:
   - 登录后访问 `/config`
   - 在"我的仓库"中添加仓库

3. **发布课件**:
   - 在"我的公开课件"中发布课件
   - 设置为公开

4. **测试广场**:
   - 访问 `/square`
   - 查看已发布的课件
   - 测试点赞功能

## 步骤10: 生产环境配置

### 10.1 Vercel部署

在Vercel项目设置中添加环境变量:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 10.2 其他平台

确保在部署平台的环境变量中设置相同的变量。

## 常见问题

### Q: 注册后没有收到验证邮件?
A: 检查:
1. Supabase的邮件配置是否正确
2. 邮箱地址是否有效
3. 垃圾邮件文件夹
4. Supabase免费版有邮件发送限制

解决方案:
- 在Supabase面板中配置自定义SMTP服务器
- 或者在开发时暂时禁用邮箱验证

### Q: RLS策略导致无法访问数据?
A: 
1. 检查是否已登录
2. 在SQL Editor中临时禁用RLS测试: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
3. 检查策略是否正确配置

### Q: API请求失败?
A: 检查:
1. SUPABASE_URL和ANON_KEY是否正确
2. 浏览器控制台的网络请求
3. Supabase项目是否暂停 (免费版长时间不用会暂停)

### Q: 如何查看数据库内容?
A: 
1. 在Supabase面板中使用 "Table Editor"
2. 或在 "SQL Editor" 中运行查询: `SELECT * FROM table_name;`

### Q: 如何重置数据库?
A:
1. 在 "SQL Editor" 中运行:
```sql
DROP TABLE IF EXISTS courseware_likes CASCADE;
DROP TABLE IF EXISTS public_coursewares CASCADE;
DROP TABLE IF EXISTS user_repos CASCADE;
```
2. 重新执行 `supabase-schema.sql`

## 安全建议

1. **不要泄露密钥**: 
   - 不要将 `.env` 文件提交到Git
   - 不要在客户端代码中硬编码密钥

2. **使用RLS**: 
   - 确保所有表都启用了RLS
   - 定期检查策略是否正确

3. **定期备份**: 
   - Supabase提供自动备份功能
   - 也可以手动导出数据

4. **监控使用情况**:
   - 在Supabase面板中查看使用量
   - 免费版有限制,需要时升级

## 参考资源

- [Supabase官方文档](https://supabase.com/docs)
- [Supabase认证指南](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript客户端](https://supabase.com/docs/reference/javascript/introduction)

## 获取帮助

如果遇到问题:
1. 查看Supabase文档
2. 查看浏览器控制台错误信息
3. 在项目仓库提交Issue
4. 访问Supabase Discord社区

