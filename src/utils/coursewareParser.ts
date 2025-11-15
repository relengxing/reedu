import type { CoursewareData, Page } from '../types';

/**
 * 解析HTML课件，保留完整HTML，只提取section信息用于目录
 */
export const parseHTMLCourseware = (htmlContent: string, filename: string): CoursewareData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // 提取标题
  const titleElement = doc.querySelector('title');
  const title = titleElement?.textContent || filename.replace('.html', '');

  // 提取元数据（从封面或meta标签）
  const metadata: CoursewareData['metadata'] = {};
  
  // 尝试从第一个section或特定元素提取元数据
  const firstSection = doc.querySelector('section:first-child, [data-section="0"], [data-section="cover"]');
  if (firstSection) {
    const text = firstSection.textContent || '';
    const versionMatch = text.match(/教材版本[：:]\s*([^\n]+)/);
    const subjectMatch = text.match(/学科[：:]\s*([^\n]+)/);
    const gradeMatch = text.match(/年级[：:]\s*([^\n]+)/);
    const authorMatch = text.match(/作者[：:]\s*([^\n]+)/);
    const unitMatch = text.match(/单位[：:]\s*([^\n]+)/);
    
    if (versionMatch) metadata.version = versionMatch[1].trim();
    if (subjectMatch) metadata.subject = subjectMatch[1].trim();
    if (gradeMatch) metadata.grade = gradeMatch[1].trim();
    if (authorMatch) metadata.author = authorMatch[1].trim();
    if (unitMatch) metadata.unit = unitMatch[1].trim();
  }

  // 提取所有section或标记的页面
  const sections = Array.from(doc.querySelectorAll('section, [data-section]'));
  
  let pages: Page[] = [];

  if (sections.length > 0) {
    // 提取section信息用于目录
    pages = sections.map((section, index) => {
      const sectionId = section.getAttribute('id') || 
                       section.getAttribute('data-section') || 
                       `page-${index}`;
      const sectionTitle = section.getAttribute('data-title') || 
                          section.querySelector('h1, h2, h3')?.textContent?.trim() || 
                          `第${index + 1}页`;
      
      // 构建选择器
      let selector = '';
      if (section.id) {
        selector = `#${section.id}`;
      } else if (section.hasAttribute('data-section')) {
        const dataSection = section.getAttribute('data-section');
        selector = `[data-section="${dataSection}"]`;
      } else {
        // 如果没有id或data-section，使用nth-of-type
        const tagName = section.tagName.toLowerCase();
        const siblings = Array.from(section.parentElement?.children || [])
          .filter(el => el.tagName.toLowerCase() === tagName);
        const nthIndex = siblings.indexOf(section);
        selector = `${tagName}:nth-of-type(${nthIndex + 1})`;
      }

      return {
        id: sectionId,
        title: sectionTitle,
        sectionSelector: selector,
        index,
      };
    });
  } else {
    // 如果没有section标记，将整个body作为一个页面
    pages = [
      {
        id: 'page-0',
        title: title,
        sectionSelector: 'body',
        index: 0,
      },
    ];
  }

  // 保留完整HTML（包括script标签，因为课件需要JavaScript功能）
  // 直接使用原始HTML内容，避免XMLSerializer序列化导致的字符转义问题
  // 如果原始内容已经是完整HTML，直接使用；否则使用documentElement.outerHTML
  let fullHTML: string;
  
  // 检查原始内容是否包含完整的HTML文档结构
  if (htmlContent.trim().toLowerCase().startsWith('<!doctype') || 
      htmlContent.trim().toLowerCase().startsWith('<html')) {
    // 已经是完整HTML，直接使用原始内容
    fullHTML = htmlContent;
  } else {
    // 使用documentElement.outerHTML获取完整HTML
    fullHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }
  
  // 调试：检查script标签是否被保留
  const scriptCount = (fullHTML.match(/<script[\s\S]*?<\/script>/gi) || []).length;
  console.log(`Parsed HTML contains ${scriptCount} script tags`);

  return {
    title,
    pages,
    fullHTML,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
};
