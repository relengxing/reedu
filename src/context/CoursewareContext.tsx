import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CoursewareData, CoursewareGroup } from '../types';
import { bundledCoursewares, bundledCoursewareGroups } from '../coursewares';

// localStorage 键名
const STORAGE_KEY = 'reedu_coursewares';
const CURRENT_INDEX_KEY = 'reedu_current_courseware_index';

// 课件存储格式（只存储标识信息，不存储完整HTML）
interface StoredCourseware {
  sourcePath?: string; // 预编译课件的路径
  isBundled: boolean;
  // 用户上传的课件需要存储完整数据（除了fullHTML，因为可能太大）
  title?: string;
  pages?: CoursewareData['pages'];
  metadata?: CoursewareData['metadata'];
  groupId?: string;
  groupName?: string;
  // 用户上传的课件存储一个唯一ID
  uploadId?: string;
  // 用户上传的课件需要存储fullHTML（因为无法恢复）
  fullHTML?: string;
}

// 从localStorage恢复课件列表
const restoreCoursewares = (): CoursewareData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const storedList: StoredCourseware[] = JSON.parse(stored);
    const restored: CoursewareData[] = [];
    
    for (const item of storedList) {
      if (item.isBundled && item.sourcePath) {
        // 从预编译资源中恢复
        const bundled = bundledCoursewares.find(cw => cw.sourcePath === item.sourcePath);
        if (bundled) {
          restored.push({ ...bundled });
        } else {
          console.warn(`[CoursewareContext] 无法找到预编译课件: ${item.sourcePath}`);
        }
      } else if (item.fullHTML) {
        // 用户上传的课件，恢复完整数据
        restored.push({
          title: item.title || '未命名课件',
          pages: item.pages || [],
          fullHTML: item.fullHTML,
          metadata: item.metadata,
          groupId: item.groupId,
          groupName: item.groupName,
          isBundled: false,
        });
      }
    }
    
    console.log(`[CoursewareContext] 从localStorage恢复了 ${restored.length} 个课件`);
    return restored;
  } catch (error) {
    console.error('[CoursewareContext] 恢复课件列表失败:', error);
    return [];
  }
};

// 保存课件列表到localStorage
const saveCoursewares = (coursewares: CoursewareData[]) => {
  try {
    const storedList: StoredCourseware[] = coursewares.map(cw => {
      if (cw.isBundled && cw.sourcePath) {
        // 预编译课件只存储标识
        return {
          sourcePath: cw.sourcePath,
          isBundled: true,
        };
      } else {
        // 用户上传的课件存储完整数据
        return {
          isBundled: false,
          title: cw.title,
          pages: cw.pages,
          metadata: cw.metadata,
          groupId: cw.groupId,
          groupName: cw.groupName,
          fullHTML: cw.fullHTML,
        };
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedList));
    console.log(`[CoursewareContext] 已保存 ${coursewares.length} 个课件到localStorage`);
  } catch (error) {
    console.error('[CoursewareContext] 保存课件列表失败:', error);
    // 如果存储失败（可能是超出大小限制），尝试清理并重试
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[CoursewareContext] localStorage空间不足，尝试清理旧数据');
      try {
        localStorage.removeItem(STORAGE_KEY);
        // 只保存预编译课件
        const bundledOnly = coursewares.filter(cw => cw.isBundled);
        saveCoursewares(bundledOnly);
      } catch (e) {
        console.error('[CoursewareContext] 清理后仍无法保存:', e);
      }
    }
  }
};

interface CoursewareContextType {
  // 使用的课件列表（从预编译资源中选择的 + 用户上传的）
  coursewares: CoursewareData[];
  setCoursewares: (coursewares: CoursewareData[]) => void;
  addCourseware: (courseware: CoursewareData) => void;
  removeCourseware: (index: number) => void;
  reorderCoursewares: (fromIndex: number, toIndex: number) => void;
  currentCoursewareIndex: number;
  setCurrentCoursewareIndex: (index: number) => void;
  // 向后兼容
  courseware: CoursewareData | null;
  setCourseware: (courseware: CoursewareData | null) => void;
  // 预编译课件资源管理
  bundledCoursewares: CoursewareData[]; // 所有可用的预编译课件资源
  bundledCoursewareGroups: CoursewareGroup[]; // 所有可用的预编译课件组
  addBundledCourseware: (courseware: CoursewareData) => void; // 从资源中选择课件使用
  removeBundledCourseware: (sourcePath: string) => void; // 从使用的课件中移除（但资源仍然存在）
}

export const CoursewareContext = createContext<CoursewareContextType>({
  coursewares: [],
  setCoursewares: () => {},
  addCourseware: () => {},
  removeCourseware: () => {},
  reorderCoursewares: () => {},
  currentCoursewareIndex: 0,
  setCurrentCoursewareIndex: () => {},
  courseware: null,
  setCourseware: () => {},
  bundledCoursewares: [],
  bundledCoursewareGroups: [],
  addBundledCourseware: () => {},
  removeBundledCourseware: () => {},
});

