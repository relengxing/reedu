# Reedu 课件系统升级说明

## 新增功能概览

本次升级引入了以下重大功能:

### 1. 账号体系 (Supabase)
- 用户注册和登录
- 邮箱验证
- 密码重置
- 会话管理

### 2. 课件仓库管理
- 支持绑定多个Git仓库 (GitHub/Gitee)
- 用户输入简化格式自动转换
  - `https://github.com/user/repo` → 自动转换为raw URL
  - `gitee/user/project` → 自动转换为完整URL
- 按需加载课件,不需要提前加载所有内容
- 仓库绑定后自动加载课件

### 3. 新路由系统
- 支持语义化URL: `/:platform/:owner/:repo/:folder/:course/:pageIndex?`
- 示例: `/github/relengxing/reedu-coursewares/二元一次方程组/上下坡问题/0`
- 支持Gitee和GitHub
- 按需动态加载课件HTML

### 4. 课件广场
- 浏览所有公开课件
- 搜索课件 (标题、描述)
- 排序 (最新、最热、点赞最多)
- 点赞功能
- 浏览次数统计
- 未登录用户可浏览和播放公开课件

### 5. 课件发布管理
- 将课件发布到课件广场
- 编辑课件描述
- 控制课件公开/私密状态
- 查看课件统计数据 (浏览次数、点赞数)
- 删除已发布的课件

### 6. 提示词生成器优化
- 支持4种课件类型:
  - **目录页**: 生成课程目录结构
  - **课件内容**: 生成教学内容
  - **随堂练习**: 生成练习题和答案
  - **课后作业**: 生成难度较高的作业题
- 每种类型有定制化的提示词模板
- 动态调整提示词内容

### 7. UI/UX优化
- 顶部导航栏添加:
  - 课件广场入口
  - 用户头像菜单 (登录/登出)
- 配置页面重构:
  - 我的仓库 (需要登录)
  - 本地上传课件
  - 我的公开课件 (需要登录)
  - 提示词生成器
- 更美观的卡片式布局

## 使用指南

### 配置Supabase

