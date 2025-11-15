export interface Page {
  id: string;
  title: string;
  sectionSelector: string; // section的CSS选择器（如 #page1 或 [data-section="2"]）
  index: number;
}

export interface CoursewareData {
  title: string;
  pages: Page[]; // 用于目录导航，包含section信息
  fullHTML: string; // 完整的HTML内容（瀑布式）
  metadata?: {
    subject?: string;
    grade?: string;
    semester?: string;
    author?: string;
    unit?: string;
    version?: string;
  };
}

