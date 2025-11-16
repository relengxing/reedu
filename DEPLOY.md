# 部署指南

## 快速部署

项目已配置好常见部署平台的路由重定向，**无需额外配置**即可直接部署！

## 支持的部署平台

### ✅ Netlify（自动配置）

1. 将项目推送到GitHub
2. 在Netlify中导入项目
3. 构建命令：`npm run build`
4. 发布目录：`dist`
5. **无需其他配置** - `public/_redirects` 会自动生效

### ✅ Vercel（自动配置）

1. 将项目推送到GitHub
2. 在Vercel中导入项目
3. **无需其他配置** - `vercel.json` 会自动生效

### ✅ Apache服务器（自动配置）

1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录内容上传到服务器
3. **无需其他配置** - `public/.htaccess` 会自动复制到 `dist` 目录

### ⚙️ Nginx（需要手动配置）

1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录内容上传到服务器
3. 参考 `nginx.conf.example` 配置Nginx服务器

**关键配置**：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 验证部署

部署后，测试以下路由是否正常工作：

- ✅ `/` - 首页
- ✅ `/config` - 配置页（刷新不应404）
- ✅ `/{courseId}/0` - 课程页面（刷新不应404）

如果所有路由都能正常访问和刷新，说明配置成功！

## 常见问题

### Q: 部署后刷新页面还是404？

**A:** 检查以下几点：

1. **Netlify/Vercel**：确保配置文件在正确位置
   - Netlify：`public/_redirects` 应该在项目根目录的 `public` 文件夹中
   - Vercel：`vercel.json` 应该在项目根目录

2. **Apache**：确保服务器启用了 `mod_rewrite` 模块
   ```bash
   # 检查是否启用
   apache2ctl -M | grep rewrite
   ```

3. **Nginx**：确保配置了 `try_files` 指令

4. **构建后检查**：检查 `dist` 目录是否包含配置文件
   - `dist/_redirects` (Netlify)
   - `dist/.htaccess` (Apache)

### Q: 如何测试本地构建？

**A:** 使用Vite预览模式：
```bash
npm run build
npm run preview
```

然后在浏览器中测试各个路由。

## 文件说明

- `public/_redirects` - Netlify重定向规则
- `vercel.json` - Vercel重写规则
- `public/.htaccess` - Apache重写规则
- `nginx.conf.example` - Nginx配置示例

所有这些文件都会在构建时自动处理，无需手动操作。

