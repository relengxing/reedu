# 刷新白屏问题修复说明

## 问题描述

打开课件后刷新页面会出现白屏，浏览器控制台显示错误：

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

## 问题原因

这是由于 Vite 配置中 `base` 设置为相对路径 `'./'` 导致的。相对路径适用于 Tauri 桌面应用，但在 Web 部署时会导致深层路由刷新失败。

### 详细说明

1. **首次访问** `/abc123/1` 时：
   - 服务器返回 `index.html`（通过重定向规则）
   - 应用正常加载和渲染

2. **刷新页面** `/abc123/1` 时：
   - 服务器返回 `index.html`（通过重定向规则）✅
   - 但浏览器从当前路径 `/abc123/1` 开始解析相对路径的资源
   - `./assets/index-xxx.js` 被解析为 `/abc123/assets/index-xxx.js` ❌
   - 这个路径不存在，服务器又返回 `index.html`（HTML 类型）
   - 浏览器期望 JavaScript 模块，却收到 HTML 内容 ❌
   - 报错：MIME type 不匹配

## 修复方案

修改 `vite.config.ts`，根据构建目标动态设置 `base`：

```typescript
// Tauri 需要设置 base 为相对路径，Web 部署需要绝对路径
// 使用环境变量 TAURI_PLATFORM 来判断是否为 Tauri 构建
base: process.env.TAURI_PLATFORM ? './' : '/',
```

### 原理

- **Tauri 构建**：`TAURI_PLATFORM` 环境变量存在，使用相对路径 `'./'`
- **Web 构建**：`TAURI_PLATFORM` 环境变量不存在，使用绝对路径 `'/'`
- **绝对路径**：无论从哪个路由刷新，资源路径始终从根路径开始（如 `/assets/index-xxx.js`）

## 构建命令

### Web 部署构建

```bash
npm run build
# 或
npm run build:web
```

这会自动使用绝对路径 `'/'`，适合部署到 Netlify、Vercel、Nginx 等。

### Tauri 桌面应用构建

```bash
npm run tauri:build
```

这会自动使用相对路径 `'./'`，适合桌面应用。

## 验证修复

1. 运行 Web 构建：
   ```bash
   npm run build
   ```

2. 本地预览：
   ```bash
   npm run preview
   ```

3. 测试场景：
   - ✅ 访问任意深层路由（如 `/abc123/1`）
   - ✅ 刷新页面（不应白屏）
   - ✅ 直接在浏览器地址栏输入深层路由

4. 检查构建产物：
   ```bash
   cat dist/index.html | grep "script"
   ```
   应该看到类似 `src="/assets/index-xxx.js"` 的绝对路径（以 `/` 开头）。

## 相关文件

- `vite.config.ts` - 修复了 base 路径配置
- `public/_redirects` - Netlify 重定向规则
- `vercel.json` - Vercel 重写规则
- `docs/路由和部署说明.md` - 路由和部署详细说明

## 注意事项

1. **Web 部署**：始终使用 `npm run build` 或 `npm run build:web`
2. **Tauri 构建**：始终使用 `npm run tauri:build`
3. **开发环境**：`npm run dev` 不受影响，Vite 开发服务器自动支持 History API fallback
4. **服务器配置**：确保服务器配置了 SPA 路由重定向（将所有路由重定向到 `index.html`）

## 已修复

✅ Web 部署时刷新白屏问题已修复
✅ Tauri 桌面应用构建不受影响
✅ 所有路由格式（`/:courseId/:pageIndex`、`/config` 等）均可正常刷新

