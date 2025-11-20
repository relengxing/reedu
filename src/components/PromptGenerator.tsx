import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography, message, Select } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { PROMPT_TEMPLATES, generatePrompt, type PromptType } from '../utils/promptTemplates';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const PromptGenerator: React.FC = () => {
  const [userRequirement, setUserRequirement] = useState('');
  const [promptType, setPromptType] = useState<PromptType>('courseware');
  const [copied, setCopied] = useState(false);

  const getCurrentPrompt = () => {
    return generatePrompt(promptType, userRequirement);
  };

  const generateOldPrompt = () => {
    const baseRequirements = `请生成一个符合以下要求的HTML课件：

## 基本要求
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
  
  <section id="catalog" data-section="1">
    <!-- 目录内容 -->
  </section>
  
  <section id="page1" data-section="2">
    <!-- 第一页内容 -->
  </section>
  
  <section id="page2" data-section="3">
    <!-- 第二页内容 -->
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
- 框架会通过iframe控制滚动到对应的section

## 课件结构要求
- 第一个section作为封面，包含：作品名称、教材版本、学科、年级学期、作者及单位等信息
- 第二个section作为目录页（可选）
- 后续section为具体教学内容章节
- 每个section应有唯一的id或data-section属性

## 技术规范
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

**HTML应该是纯内容，所有section连续排列，框架会负责分页和导航。**

## 交互功能（展开答案、切换内容等）

**重要：点击展开的标准格式（必须严格遵循）**

\`\`\`html
<!-- 标准点击展开示例 - 必须严格按照此格式 -->
<div class="interactive-container">
    <button class="toggle-btn" data-target="#answer-1">
        <span>查看解析</span>
    </button>
    <div id="answer-1" class="content">
        <p><strong>解析：</strong>使用因式分解法，将方程 <span class="math">x² + 5x + 6 = 0</span> 分解为 <span class="math">(x + 2)(x + 3) = 0</span>。</p>
        <p>因此，方程的解为 <span class="math">x = -2</span> 或 <span class="math">x = -3</span>。</p>
        
        <div class="solution">
            <h3>验证答案</h3>
            <p>将 <span class="math">x = -2</span> 代入原方程：<span class="math">(-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0</span>，正确。</p>
            <p>将 <span class="math">x = -3</span> 代入原方程：<span class="math">(-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0</span>，正确。</p>
        </div>
    </div>
</div>
\`\`\`

**关键要求：**
1. **容器**：使用 \`<div class="interactive-container">\` 包裹按钮和内容
2. **按钮**：使用 \`<button class="toggle-btn" data-target="#目标元素id">\`，按钮内使用 \`<span>\` 包裹文字
3. **目标元素**：使用 \`<div id="目标元素id" class="content">\`，id必须与data-target对应
4. **ID必须唯一**：每个展开按钮和目标元素必须使用唯一的ID（如 answer-1, answer-2, solution-1 等）
5. **必须包含CSS样式**：在 \`<style>\` 标签中添加展开收起的动画样式（见下方完整示例）
6. **必须包含JavaScript代码**：在 \`<script>\` 标签中添加处理展开功能的JavaScript代码（见下方完整示例）

**更多展开示例：**

\`\`\`html
<!-- 多个展开按钮示例 -->
<div class="interactive-container">
    <button class="toggle-btn" data-target="#solution-1">
        <span>查看解析</span>
    </button>
    <div id="solution-1" class="content">
        <p>这是解析内容...</p>
    </div>
</div>

<div class="interactive-container">
    <button class="toggle-btn" data-target="#hint-1">
        <span>显示提示</span>
    </button>
    <div id="hint-1" class="content">
        <p>这是提示内容...</p>
    </div>
</div>
\`\`\`

## 内容要求
- 课题与内容一致，至少为1个课时的完整内容
- 素材选用恰当，符合教学内容
- 内容丰富、科学，表述准确、简洁
- 术语规范，结构清晰、直观
- 教学环节清晰

## 用户具体要求
${userRequirement || '（用户未填写具体要求）'}

## 分页要求

**重要：每个section的内容应该控制在16:9的页面范围内。如果内容过多，应该分成多个section。**

- 如果单个section内容超出页面，应该拆分成多个section
- 每个section应该包含适量的内容，避免内容过多导致显示不全

## 输出要求

请生成完整的HTML代码，确保：
1. 所有section标签清晰标记，每个section内容适量
2. 数学公式正确使用KaTeX语法：行内公式 \\(...\\)，块级公式 \\[...\\]
3. 点击展开按钮严格按照上述标准格式编写
4. **必须包含CSS样式**：在 \`<style>\` 标签中添加展开收起的动画样式（参考完整示例）
5. **必须包含JavaScript代码**：在 \`<script>\` 标签中添加处理展开功能的JavaScript代码（参考完整示例）
6. 引入KaTeX CSS和JS：\`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">\` 和 \`<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>\`

## 完整示例（包含CSS和JavaScript代码）

\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例课件</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        section {
            width: 100%;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
        }
        
        .interactive-container {
            margin: 20px 0;
        }
        
        .toggle-btn {
            padding: 12px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .toggle-btn:hover {
            background: #2980b9;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .toggle-btn:active {
            transform: translateY(0);
        }
        
        .toggle-btn::after {
            content: "▶";
            font-size: 14px;
            transition: transform 0.3s ease;
        }
        
        .toggle-btn.expanded::after {
            transform: rotate(90deg);
        }
        
        .content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease, padding 0.4s ease, opacity 0.3s ease;
            background: #f5f5f5;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            opacity: 0;
        }
        
        .content.expanded {
            max-height: 1000px; /* 足够大的值以容纳内容 */
            padding: 20px;
            margin-top: 15px;
            opacity: 1;
        }
        
        .content p {
            margin-bottom: 10px;
        }
        
        .content p:last-child {
            margin-bottom: 0;
        }
        
        .math {
            font-family: 'Times New Roman', serif;
            font-style: italic;
        }
        
        .solution {
            margin-top: 15px;
            padding: 15px;
            background: #e8f4fc;
            border-radius: 6px;
        }
        
        .solution h3 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <section id="page1" data-section="1">
        <h1>示例页面</h1>
        
        <div class="question">
            <p>这是一道数学题：解方程 <span class="math">x² + 5x + 6 = 0</span></p>
        </div>
        
        <div class="interactive-container">
            <button class="toggle-btn" data-target="#answer-1">
                <span>查看解析</span>
            </button>
            <div id="answer-1" class="content">
                <p><strong>解析：</strong>使用因式分解法，将方程 <span class="math">x² + 5x + 6 = 0</span> 分解为 <span class="math">(x + 2)(x + 3) = 0</span>。</p>
                <p>因此，方程的解为 <span class="math">x = -2</span> 或 <span class="math">x = -3</span>。</p>
                
                <div class="solution">
                    <h3>验证答案</h3>
                    <p>将 <span class="math">x = -2</span> 代入原方程：<span class="math">(-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0</span>，正确。</p>
                    <p>将 <span class="math">x = -3</span> 代入原方程：<span class="math">(-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0</span>，正确。</p>
                </div>
            </div>
        </div>
    </section>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 获取所有切换按钮
            const toggleButtons = document.querySelectorAll('.toggle-btn');
            
            // 为每个按钮添加点击事件
            toggleButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const target = document.querySelector(targetId);
                    
                    if (target) {
                        // 切换内容区域的展开/收起状态
                        target.classList.toggle('expanded');
                        
                        // 更新按钮状态
                        this.classList.toggle('expanded');
                    }
                });
            });
            
            // 渲染数学公式
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '\\\\(', right: '\\\\)', display: false},
                        {left: '\\\\[', right: '\\\\]', display: true}
                    ]
                });
            }
        });
    </script>
</body>
</html>
\`\`\`
`
;

    return baseRequirements;
  };

  const handleCopy = () => {
    const prompt = getCurrentPrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      message.success('提示词已复制到剪贴板！');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const prompt = getCurrentPrompt();
  
  // 获取当前选择的模板信息
  const currentTemplate = PROMPT_TEMPLATES.find(t => t.type === promptType);

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>课件生成提示词工具</Title>
          <Paragraph>
            选择课件类型，输入具体要求，系统会自动生成包含技术规范的完整提示词供大模型使用。
          </Paragraph>
        </div>

        <div>
          <Title level={5}>选择课件类型：</Title>
          <Select
            value={promptType}
            onChange={(value) => setPromptType(value)}
            style={{ width: '100%' }}
            size="large"
          >
            {PROMPT_TEMPLATES.map(template => (
              <Option key={template.type} value={template.type}>
                <Space>
                  <Text strong>{template.name}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {template.description}
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
          {currentTemplate && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                {currentTemplate.description}
              </Text>
            </div>
          )}
        </div>

        <div>
          <Title level={5}>您的具体要求：</Title>
          <TextArea
            rows={6}
            placeholder={
              promptType === 'catalog' ? '例如：生成初中数学七年级上册完整目录...' :
              promptType === 'courseware' ? '例如：生成一个关于二元一次方程组的数学课件，包含实际问题应用...' :
              promptType === 'practice' ? '例如：生成10道关于一元二次方程的随堂练习题，难度适中...' :
              '例如：生成5道关于函数的课后作业题，包含综合应用题...'
            }
            value={userRequirement}
            onChange={(e) => setUserRequirement(e.target.value)}
          />
        </div>

        <div>
          <Space>
            <Title level={5}>完整提示词：</Title>
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? '已复制' : '复制提示词'}
            </Button>
          </Space>
          <TextArea
            rows={20}
            value={prompt}
            readOnly
            style={{ marginTop: '12px', fontFamily: 'monospace' }}
          />
        </div>

        <div>
          <Title level={5}>使用说明：</Title>
          <ol>
            <li><strong>选择类型</strong>：根据需要选择课件类型（目录页、课件内容、随堂练习、课后作业）</li>
            <li><strong>填写要求</strong>：在输入框中填写您对课件的具体要求</li>
            <li><strong>复制提示词</strong>：点击"复制提示词"按钮，将生成的提示词复制到剪贴板</li>
            <li><strong>生成课件</strong>：将提示词提供给大模型（如ChatGPT、Claude、Deepseek等）生成课件</li>
            <li><strong>导入课件</strong>：生成完成后，在"本地上传课件"标签页导入生成的HTML文件</li>
          </ol>
          <div style={{ marginTop: '12px', padding: '12px', background: '#f0f5ff', borderRadius: '6px' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              <strong>💡 提示：</strong>不同类型的课件有不同的要求和格式。选择正确的类型可以生成更符合需求的课件。
            </Text>
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default PromptGenerator;

