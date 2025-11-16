import React, { createContext, useContext, useState } from 'react';
import type { CoursewareData } from '../types';
import { bundledCoursewares } from '../coursewares';

interface CoursewareContextType {
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
});

export const CoursewareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初始化时加载编译期导入的课件
  const [coursewares, setCoursewares] = useState<CoursewareData[]>(() => {
    // 如果存在编译期导入的课件，则使用它们
    if (bundledCoursewares.length > 0) {
      console.log('[CoursewareContext] 初始化时加载编译期课件:', bundledCoursewares.length, '个');
      return [...bundledCoursewares];
    }
    console.log('[CoursewareContext] 未找到编译期课件');
    return [];
  });
  const [currentCoursewareIndex, setCurrentCoursewareIndex] = useState<number>(0);

  const addCourseware = (courseware: CoursewareData) => {
    setCoursewares((prev) => {
      const newIndex = prev.length;
      setCurrentCoursewareIndex(newIndex); // 设置为新添加的课件索引
      return [...prev, courseware];
    });
  };

  const removeCourseware = (index: number) => {
    setCoursewares((prev) => prev.filter((_, i) => i !== index));
    if (currentCoursewareIndex >= index && currentCoursewareIndex > 0) {
      setCurrentCoursewareIndex(currentCoursewareIndex - 1);
    }
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
      }}
    >
      {children}
    </CoursewareContext.Provider>
  );
};

export const useCourseware = () => useContext(CoursewareContext);

