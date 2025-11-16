/**
 * 编译期课件导入配置
 * 将课件HTML文件放在此目录下，然后在此文件中配置顺序
 * 
 * 使用方式：
 * 1. 将HTML课件文件复制到 src/coursewares/ 目录
 * 2. 在下面的 coursewareOrder 数组中按顺序列出课件文件名（不含 .html 扩展名）
 * 3. 系统会自动导入并按照指定顺序排列课件
 * 
 * 示例：
 * const coursewareOrder = [
 *   '封面页',
 *   '第一课',
 *   '第二课',
 *   '练习1'
 * ];
 */

import { parseHTMLCourseware, setAudioPathMap } from '../utils/coursewareParser';

// 导入音频文件（使用 ?url 获取打包后的 URL）
// 使用 import.meta.glob 导入所有音频文件
const audioModules = import.meta.glob('./**/*.mp3', {
  query: '?url',
  import: 'default',
  eager: true
}) as Record<string, string>;

// 创建音频文件路径到 URL 的映射
const audioPathMap = new Map<string, string>();
Object.entries(audioModules).forEach(([path, url]) => {
  // 将路径转换为课件中使用的相对路径格式
  // 例如: ./火车资源/火车头刚好进入隧道.mp3
  const relativePath = path.replace(/^\.\//, './');
  audioPathMap.set(relativePath, url);
  
  // 也支持不带 ./ 前缀的路径
  const pathWithoutDot = path.replace(/^\.\//, '');
  audioPathMap.set(pathWithoutDot, url);
  
  console.log(`[音频导入] ${relativePath} -> ${url}`);
});

// 设置音频路径映射到解析器
setAudioPathMap(audioPathMap);

// 指定课件的显示顺序（按文件名，不含 .html 扩展名）
// 未在此列表中的课件会按文件名排序追加到末尾
const coursewareOrder: string[] = [
  '封面页',
  '上下坡问题',
  '应用题',
  '火车优化1',
  '环形道路相遇问题',
  '练习1填空题',
  '选择题',
  // 在这里添加更多课件，按你想要的顺序
];

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

// 按照指定顺序排序课件
const sortedCoursewareDataList = coursewareDataList.sort((a, b) => {
  const indexA = coursewareOrder.indexOf(a.filename);
  const indexB = coursewareOrder.indexOf(b.filename);
  
  // 如果都在顺序列表中，按照列表顺序排序
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB;
  }
  // 如果只有A在列表中，A排在前面
  if (indexA !== -1) {
    return -1;
  }
  // 如果只有B在列表中，B排在前面
  if (indexB !== -1) {
    return 1;
  }
  // 如果都不在列表中，按文件名排序
  return a.filename.localeCompare(b.filename, 'zh-CN');
});

export const bundledCoursewares = sortedCoursewareDataList.map(({ content, filename }) => {
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

