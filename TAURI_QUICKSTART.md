# Tauri 打包快速开始

## 使用 GitHub Actions 打包（推荐）

### 步骤 1: 准备课件仓库

确保你的课件仓库是公开的，或者配置了访问权限。

### 步骤 2: 触发构建

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **构建 Tauri 应用** workflow
3. 点击 **Run workflow**
4. 填写参数：
   - **courseware_repo**: 课件仓库，格式 `owner/repo`（例如：`username/courseware-repo`）
   - **courseware_branch**: 分支名（默认：`main`）
   - **courseware_folder**: 课件文件夹路径（可选，留空则下载整个仓库）
   - **构建平台**（可多选）：
     - ☑️ **构建 macOS (Apple Silicon)**: 构建 Apple Silicon 版本
     - ☑️ **构建 macOS (Intel)**: 构建 Intel 版本
     - ☑️ **构建 Windows**: 构建 Windows 版本
     - ☑️ **构建 Linux**: 构建 Linux 版本

5. 勾选需要构建的平台，然后点击 **Run workflow** 开始构建

### 步骤 3: 下载构建产物

构建完成后（约 10-30 分钟），在 **Releases** 页面下载：
- **macOS**: `.dmg` 文件
- **Windows**: `.msi` 安装包  
- **Linux**: `.AppImage` 或 `.deb` 包

## 本地开发（可选）

如果你想在本地测试 Tauri 应用：

### 安装 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

### 本地构建

```bash
npm run tauri:build
```

## 注意事项

1. **图标文件**: 需要将应用图标放置在 `src-tauri/icons/` 目录，否则构建可能失败
2. **课件仓库**: 必须是公开仓库，或配置 GitHub Token
3. **构建时间**: 首次构建需要下载 Rust 工具链，可能需要较长时间

## 更多信息

详细文档请参考：[docs/TAURI_BUILD.md](docs/TAURI_BUILD.md)

