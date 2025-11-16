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
  // 课件组信息
  groupId?: string; // 课件组ID（文件夹名）
  groupName?: string; // 课件组名称
  // 资源标识
  isBundled?: boolean; // 是否为预编译课件
  sourcePath?: string; // 源文件路径
}

// 课件组
export interface CoursewareGroup {
  id: string; // 组ID（文件夹名）
  name: string; // 组名称
  coursewares: CoursewareData[]; // 该组下的所有课件
}

