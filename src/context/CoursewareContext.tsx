import React, { createContext, useContext } from 'react';
import type { CoursewareData } from '../types';

interface CoursewareContextType {
  courseware: CoursewareData | null;
  setCourseware: (courseware: CoursewareData | null) => void;
}

export const CoursewareContext = createContext<CoursewareContextType>({
  courseware: null,
  setCourseware: () => {},
});

export const useCourseware = () => useContext(CoursewareContext);