1. 在 [Supabase](https://supabase.com) 创建项目

2. 在Supabase SQL Editor中执行 `supabase-schema.sql` 文件创建数据表

3. 获取项目的URL和ANON KEY

4. 在项目根目录创建 `.env` 文件:
```env
VITE_SUPABASE_URL=你的supabase项目url
VITE_SUPABASE_ANON_KEY=你的supabase_anon_key
```

### 用户注册和登录

1. 访问 `/auth` 页面
2. 选择"注册"标签
3. 填写邮箱和密码 (至少6位)
4. 点击"注册"
5. 查收邮箱验证邮件
6. 验证后即可登录

### 绑定Git仓库

1. 登录后访问"配置" → "我的仓库"标签页
2. 输入仓库URL,支持以下格式:
   - `https://github.com/user/repo`
   - `github/user/repo`
   - `gitee/user/project`
   - `https://gitee.com/user/project`
3. 点击"添加仓库"
4. 系统会自动加载仓库中的课件

### 发布课件到广场

1. 登录后访问"配置" → "我的公开课件"标签页
2. 在"发布课件到广场"部分选择要发布的课件组
3. 点击"发布到广场"
4. 填写课件标题和描述
5. 点击"确定"发布
6. 在"已发布的课件"中可以管理发布的课件

### 浏览课件广场

1. 点击顶部导航栏的"课件广场"
2. 浏览所有公开课件
3. 使用搜索框搜索课件
4. 使用排序选择器切换排序方式
5. 点击课件卡片查看详情或播放
6. 登录用户可以点赞课件

### 使用新的URL格式

访问课件的新URL格式:
```
/github/owner/repo/folder/course/pageIndex
```

示例:
```
/github/relengxing/reedu-coursewares/二元一次方程组/上下坡问题/0
```

系统会自动:
1. 解析URL参数
2. 加载对应仓库的manifest.json
3. 按需加载指定的课件HTML
4. 显示课件内容

### 使用提示词生成器

1. 访问"配置" → "生成提示词"标签页
2. 选择课件类型 (目录页/课件内容/随堂练习/课后作业)
3. 填写具体要求
4. 点击"复制提示词"
5. 将提示词提供给AI模型 (ChatGPT、Claude、Deepseek等)
6. 生成完成后,在"本地上传课件"标签页导入HTML文件

## 权限说明

### 未登录用户
- ✅ 浏览课件广场
- ✅ 播放公开课件
- ✅ 使用本地上传课件功能
- ✅ 使用提示词生成器
- ❌ 绑定Git仓库
- ❌ 发布课件
- ❌ 点赞课件

### 登录用户
- ✅ 所有未登录功能
- ✅ 绑定和管理Git仓库
- ✅ 发布和管理公开课件
- ✅ 点赞课件
- ✅ 查看个人统计数据

## 技术架构

### 前端
- React 18
- TypeScript
- Ant Design
- React Router v6

### 后端服务
- Supabase (认证 + 数据库)
- PostgreSQL (通过Supabase)

### 数据表
- `user_repos` - 用户绑定的仓库
- `public_coursewares` - 公开的课件
- `courseware_likes` - 课件点赞记录

### 路由结构
```
/                    - 首页
/square              - 课件广场
/auth                - 登录/注册
/config              - 配置中心
/catalog             - 课件目录
/player/:cw/:page    - 播放器 (旧格式)
/github/:owner/:repo/* - 动态课件 (GitHub)
/gitee/:owner/:repo/*  - 动态课件 (Gitee)
/:courseId/:page     - 课程播放 (MD5格式)
```

## 部署说明

### 开发环境

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件,填入Supabase配置

# 启动开发服务器
npm run dev
```

### 生产环境

```bash
# 构建
npm run build

# 输出在 dist/ 目录
```

### Vercel部署

1. 在Vercel中导入项目
2. 在环境变量中设置:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 部署

### Nginx部署

参考 `nginx.conf.example` 配置文件。

## 数据库Schema

执行 `supabase-schema.sql` 文件以创建所需的数据表和触发器:

- 用户仓库表
- 公开课件表
- 点赞记录表
- RLS (Row Level Security) 策略
- 触发器 (自动更新点赞数、浏览数)

## 注意事项

1. **Supabase配置**: 必须正确配置Supabase才能使用认证和数据库功能
2. **CORS**: 确保Supabase项目允许来自您的域名的请求
3. **邮箱验证**: 用户注册后需要验证邮箱才能完全使用系统
4. **仓库格式**: 课件仓库必须包含 `manifest.json` 文件
5. **课件格式**: HTML课件必须符合规范 (瀑布式、section标记等)

## 常见问题

### Q: 如何创建符合要求的课件仓库?
A: 参考 `docs/外部课件仓库使用说明.md` 和示例仓库 [reedu-coursewares](https://github.com/relengxing/reedu-coursewares)

### Q: 为什么无法添加仓库?
A: 检查:
1. 仓库URL格式是否正确
2. 仓库是否公开
3. 仓库是否包含manifest.json
4. 是否已登录

### Q: 如何让课件出现在广场?
A: 
1. 确保已登录
2. 先绑定包含课件的仓库
3. 在"我的公开课件"中发布课件
4. 将课件状态设置为"公开"

### Q: 未登录用户能做什么?
A: 可以浏览课件广场、播放公开课件、本地上传课件、使用提示词生成器,但不能绑定仓库、发布课件和点赞。

## 更新日志

### v2.0.0 (当前版本)
- ✨ 新增Supabase账号体系
- ✨ 新增Git仓库管理
- ✨ 新增课件广场
- ✨ 新增课件发布功能
- ✨ 新增点赞和统计
- ✨ 优化提示词生成器 (4种类型)
- ✨ 新增动态路由系统
- ✨ 优化UI和用户体验
- 🔧 重构配置页面
- 🔧 优化课件加载策略 (按需加载)

## 贡献

欢迎提交Issue和Pull Request!

## License

MIT

