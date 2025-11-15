# 通用课件播放框架

基于 React + Ant Design 开发的通用课件播放框架，支持导入HTML课件、自动切分页面、统一处理数学公式等功能。

## 功能特性

- 📄 **课件导入**：支持导入符合规范的HTML课件文件
- 📑 **自动切分**：自动识别并切分课件的各个章节/页面
- 🔢 **数学公式**：统一使用KaTeX处理数学公式
- 🧭 **导航系统**：顶部导航栏显示首页、目录和所有章节
- 📝 **提示词生成**：帮助生成用于大模型生成课件的提示词
- 📱 **响应式设计**：适配不同屏幕尺寸

## 技术栈

- React 18
- Ant Design 5
- React Router 6
- KaTeX（数学公式渲染）
- Vite（构建工具）
- TypeScript

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 使用说明

### 1. 生成课件提示词

1. 打开应用，进入"生成提示词"标签页
2. 在输入框中填写您对课件的具体要求
3. 系统会自动生成包含技术规范的完整提示词
4. 点击"复制提示词"按钮，将提示词复制到剪贴板
5. 将提示词提供给大模型（如ChatGPT、Claude等）生成课件

### 2. 导入课件

1. 在首页的"导入课件"标签页中，点击"选择HTML文件"
2. 选择符合规范的HTML课件文件
3. 系统会自动解析并切分课件
4. 导入成功后，会自动跳转到目录页

### 3. 浏览课件

- **目录页**：查看课件的所有页面列表，点击任意页面可跳转
- **播放页**：使用上一页/下一页按钮或顶部导航栏切换页面
- **导航栏**：顶部导航栏显示所有章节，可直接点击跳转

## 课件规范要求

为了确保课件能够正确导入和播放，生成的HTML课件应遵循以下规范：

### 基本结构

1. **使用section标签标记章节**：
   ```html
   <section id="cover" data-title="封面">
     <!-- 封面内容 -->
   </section>
   <section id="catalog" data-title="目录">
     <!-- 目录内容 -->
   </section>
   <section id="chapter1" data-title="第一章">
     <!-- 章节内容 -->
   </section>
   ```

2. **页面宽高比16:9**：确保课件内容适配16:9的显示比例

3. **数学公式使用KaTeX**：
   - 引入KaTeX CSS：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">`
   - 行内公式：`\(公式内容\)`
   - 块级公式：`\[公式内容\]`

### 封面信息

第一个section应包含以下信息（用于自动提取元数据）：
- 作品名称
- 教材版本
- 学科
- 年级学期
- 作者
- 单位

### 示例格式

```html
<section id="cover" data-title="封面">
  <h1>作品名称</h1>
  <p>教材版本：人教版</p>
  <p>学科：数学</p>
  <p>年级：七年级</p>
  <p>作者：张三</p>
  <p>单位：XX学校</p>
</section>
```

## 项目结构

```
├── src/
│   ├── components/          # 组件
│   │   ├── TopNav.tsx       # 顶部导航栏
│   │   ├── PageRenderer.tsx # 页面渲染器
│   │   └── PromptGenerator.tsx # 提示词生成器
│   ├── pages/               # 页面
│   │   ├── HomePage.tsx     # 首页
│   │   ├── CatalogPage.tsx  # 目录页
│   │   └── CoursewarePlayer.tsx # 课件播放页
│   ├── utils/               # 工具函数
│   │   ├── coursewareParser.ts # 课件解析器
│   │   └── mathRenderer.ts  # 数学公式渲染器
│   ├── context/             # 上下文
│   │   └── CoursewareContext.tsx # 课件上下文
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── index.html               # HTML模板
├── package.json             # 项目配置
├── vite.config.ts          # Vite配置
└── tsconfig.json            # TypeScript配置
```

## 注意事项

1. 导入的HTML文件中的`<script>`标签会被自动移除，以确保安全性
2. 课件内容应使用相对路径或CDN链接引用外部资源
3. 建议使用现代CSS特性，确保界面美观
4. 数学公式必须使用KaTeX语法，框架会自动处理渲染

## 许可证

MIT

