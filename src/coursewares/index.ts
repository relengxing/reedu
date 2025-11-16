/**
 * 编译期课件导入配置
 * 支持按文件夹分组组织课件，每个文件夹是一组课件
 * 
 * 使用方式：
 * 1. 将课件HTML文件放在 src/coursewares/ 目录下
 * 2. 可以创建子文件夹来组织课件组，每个文件夹是一组课件
 * 3. 也可以直接在根目录放置课件（会被归入"默认组"）
 * 4. 系统会自动按文件夹分组并导入课件
 */

import { parseHTMLCourseware, setAudioPathMap } from '../utils/coursewareParser';
import type { CoursewareData, CoursewareGroup } from '../types';
import { hashStringSync } from '../utils/md5';

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

// 使用 import.meta.glob 导入所有课件（支持子文件夹）
// 这样可以确保在打包时正确内联文件内容
const coursewareModules = import.meta.glob('./**/*.html', { 
  query: '?raw',
  import: 'default',
  eager: true 
}) as Record<string, string>;

// 按文件夹分组课件
const coursewareGroupsMap = new Map<string, Array<{ path: string; content: string; filename: string }>>();

Object.entries(coursewareModules).forEach(([path, content]) => {
  // 从路径提取文件夹和文件名
  // 例如: ./group1/课件1.html -> groupId: 'group1', filename: '课件1'
  // 例如: ./课件1.html -> groupId: '', filename: '课件1'
  const pathParts = path.replace(/^\.\//, '').split('/');
  const filename = pathParts[pathParts.length - 1].replace(/\.html$/, '');
  const groupId = pathParts.length > 1 ? pathParts[0] : '';
  
  if (!coursewareGroupsMap.has(groupId)) {
    coursewareGroupsMap.set(groupId, []);
  }
  coursewareGroupsMap.get(groupId)!.push({ path, content, filename });
});

// 解析所有课件并按组组织
const coursewareGroups: CoursewareGroup[] = [];
const allBundledCoursewares: CoursewareData[] = [];

coursewareGroupsMap.forEach((coursewares, groupId) => {
  // 按文件名排序
  coursewares.sort((a, b) => a.filename.localeCompare(b.filename, 'zh-CN'));
  
  // 解析该组的所有课件
  const parsedCoursewares: CoursewareData[] = coursewares.map(({ content, filename, path }) => {
    try {
      const courseware = parseHTMLCourseware(content, filename);
      // 标记为预编译课件
      courseware.isBundled = true;
      courseware.sourcePath = path;
      // 设置组信息
      if (groupId) {
        courseware.groupId = groupId;
        courseware.groupName = groupId;
      } else {
        courseware.groupId = 'default';
        courseware.groupName = '默认组';
      }
      console.log(`[编译期导入] 成功加载课件: ${groupId ? `${groupId}/` : ''}${filename}`);
      return courseware;
    } catch (error) {
      console.error(`[编译期导入] 加载课件失败: ${groupId ? `${groupId}/` : ''}${filename}`, error);
      throw error;
    }
  });
  
  // 创建课件组
  const groupName = groupId || '默认组';
  const groupIdForHash = groupId || 'default';
  // 计算课程ID（文件夹名的MD5哈希值）
  const courseId = hashStringSync(groupIdForHash);
  coursewareGroups.push({
    id: groupId || 'default',
    name: groupName,
    courseId: courseId,
    coursewares: parsedCoursewares,
  });
  
  // 添加到总列表
  allBundledCoursewares.push(...parsedCoursewares);
});

// 导出所有预编译课件（作为资源，可以被选择使用）
export const bundledCoursewares = allBundledCoursewares;

// 导出课件组
export const bundledCoursewareGroups = coursewareGroups;

// 导出课件数量，用于调试
export const bundledCoursewaresCount = bundledCoursewares.length;

// 调试信息
console.log(`[编译期导入] 成功解析 ${bundledCoursewaresCount} 个课件，分为 ${coursewareGroups.length} 个组`);

