/**
 * 提示词模板管理
 * 为不同类型的课件提供定制化的提示词模板
 */

export type PromptType = 'catalog' | 'courseware' | 'practice' | 'homework';

export interface PromptTemplate {
  type: PromptType;
  name: string;
  description: string;
  template: string;
}

// 基础要求（所有类型共用）
const BASE_REQUIREMENTS = `## 基本要求
1. **HTML必须是瀑布式的**：整个HTML应该是一个连续的文档，所有内容从上到下排列，没有任何分页功能
2. 使用section标签或带有data-section属性的div标记每个章节/页面
3. 每个section应该包含完整的页面内容，但所有section都在同一个HTML文档中连续排列
4. 页面宽高比为16:9（每个section内部）
5. 使用KaTeX处理数学公式（引入KaTeX CSS和JS）
6. 字体尽量大一点，使用在投影仪的场景

## 重要：HTML结构要求

**HTML必须是瀑布式的，所有section连续排列，没有任何分页或隐藏逻辑。**

示例结构：
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    /* 所有section都应该是可见的，连续排列 */
    section {
      width: 100%;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <section id="cover" data-section="0">
    <!-- 封面内容 -->
  </section>
  
  <section id="page1" data-section="1">
    <!-- 第一页内容 -->
  </section>
  
  <!-- 更多section... -->
</body>
</html>
\`\`\`

**关键点：**
- 所有section都在body中连续排列
- 不要使用display:none隐藏section
- 不要使用position:absolute让section重叠
- 不要添加任何JavaScript分页逻辑
- 框架会通过iframe控制滚动到对应的section`;

const TECH_SPECS = `## 技术规范
- 使用HTML5标准
- 引入KaTeX：<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
- 数学公式使用KaTeX语法：行内公式用\\(...\\)，块级公式用\\[...\\]
- 使用现代CSS3特性，界面美观
- 字体大小适中，图文数量适量
- 支持音视频播放（如需要）

## 重要：不要添加任何分页功能

**框架会通过iframe展示整个HTML，并自动控制滚动到对应的section。**

**禁止事项：**
- **不要**添加任何翻页按钮或导航按钮
- **不要**添加任何JavaScript分页逻辑（如showSection、prevSection、nextSection等函数）
- **不要**使用display:none隐藏section
- **不要**使用position:absolute让section重叠
- **不要**添加任何分页相关的CSS或JavaScript

**HTML应该是纯内容，所有section连续排列，框架会负责分页和导航。**`;

const INTERACTIVE_TEMPLATE = `## 交互功能（展开答案、切换内容等）

**重要：点击展开的标准格式（必须严格遵循）**

\`\`\`html
<!-- 标准点击展开示例 - 必须严格按照此格式 -->
<div class="interactive-container">
    <button class="toggle-btn" data-target="#answer-1">
        <span>查看解析</span>
    </button>
    <div id="answer-1" class="content">
        <p><strong>解析：</strong>使用因式分解法...</p>
    </div>
</div>
\`\`\`

**关键要求：**
1. **容器**：使用 \`<div class="interactive-container">\` 包裹按钮和内容
2. **按钮**：使用 \`<button class="toggle-btn" data-target="#目标元素id">\`，按钮内使用 \`<span>\` 包裹文字
3. **目标元素**：使用 \`<div id="目标元素id" class="content">\`，id必须与data-target对应
4. **ID必须唯一**：每个展开按钮和目标元素必须使用唯一的ID（如 answer-1, answer-2, solution-1 等）
5. **必须包含CSS样式**：在 \`<style>\` 标签中添加展开收起的动画样式
6. **必须包含JavaScript代码**：在 \`<script>\` 标签中添加处理展开功能的JavaScript代码`;

// 目录页模板
const CATALOG_TEMPLATE: PromptTemplate = {
  type: 'catalog',
  name: '目录页',
  description: '生成清晰的课件目录结构页面',
  template: `请生成一个符合以下要求的目录页HTML课件：

${BASE_REQUIREMENTS}

## 目录页特殊要求

1. **第一个section作为封面页**，包含：
   - 课程标题（大字号、醒目）
   - 教材版本、学科、年级学期
   - 作者及单位
   - 创建日期

2. **第二个section作为目录页**，包含：
   - 清晰的目录结构
   - 使用有序列表或卡片展示章节
   - 每个章节标题醒目
   - 可以添加章节简介
   - 使用图标或装饰元素增强视觉效果

3. **视觉设计**：
   - 使用渐变色背景或装饰性图形
   - 目录项之间留有适当间距
   - 使用合适的字体大小层级
   - 颜色搭配协调

${TECH_SPECS}

## 用户具体要求
{{USER_REQUIREMENT}}

## 输出要求
请生成完整的HTML代码，确保目录结构清晰、视觉效果美观。`,
};

