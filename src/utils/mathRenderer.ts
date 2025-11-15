import 'katex/dist/katex.min.css';

// 动态加载katex，避免类型问题
// @ts-ignore
let katex: any = null;

const loadKatex = async () => {
  if (!katex) {
    // @ts-ignore
    katex = await import('katex');
  }
  return katex;
};

// 解码HTML实体
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const renderMath = async (element: HTMLElement) => {
  const katexModule = await loadKatex();
  const katexLib = katexModule.default || katexModule;

  // 查找所有需要渲染数学公式的元素
  const mathElements = element.querySelectorAll('[data-math], .math, .katex');

  mathElements.forEach((el) => {
    const mathContent = el.getAttribute('data-math') || el.textContent || '';
    if (mathContent) {
      try {
        const isBlock = el.tagName === 'DIV' || el.classList.contains('block-math');
        katexLib.render(mathContent, el as HTMLElement, {
          throwOnError: false,
          displayMode: isBlock,
        });
      } catch (e) {
        console.error('Math rendering error:', e);
      }
    }
  });

  // 检查是否已经渲染过公式
  // KaTeX渲染后的HTML通常包含class="katex"或class="katex-display"
  // 如果存在这些class且没有未渲染的公式标记（\[ 或 \(），说明已经渲染过
  const hasRenderedMath = element.querySelector('.katex, .katex-display') !== null;
  const hasUnrenderedMath = element.innerHTML.includes('\\[') || element.innerHTML.includes('\\(');
  
  // 如果已经有渲染的公式，且没有未渲染的公式标记，说明已经全部渲染过，跳过
  if (hasRenderedMath && !hasUnrenderedMath) {
    return; // 已经渲染过，跳过
  }

  // 处理行内公式 \(...\) - 使用更健壮的正则表达式
  // 匹配 \( 和 \) 之间的所有内容，包括反斜杠、括号等
  let html = element.innerHTML;
  
  // 先处理块级公式 \[...\]，避免与行内公式冲突
  const blockMathRegex = /\\\[([\s\S]*?)\\\]/g;
  const blockMatches: Array<{ match: string; content: string; index: number }> = [];
  let match;
  
  // 重置正则表达式的lastIndex
  blockMathRegex.lastIndex = 0;
  while ((match = blockMathRegex.exec(html)) !== null) {
    blockMatches.push({
      match: match[0],
      content: match[1],
      index: match.index,
    });
  }
  
  // 从后往前替换块级公式
  for (let i = blockMatches.length - 1; i >= 0; i--) {
    const { match: matchStr, content } = blockMatches[i];
    try {
      // 解码HTML实体（如 &gt; -> >, &lt; -> <）
      const decodedContent = decodeHtmlEntities(content.trim());
      const rendered = katexLib.renderToString(decodedContent, {
        throwOnError: false,
        displayMode: true,
      });
      html = html.substring(0, blockMatches[i].index) + 
             rendered + 
             html.substring(blockMatches[i].index + matchStr.length);
    } catch (e) {
      console.error('Block math rendering error:', e, 'Content:', content);
    }
  }

  // 处理行内公式 \(...\) - 使用非贪婪匹配，但允许包含反斜杠
  // 使用 [\s\S] 匹配包括换行符在内的所有字符
  const inlineMathRegex = /\\\(([\s\S]*?)\\\)/g;
  const inlineMatches: Array<{ match: string; content: string; index: number }> = [];
  
  // 重置正则表达式的lastIndex
  inlineMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(html)) !== null) {
    inlineMatches.push({
      match: match[0],
      content: match[1],
      index: match.index,
    });
  }
  
  // 从后往前替换行内公式，避免索引变化
  for (let i = inlineMatches.length - 1; i >= 0; i--) {
    const { match: matchStr, content } = inlineMatches[i];
    try {
      // 解码HTML实体（如 &gt; -> >, &lt; -> <, &amp; -> &）
      const decodedContent = decodeHtmlEntities(content.trim());
      const rendered = katexLib.renderToString(decodedContent, {
        throwOnError: false,
        displayMode: false,
      });
      html = html.substring(0, inlineMatches[i].index) + 
             rendered + 
             html.substring(inlineMatches[i].index + matchStr.length);
    } catch (e) {
      console.error('Inline math rendering error:', e, 'Content:', content);
    }
  }
  
  element.innerHTML = html;
};

