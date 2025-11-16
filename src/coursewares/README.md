# 编译期课件导入说明

## 使用方法

1. **放置课件文件**
   - 将HTML课件文件放在 `src/coursewares/` 目录下
   - 文件名可以是任意名称，但必须是 `.html` 扩展名

2. **配置课件顺序（可选但推荐）**
   - 打开 `src/coursewares/index.ts` 文件
   - 在 `coursewareOrder` 数组中按顺序列出课件文件名（不含 `.html` 扩展名）
   - 例如：`['封面页', '第一课', '第二课', '练习1']`
   - 未在列表中的课件会按文件名排序追加到末尾
   - 如果不配置顺序，课件会按文件名自动排序

3. **自动加载和跳转**
   - 应用启动时会自动加载并解析这些课件
   - 如果有编译期导入的课件，应用会自动跳转到目录页
   - 用户无需手动上传，直接可以使用课件

4. **打包**
   - 运行 `npm run build` 时，所有课件会被打包进最终产物
   - 打包后的应用包含所有课件，可以独立运行

## 示例

假设你有以下课件文件：
- `src/coursewares/封面页.html`
- `src/coursewares/第一课.html`
- `src/coursewares/第二课.html`
- `src/coursewares/练习1.html`

在 `src/coursewares/index.ts` 中配置顺序：

```typescript
const coursewareOrder: string[] = [
  '封面页',
  '第一课',
  '第二课',
  '练习1'
];
```

系统会自动扫描并导入这些文件，并按照 `coursewareOrder` 中指定的顺序排列。课件内容会被内联到打包后的 JavaScript 文件中。

## 注意事项

- 课件文件必须符合规范的HTML格式
- 建议使用 `section` 标签或 `data-section` 属性来标记页面
- 课件中的数学公式应使用 KaTeX 或 MathJax
- 如果同时存在编译期导入的课件和用户上传的课件，两者都会显示
- **重要**：只需将课件文件放在 `src/coursewares/` 目录下，系统会自动导入，无需修改代码

## 开发模式

在开发模式下（`npm run dev`），修改课件文件后需要刷新页面才能看到更新。

## 生产模式

在生产模式下（`npm run build`），所有课件会被打包进 `dist` 目录，可以部署为单个应用。打包后的应用打开时会自动加载课件并跳转到目录页，无需手动导入。

