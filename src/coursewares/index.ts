/**
 * 编译期课件导入配置
 * 将课件HTML文件放在此目录下，然后在此文件中导入
 * 
 * 使用方式：
 * 1. 将HTML课件文件复制到 src/coursewares/ 目录
 * 2. 在此文件中导入课件（使用 ?raw 后缀获取原始文本）
 * 3. 将课件添加到 coursewares 数组中
 * 
 * 示例：
 * import courseware1 from './课件1.html?raw';
 * import courseware2 from './课件2.html?raw';
 * 
 * export const bundledCoursewares = [
 *   parseHTMLCourseware(courseware1, '课件1'),
 *   parseHTMLCourseware(courseware2, '课件2'),
 * ];
 */

import { parseHTMLCourseware } from '../utils/coursewareParser';

// 使用 import.meta.glob 导入所有课件（更可靠的方式）
// 这样可以确保在打包时正确内联文件内容
const coursewareModules = import.meta.glob('./*.html', { 
  query: '?raw',
  import: 'default',
  eager: true 
}) as Record<string, string>;

// 解析所有课件
const coursewareDataList = Object.entries(coursewareModules).map(([path, content]) => {
  // 从路径提取文件名（去掉 ./ 和 .html）
  const filename = path.replace(/^\.\//, '').replace(/\.html$/, '');
  return { content, filename };
});

export const bundledCoursewares = coursewareDataList.map(({ content, filename }) => {
  try {
    const courseware = parseHTMLCourseware(content, filename);
    console.log(`[编译期导入] 成功加载课件: ${filename}`);
    return courseware;
  } catch (error) {
    console.error(`[编译期导入] 加载课件失败: ${filename}`, error);
    throw error;
  }
});

// 导出课件数量，用于调试
export const bundledCoursewaresCount = bundledCoursewares.length;

// 调试信息
console.log(`[编译期导入] 成功解析 ${bundledCoursewaresCount} 个课件`);

