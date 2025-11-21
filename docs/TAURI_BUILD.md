# Tauri 打包说明

## 概述

本项目使用 Tauri 将课件播放框架打包成桌面应用程序。支持从外部 GitHub 仓库获取课件并打包成可执行文件。

## 本地开发

### 前置要求

1. **Node.js** (v18 或更高版本)
2. **Rust** (最新稳定版)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **系统依赖** (根据操作系统)

   **macOS:**
   ```bash
   # 无需额外依赖
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install -y libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libxdo-dev \
     libssl-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

   **Windows:**
   - 安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

这将启动开发服务器，并打开 Tauri 窗口。

### 构建应用

```bash
npm run tauri:build
```

构建产物将位于 `src-tauri/target/release/` 目录。

## 使用 GitHub Actions 自动构建

### 方式一：手动触发 (推荐)

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **构建 Tauri 应用** workflow
3. 点击 **Run workflow**
4. 填写参数：
   - **courseware_repo**: 课件仓库地址，格式为 `owner/repo` (例如: `username/courseware-repo`)
   - **courseware_branch**: 课件仓库分支 (默认: `main`)
   - **courseware_folder**: 课件文件夹路径，相对于仓库根目录 (可选，留空则下载整个仓库)

5. 点击 **Run workflow** 开始构建

### 方式二：自动触发

当以下文件发生变更时，workflow 会自动触发：
- `src-tauri/**`
- `src/**`
- `package.json`
- `.github/workflows/build-tauri.yml`

### 构建产物

构建完成后，可在 **Releases** 页面下载：
- **macOS**: `.dmg` 文件 (Intel 和 Apple Silicon)
- **Windows**: `.msi` 安装包
- **Linux**: `.AppImage` 或 `.deb` 包

## 课件仓库要求

### 仓库结构

课件仓库应包含以下内容：

```
courseware-repo/
├── manifest.json          # 课件清单文件
├── 课件组1/
│   ├── 课件1.html
│   ├── 课件2.html
│   └── 资源文件夹/
│       └── audio.mp3
└── 课件组2/
    └── 课件3.html
```

### manifest.json 格式

```json
{
  "groups": [
    {
      "id": "课件组1",
      "name": "课件组1",
      "files": [
        "课件组1/课件1.html",
        "课件组1/课件2.html"
      ]
    }
  ]
}
```

## 配置说明

### Tauri 配置

主要配置文件位于 `src-tauri/tauri.conf.json`：

- **productName**: 应用名称
- **identifier**: 应用唯一标识符
- **build.devPath**: 开发模式下的前端地址
- **build.distDir**: 构建后的前端文件目录
- **app.windows**: 窗口配置（大小、标题等）
- **bundle**: 打包配置（图标、资源等）

### 图标文件

将应用图标放置在 `src-tauri/icons/` 目录：

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## 常见问题

### 1. 构建失败：找不到 Rust 工具链

确保已安装 Rust：
```bash
rustup install stable
rustup default stable
```

### 2. macOS 构建失败：缺少系统依赖

Tauri 在 macOS 上通常不需要额外依赖。如果遇到问题，确保 Xcode Command Line Tools 已安装：
```bash
xcode-select --install
```

### 3. Linux 构建失败：缺少 WebKit 依赖

安装 WebKit 开发库：
```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

### 4. Windows 构建失败：缺少 MSVC

安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 5. GitHub Actions 构建失败：下载课件超时

- 检查课件仓库地址是否正确
- 检查仓库是否为公开仓库（私有仓库需要配置 token）
- 检查网络连接

## 高级配置

### 自定义打包参数

在 `src-tauri/tauri.conf.json` 中可以配置：

- 应用图标
- 应用类别
- 版权信息
- 外部二进制文件
- 资源文件

### 环境变量

构建时可以使用以下环境变量：

- `TAURI_DEBUG`: 启用调试模式
- `TAURI_PLATFORM`: 目标平台

## 相关文档

- [Tauri 官方文档](https://tauri.app/)
- [Tauri GitHub Actions](https://github.com/tauri-apps/tauri-action)

