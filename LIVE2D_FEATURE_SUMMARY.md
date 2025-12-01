# Live2D 数字人功能实现总结

## 功能概述

为课件播放器添加了 Live2D 数字人功能，用户可以通过工具页面的开关来控制数字人的显示/隐藏。数字人会显示在屏幕左下角。

## 实现内容

### 1. 依赖安装

安装了以下包：
- `pixi.js@7.4.3` - 2D 渲染引擎
- `pixi-live2d-display-lipsyncpatch@0.5.0-ls-8` - Live2D 显示库

### 2. 新增文件

#### src/components/Live2DWidget.tsx
Live2D 数字人组件，主要功能：
- 使用 PixiJS 渲染 Live2D 模型
- 支持模型交互（点击触发动作）
- 显示加载状态和错误提示
- 可通过关闭按钮隐藏
- 固定在左下角显示（300x400 像素）

#### src/types/pixi-live2d.d.ts
TypeScript 类型声明文件，为 Live2D 库提供类型支持。

#### docs/Live2D使用说明.md
详细的使用说明文档。

### 3. 修改文件

#### src/components/player/PlayerDrawer.tsx
在播放器设置抽屉中添加：
- 新增 `showLive2D` 和 `onShowLive2DChange` props
- 在"显示设置"部分添加"显示数字人"开关
- 将设置保存到 localStorage

#### src/components/player/PlayerControls.tsx
集成 Live2D 组件：
- 导入 `Live2DWidget` 组件
- 添加 `showLive2D` 状态管理
- 从 localStorage 读取/保存设置
- 将 Live2D 组件添加到渲染树中

## 功能特性

✅ 点击工具按钮即可开启/关闭数字人显示
✅ 数字人显示在左下角，不遮挡课件内容
✅ 带有半透明背景和模糊效果，视觉效果美观
✅ 支持点击交互，可触发动作
✅ 状态持久化，设置会保存在浏览器中
✅ 加载状态和错误提示，用户体验友好
✅ 可独立关闭按钮，操作灵活

## 使用流程

1. 用户进入课件播放页面
2. 点击右上角工具按钮（⚙️）
3. 在"显示设置"中打开"显示数字人"开关
4. 左下角会出现 Live2D 数字人
5. 可通过以下方式关闭：
   - 点击数字人窗口的 × 按钮
   - 在设置中关闭"显示数字人"开关

## 技术架构

```
PlayerControls (播放器控制)
├── FloatingToolButton (工具按钮)
├── PlayerDrawer (设置抽屉)
│   └── 显示数字人开关
└── Live2DWidget (数字人组件)
    ├── PixiJS Application
    └── Live2D Model
```

## 自定义模型

当前使用的是公开的示例模型。如需替换：

1. 准备符合 Live2D Cubism SDK 规范的模型文件
2. 上传到可访问的服务器
3. 修改 `src/components/Live2DWidget.tsx` 中的 `modelUrl`

```typescript
const modelUrl = 'https://your-model-url.com/model.model.json';
```

## 兼容性

- ✅ Chrome/Edge (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ 现代浏览器支持 WebGL

## 性能考虑

- Live2D 模型会占用 GPU 资源
- 建议在性能较好的设备上使用
- 可以随时关闭以释放资源

## 后续优化建议

1. **多模型支持**：允许用户选择不同的数字人角色
2. **语音同步**：集成语音识别，让数字人的嘴型与语音同步
3. **智能对话**：集成 AI 对话系统，让数字人可以回答问题
4. **自定义位置**：允许用户拖拽调整数字人的显示位置
5. **自定义大小**：支持调整数字人窗口大小
6. **动作库**：预设多个动作，用户可手动触发
7. **表情库**：预设多个表情，用户可手动切换

## 测试建议

1. 测试开关功能是否正常
2. 测试状态持久化（刷新页面后设置是否保留）
3. 测试不同浏览器的兼容性
4. 测试网络异常情况下的错误提示
5. 测试与其他功能（倒计时、点名等）的兼容性

## 相关链接

- [PixiJS 官方文档](https://pixijs.com/)
- [pixi-live2d-display GitHub](https://github.com/guansss/pixi-live2d-display)
- [Live2D Cubism SDK](https://www.live2d.com/en/sdk/)