// 课件内容模板
const COURSEWARE_TEMPLATE: PromptTemplate = {
  type: 'courseware',
  name: '课件内容',
  description: '生成教学内容课件，包含知识讲解和交互动画',
  template: `请生成一个符合以下要求的教学内容HTML课件：

${BASE_REQUIREMENTS}

## 课件内容特殊要求

1. **课件结构**：
   - 第一个section作为封面，包含：作品名称、教材版本、学科、年级学期、作者及单位等信息
   - 第二个section可作为目录页（可选）
   - 后续section为具体教学内容章节

2. **教学内容要求**：
   - 课题与内容一致，至少为1个课时的完整内容
   - 内容丰富、科学，表述准确、简洁
   - 术语规范，结构清晰、直观
   - 教学环节清晰（导入、讲解、例题、总结等）

3. **素材与呈现**：
   - 素材选用恰当，符合教学内容
   - 适当使用图片、图表辅助说明
   - 数学公式使用KaTeX渲染
   - 可以包含简单的CSS动画增强效果

4. **分页控制**：
   - 每个section内容适量，控制在16:9的页面范围内
   - 如果内容过多，应分成多个section
   - 每个section应该包含适量的内容，避免内容过多导致显示不全

${TECH_SPECS}

${INTERACTIVE_TEMPLATE}

## 用户具体要求
{{USER_REQUIREMENT}}

## 输出要求
请生成完整的HTML代码，确保教学内容科学准确，呈现清晰美观。`,
};

// 随堂练习模板
const PRACTICE_TEMPLATE: PromptTemplate = {
  type: 'practice',
  name: '随堂练习',
  description: '生成随堂练习题，包含题目和可展开的答案',
  template: `请生成一个符合以下要求的随堂练习HTML课件：

${BASE_REQUIREMENTS}

## 随堂练习特殊要求

1. **练习题结构**：
   - 第一个section作为练习封面，包含练习主题、时间限制（如有）
   - 每个section展示1-3道题目（根据题目难度调整）
   - 题目编号清晰
   - 为每道题预留答题空间

2. **题目类型**：
   - 支持选择题、填空题、简答题、计算题等
   - 每种题型有清晰的格式标识
   - 选择题要列出所有选项（A/B/C/D）
   - 计算题要清晰展示公式和计算步骤区域

3. **答案展示**：
   - **每道题必须有答案**
   - 答案默认隐藏，使用**点击展开功能**显示
   - 答案展开按钮文字：「查看答案」或「显示解析」
   - 答案内容包括：正确答案 + 简要解析

4. **视觉设计**：
   - 题目卡片式布局，清晰区分
   - 题目区域使用浅色背景
   - 答案区域使用不同颜色背景（如浅蓝色、浅绿色）
   - 字体大小适合投影显示

${TECH_SPECS}

${INTERACTIVE_TEMPLATE}

**特别注意**：随堂练习必须包含完整的CSS和JavaScript代码来支持答案展开功能！

## 用户具体要求
{{USER_REQUIREMENT}}

## 输出要求
请生成完整的HTML代码，确保：
1. 每道题都有可展开的答案
2. 答案展开功能正常工作
3. 题目格式规范、清晰
4. 包含完整的CSS和JavaScript代码`,
};

// 课后作业模板
const HOMEWORK_TEMPLATE: PromptTemplate = {
  type: 'homework',
  name: '课后作业',
  description: '生成课后作业题，难度较大，包含详细解析',
  template: `请生成一个符合以下要求的课后作业HTML课件：

${BASE_REQUIREMENTS}

## 课后作业特殊要求

1. **作业结构**：
   - 第一个section作为作业封面，包含：作业标题、截止日期、要求说明
   - 题目按难度分组：基础题、提高题、挑战题
   - 每个section展示1-2道题目（作业题目通常较复杂）

2. **题目难度**：
   - 题目难度适中偏上，有一定挑战性
   - 包含综合应用题、拓展题
   - 题目设计要求学生深入思考
   - 可以包含开放性问题

3. **答案与解析**：
   - **每道题必须有详细解析**
   - 解析默认隐藏，使用**点击展开功能**显示
   - 解析包含：
     * 正确答案
     * 详细解题步骤
     * 知识点说明
     * 易错点提示
     * 拓展思考（如有）
   - 展开按钮文字：「查看详细解析」

4. **视觉设计**：
   - 题目卡片清晰，层次分明
   - 不同难度的题目使用不同颜色标签标识
   - 解析区域使用醒目的边框和背景色
   - 公式渲染清晰

5. **作业要求说明**：
   - 在封面或第一题前说明作业要求
   - 包括完成时间、提交方式、评分标准等

${TECH_SPECS}

${INTERACTIVE_TEMPLATE}

**特别注意**：课后作业的解析要特别详细，包含完整的解题思路和步骤！

## 用户具体要求
{{USER_REQUIREMENT}}

## 输出要求
请生成完整的HTML代码，确保：
1. 题目有一定难度和综合性
2. 每道题都有详细的解析
3. 解析展开功能正常工作
4. 包含完整的CSS和JavaScript代码
5. 视觉设计专业、清晰`,
};

// 所有模板
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  CATALOG_TEMPLATE,
  COURSEWARE_TEMPLATE,
  PRACTICE_TEMPLATE,
  HOMEWORK_TEMPLATE,
];

/**
 * 根据类型获取模板
 */
export function getTemplateByType(type: PromptType): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(t => t.type === type);
}

/**
 * 生成最终的提示词
 */
export function generatePrompt(type: PromptType, userRequirement: string): string {
  const template = getTemplateByType(type);
  if (!template) {
    throw new Error(`未找到类型为 ${type} 的模板`);
  }
  
  return template.template.replace('{{USER_REQUIREMENT}}', userRequirement || '（用户未填写具体要求）');
}

