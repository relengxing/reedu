# 变更日志 - 刷新白屏问题修复

## 日期：2025-12-02

## 问题描述
打开课件后刷新页面会出现白屏，浏览器控制台显示错误：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html".
```

## 修复内容

### 1. 修改文件：`vite.config.ts`

**修改前**：
```typescript
base: './',
```

**修改后**：
```typescript
// Tauri 需要设置 base 为相对路径，Web 部署需要绝对路径
// 使用环境变量 TAURI_PLATFORM 来判断是否为 Tauri 构建
base: process.env.TAURI_PLATFORM ? './' : '/',
```

**原因**：
- 相对路径 `'./'` 适用于 Tauri 桌面应用
- Web 部署需要绝对路径 `'/'` 以确保深层路由刷新时资源路径正确
- 根据环境变量 `TAURI_PLATFORM` 自动选择正确的配置

### 2. 修改文件：`postcss.config.js`

**修改前**：
```javascript
export default { ... }
```

**修改后**：
```javascript
module.exports = { ... }
```

**原因**：
- PostCSS 配置文件需要使用 CommonJS 语法
- 修复构建时的模块加载错误

### 3. 更新文件：`package.json`

**添加**：
```json
"build:web": "vite build",
```

**原因**：
- 提供明确的 Web 构建命令
- 便于区分 Web 构建和 Tauri 构建

### 4. 更新文件：`README.md`

**添加**：
- "常见问题" 部分
- 刷新白屏问题的说明和解决方案
- 部署后路由404问题的说明

## 新增文档

### 1. `刷新白屏修复总结.md`
简洁的中文修复总结，包含：
- 问题说明
- 根本原因
- 修复内容
- 测试验证
- 部署命令

### 2. `REFRESH_WHITE_SCREEN_FIX.md`
详细的英文修复说明，包含：
- 问题原因的技术细节
- 修复方案的实现原理
- 构建命令说明
- 验证步骤

### 3. `VERIFICATION_GUIDE.md`
完整的验证指南，包含：
- 本地验证步骤
- 测试场景清单
- 浏览器开发者工具检查方法
- 故障排除指南

### 4. `CHANGELOG_REFRESH_FIX.md`（本文件）
详细的变更日志

## 影响范围

### ✅ 已修复
- Web 部署时刷新页面白屏问题
- 深层路由（如 `/abc123/1`）刷新失败问题
- JavaScript 模块 MIME type 错误

### ✅ 不受影响
- Tauri 桌面应用构建
- 开发模式（`npm run dev`）
- 现有功能和特性

### ✅ 兼容性
- 向后兼容，不影响现有代码
- 自动根据构建目标选择配置
- 无需修改部署流程

## 测试验证

### 构建测试
```bash
npm install
npm run build
✅ 构建成功
✅ 资源路径使用绝对路径（/assets/xxx.js）
```

### 预览测试
```bash
npm run preview
✅ 预览服务器启动成功（端口 4173）
✅ 可以访问所有路由
✅ 刷新任意路由都正常
```

### 文件验证
```bash
cat dist/index.html | grep -E "src="
✅ 输出：src="/assets/index-xxx.js"（绝对路径）
```

## 部署建议

### Web 部署
```bash
npm run build
# 或
npm run build:web
```

然后将 `dist` 目录部署到：
- Netlify（零配置）
- Vercel（零配置）
- Nginx（参考 nginx.conf.example）
- Apache（使用 .htaccess）

### Tauri 构建
```bash
npm run tauri:build
```

不受此次修复影响，继续使用相对路径。

## 回归测试清单

- [x] Web 构建成功
- [x] 资源路径正确（绝对路径）
- [x] 预览服务器运行正常
- [x] 首页正常显示
- [x] 配置页刷新正常
- [x] 课件页刷新正常
- [x] 深层路由刷新正常
- [x] 浏览器控制台无错误
- [x] 无 linter 错误
- [x] Tauri 构建不受影响

## 相关 Issue

此修复解决了用户报告的刷新白屏问题，根本原因是 Vite 配置的相对路径导致深层路由刷新时资源加载失败。

## 后续工作

- [ ] 在生产环境验证修复
- [ ] 监控部署后的错误日志
- [ ] 收集用户反馈

## 贡献者

- 修复：AI Assistant
- 报告：User

---

**修复状态**：✅ 已完成并验证
**测试状态**：✅ 本地测试通过
**文档状态**：✅ 已更新

