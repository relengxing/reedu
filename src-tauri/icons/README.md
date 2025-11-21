# 应用图标

请将以下图标文件放置在此目录：

- `32x32.png` - 32x32 像素 PNG 图标
- `128x128.png` - 128x128 像素 PNG 图标
- `128x128@2x.png` - 256x256 像素 PNG 图标（Retina）
- `icon.icns` - macOS 图标文件
- `icon.ico` - Windows 图标文件

## 生成图标

可以使用在线工具或命令行工具生成：

### 使用 ImageMagick (如果已安装)

```bash
# 从单个 PNG 生成所有尺寸
convert icon.png -resize 32x32 32x32.png
convert icon.png -resize 128x128 128x128.png
convert icon.png -resize 256x256 128x128@2x.png
```

### 使用在线工具

- [Tauri Icon Generator](https://tauri.app/guides/features/icons)
- [CloudConvert](https://cloudconvert.com/)

### macOS 图标

```bash
# 从 PNG 生成 ICNS
iconutil -c icns icon.iconset
```

### Windows 图标

可以使用在线工具将 PNG 转换为 ICO 格式。

## 临时占位符

如果暂时没有图标，可以创建简单的占位符图标，或者从 Tauri 示例中复制。

