/**
 * 课件导出文件
 * 
 * 注意：本项目不再使用编译期导入的课件
 * 所有课件通过用户绑定的Git仓库动态加载
 */

import type { CoursewareData, CoursewareGroup } from '../types';

// 导出空数组，保持API兼容性
export const bundledCoursewares: CoursewareData[] = [];
export const bundledCoursewareGroups: CoursewareGroup[] = [];
