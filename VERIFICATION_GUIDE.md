# 刷新白屏问题验证指南

## ✅ 已完成的修复

1. **修改 `vite.config.ts`**：
   - 根据环境变量 `TAURI_PLATFORM` 动态设置 `base` 路径
   - Web 构建使用绝对路径 `'/'`
   - Tauri 构建使用相对路径 `'./'`

2. **修复 `postcss.config.js`**：
   - 改用 CommonJS 语法 `module.exports`

3. **验证构建产物**：
   - 资源路径已改为绝对路径（`/assets/xxx.js`）
   - 构建成功，没有错误

## 🧪 验证步骤

### 1. 本地验证

预览服务器已启动（端口 4173），可以进行以下测试：

```bash
# 如果预览服务器未启动，运行：
npm run preview
```

### 2. 测试场景

在浏览器中测试以下场景：

#### 场景 1：首页路由
1. 访问 `http://localhost:4173/`
2. 刷新页面 ✅ 应该正常

#### 场景 2：配置页面
1. 访问 `http://localhost:4173/config`
2. 刷新页面 ✅ 应该正常，不应该白屏

#### 场景 3：课件页面（深层路由）
1. 打开任意课件，例如 `http://localhost:4173/abc123def456.../1`
2. **刷新页面** ✅ **应该正常，不应该白屏**
3. 检查浏览器控制台 ✅ 不应该有 MIME type 错误

#### 场景 4：直接访问深层路由
1. 在浏览器地址栏直接输入课件 URL（例如 `http://localhost:4173/abc123def456.../1`）
2. 按回车访问 ✅ 应该正常加载

### 3. 检查构建产物

```bash
# 查看资源路径
cat dist/index.html | grep -E "(href|src)="
```

预期输出应包含**绝对路径**：
```html
<script type="module" crossorigin src="/assets/index-xxx.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-xxx.css">
```

✅ 注意路径以 `/` 开头（绝对路径），不是 `./`（相对路径）

### 4. 浏览器开发者工具检查

1. 打开课件页面
2. 刷新页面
3. 打开浏览器开发者工具（F12）
4. 切换到 "Network" 标签
5. 检查 JavaScript 文件的请求：
   - ✅ 请求路径应该是 `/assets/index-xxx.js`
   - ✅ 响应状态应该是 200
   - ✅ Content-Type 应该是 `application/javascript` 或 `text/javascript`

## 🚀 部署验证

部署到生产环境后，进行相同的测试：

1. 访问任意深层路由
2. 刷新页面
3. 检查是否正常显示（不应该白屏）
4. 检查浏览器控制台（不应该有 MIME type 错误）

## 📋 部署清单

- [x] 修改 `vite.config.ts`
- [x] 修复 `postcss.config.js`
- [x] 运行 `npm install`
- [x] 运行 `npm run build`
- [x] 验证资源路径为绝对路径
- [ ] 部署到生产环境
- [ ] 在生产环境测试路由刷新

## 🔧 故障排除

### 如果仍然白屏

1. **清除浏览器缓存**：
   - 按 Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (Mac)
   - 或在开发者工具中勾选 "Disable cache"

2. **检查服务器配置**：
   - 确保服务器配置了 SPA 路由重定向
   - Netlify/Vercel：应自动配置
   - Nginx：检查 `try_files $uri $uri/ /index.html;`
   - Apache：检查 `.htaccess` 文件

3. **检查构建产物**：
   ```bash
   cat dist/index.html | grep -E "src="
   ```
   - 确认路径以 `/` 开头（不是 `./`）

4. **检查环境变量**：
   - Web 构建不应设置 `TAURI_PLATFORM` 环境变量
   - 如果设置了，移除后重新构建

## 📚 相关文档

- `REFRESH_WHITE_SCREEN_FIX.md` - 问题详细说明和修复方案
- `docs/路由和部署说明.md` - 路由配置说明
- `README_DEPLOY.md` - 部署指南

## ✨ 预期结果

✅ 所有路由刷新都正常
✅ 不再出现白屏
✅ 不再出现 MIME type 错误
✅ Tauri 桌面应用构建不受影响