export const CoursewareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用的课件列表（从预编译资源中选择的 + 用户上传的）
  // 从localStorage恢复，如果不存在则初始为空
  const [coursewares, setCoursewares] = useState<CoursewareData[]>(() => {
    const restored = restoreCoursewares();
    return restored;
  });
  
  // 从localStorage恢复当前课件索引
  const [currentCoursewareIndex, setCurrentCoursewareIndex] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_INDEX_KEY);
      if (stored) {
        const index = parseInt(stored, 10);
        return isNaN(index) ? 0 : index;
      }
    } catch (error) {
      console.error('[CoursewareContext] 恢复当前课件索引失败:', error);
    }
    return 0;
  });

  // 当coursewares变化时，保存到localStorage
  useEffect(() => {
    saveCoursewares(coursewares);
  }, [coursewares]);

  // 当currentCoursewareIndex变化时，保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_INDEX_KEY, currentCoursewareIndex.toString());
    } catch (error) {
      console.error('[CoursewareContext] 保存当前课件索引失败:', error);
    }
  }, [currentCoursewareIndex]);

  const addCourseware = (courseware: CoursewareData) => {
    setCoursewares((prev) => {
      const newIndex = prev.length;
      setCurrentCoursewareIndex(newIndex); // 设置为新添加的课件索引
      // 确保用户上传的课件标记为非预编译
      const newCourseware = { ...courseware, isBundled: false };
      return [...prev, newCourseware];
    });
  };

  const removeCourseware = (index: number) => {
    setCoursewares((prev) => {
      const newList = prev.filter((_, i) => i !== index);
      // 如果删除的是当前课件，调整索引
      if (currentCoursewareIndex >= index && currentCoursewareIndex > 0) {
        setCurrentCoursewareIndex(Math.max(0, currentCoursewareIndex - 1));
      } else if (currentCoursewareIndex >= newList.length && newList.length > 0) {
        setCurrentCoursewareIndex(newList.length - 1);
      }
      return newList;
    });
  };

  // 从预编译资源中添加课件到使用列表
  const addBundledCourseware = (courseware: CoursewareData) => {
    // 检查是否已经添加（通过sourcePath判断）
    setCoursewares((prev) => {
      if (courseware.sourcePath && prev.some(cw => cw.sourcePath === courseware.sourcePath)) {
        console.log('[CoursewareContext] 课件已在使用列表中，跳过添加');
        return prev;
      }
      const newIndex = prev.length;
      setCurrentCoursewareIndex(newIndex);
      return [...prev, { ...courseware }];
    });
  };

  // 从使用列表中移除预编译课件（但资源仍然存在）
  const removeBundledCourseware = (sourcePath: string) => {
    setCoursewares((prev) => {
      const index = prev.findIndex(cw => cw.sourcePath === sourcePath);
      if (index === -1) return prev;
      const newList = prev.filter((_, i) => i !== index);
      // 如果删除的是当前课件，调整索引
      if (currentCoursewareIndex >= index && currentCoursewareIndex > 0) {
        setCurrentCoursewareIndex(Math.max(0, currentCoursewareIndex - 1));
      } else if (currentCoursewareIndex >= newList.length && newList.length > 0) {
        setCurrentCoursewareIndex(newList.length - 1);
      }
      return newList;
    });
  };

  const reorderCoursewares = (fromIndex: number, toIndex: number) => {
    setCoursewares((prev) => {
      const newCoursewares = [...prev];
      const [removed] = newCoursewares.splice(fromIndex, 1);
      newCoursewares.splice(toIndex, 0, removed);
      return newCoursewares;
    });
    // 更新当前课件索引
    if (currentCoursewareIndex === fromIndex) {
      setCurrentCoursewareIndex(toIndex);
    } else if (currentCoursewareIndex === toIndex && fromIndex < toIndex) {
      setCurrentCoursewareIndex(toIndex - 1);
    } else if (currentCoursewareIndex === toIndex && fromIndex > toIndex) {
      setCurrentCoursewareIndex(toIndex + 1);
    } else if (currentCoursewareIndex > fromIndex && currentCoursewareIndex <= toIndex) {
      setCurrentCoursewareIndex(currentCoursewareIndex - 1);
    } else if (currentCoursewareIndex < fromIndex && currentCoursewareIndex >= toIndex) {
      setCurrentCoursewareIndex(currentCoursewareIndex + 1);
    }
  };

  // 向后兼容
  const courseware = coursewares[currentCoursewareIndex] || null;
  const setCourseware = (cw: CoursewareData | null) => {
    if (cw) {
      if (coursewares.length === 0) {
        setCoursewares([cw]);
        setCurrentCoursewareIndex(0);
      } else {
        setCoursewares((prev) => {
          const newCoursewares = [...prev];
          newCoursewares[currentCoursewareIndex] = cw;
          return newCoursewares;
        });
      }
    } else {
      setCoursewares([]);
      setCurrentCoursewareIndex(0);
    }
  };

  return (
    <CoursewareContext.Provider
      value={{
        coursewares,
        setCoursewares,
        addCourseware,
        removeCourseware,
        reorderCoursewares,
        currentCoursewareIndex,
        setCurrentCoursewareIndex,
        courseware,
        setCourseware,
        bundledCoursewares,
        bundledCoursewareGroups,
        addBundledCourseware,
        removeBundledCourseware,
      }}
    >
      {children}
    </CoursewareContext.Provider>
  );
};

export const useCourseware = () => useContext(CoursewareContext);

