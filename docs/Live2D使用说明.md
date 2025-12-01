# Live2D 数字人功能使用说明

## 功能简介

在课件播放器中添加了 Live2D 数字人功能，可以在播放课件时显示一个可交互的数字人角色。

## 使用方法

### 1. 开启数字人显示

1. 进入课件播放页面
2. 点击右上角的工具按钮（⚙️图标）
3. 在弹出的"播放器设置"抽屉中，找到"显示设置"部分
4. 打开"显示数字人"开关

### 2. 选择数字人模型

打开"显示数字人"后，会出现模型选择下拉框，提供以下模型：

- **Haru - 打招呼**：活泼的女孩，会挥手打招呼
- **Shizuku - 经典**：经典的看板娘形象
- **Hijiki - 可爱**：可爱的小猫娘
- **Miku - 初音未来**：著名的虚拟偶像

选择不同的模型后，数字人会自动切换。

### 3. 拖动数字人位置

- 💡 **按住数字人的任意位置**可以拖动
- 松开鼠标即可固定在新位置
- 位置会自动保存，刷新页面后保持不变
- 默认显示在屏幕左下角

### 4. 数字人显示特性

- 显示区域大小：300x400 像素
- **纯透明背景**，只显示数字人角色
- 不会遮挡课件内容
- 关闭按钮位于右上角

### 5. 关闭数字人

有两种方式关闭数字人：

1. **通过关闭按钮**：点击数字人右上角的 × 按钮
2. **通过设置面板**：在播放器设置中关闭"显示数字人"开关

### 6. 数字人交互

- 可以点击数字人的身体部位触发动作
- 数字人会自动播放待机动画
- 支持表情和动作切换（如果模型支持）

## 技术特性

- **基于 PixiJS 7.4.3** 和 **pixi-live2d-display** 实现
- 自动加载默认的 Live2D 模型
- 支持自定义模型（需要修改代码中的模型 URL）
- 状态持久化：设置会保存在浏览器本地存储中

## 添加自定义模型

如果您想添加更多 Live2D 模型到选择列表：

1. 打开 `src/components/player/PlayerDrawer.tsx` 文件
2. 找到 `LIVE2D_MODELS` 数组（约第 10 行）
3. 添加新的模型配置
4. 保存文件，Vite 会自动热重载

```typescript
export const LIVE2D_MODELS = [
  // 现有模型...
  {
    label: '你的模型名称',
    value: 'https://your-domain.com/path/to/model.model.json',
  },
];
```

**注意**：模型 URL 必须支持 CORS 跨域访问，否则无法加载。

## 常见问题

### Q: 数字人加载失败怎么办？

A: 可能的原因：
- 网络连接问题
- 模型文件 URL 无效
- CORS 跨域限制

请检查浏览器控制台的错误信息。

### Q: 数字人显示很卡怎么办？

A: Live2D 模型会占用一定的 GPU 资源，如果设备性能较低，可以：
- 关闭数字人显示
- 使用更简单的模型
- 减少同时运行的其他程序

### Q: 可以更换数字人角色吗？

A: 可以，按照"自定义模型"部分的说明替换模型 URL 即可。确保模型文件格式符合 Live2D Cubism SDK 规范。

## 文件说明

- `src/components/Live2DWidget.tsx` - Live2D 组件主文件
- `src/components/player/PlayerDrawer.tsx` - 播放器设置面板
- `src/components/player/PlayerControls.tsx` - 播放器控制组件
- `src/types/pixi-live2d.d.ts` - TypeScript 类型定义

## 依赖包

```json
{
  "pixi.js": "^7.4.3",
  "pixi-live2d-display-lipsyncpatch": "^0.5.0-ls-8"
}
```

## 开发建议

如果需要扩展功能，可以参考以下 API：

- `model.motion(group, index)` - 播放动作
- `model.expression(name)` - 切换表情
- `model.on('hit', callback)` - 监听点击事件

详细 API 文档请参考：https://github.com/guansss/pixi-live2d-display

