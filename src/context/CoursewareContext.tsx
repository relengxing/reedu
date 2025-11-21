import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CoursewareData, CoursewareGroup } from '../types';
import { loadCoursewaresFromRepos, getCoursewareRepos, saveCoursewareRepos, addCoursewareRepo, removeCoursewareRepo, type CoursewareRepoConfig } from '../services/coursewareLoader';
import { useAuth } from './AuthContext';
import * as userRepoService from '../services/userRepoService';

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
  // 仓库信息（用于生成语义化URL）
  platform?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  filePath?: string;
}

// 从localStorage恢复课件列表
// 接受外部课件列表作为参数，用于恢复外部仓库的课件
const restoreCoursewares = (externalCoursewares: CoursewareData[] = []): CoursewareData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const storedList: StoredCourseware[] = JSON.parse(stored);
    const restored: CoursewareData[] = [];
    
    for (const item of storedList) {
      if (item.isBundled && item.sourcePath) {
        // 从外部加载的资源中恢复
        const found = externalCoursewares.find(cw => cw.sourcePath === item.sourcePath);
        if (found) {
          // 使用找到的完整数据（包括fullHTML），但保留localStorage中的仓库信息（以防外部数据缺失）
          restored.push({
            ...found,
            platform: found.platform || item.platform,
            owner: found.owner || item.owner,
            repo: found.repo || item.repo,
            branch: found.branch || item.branch,
            filePath: found.filePath || item.filePath,
          });
        } else if (item.platform && item.owner && item.repo) {
          // 如果外部资源未加载，但localStorage中有仓库信息
          // 由于没有fullHTML，跳过缓存数据，等待外部资源加载
          console.warn(`[CoursewareContext] 外部资源未加载，跳过缓存课件（缺少fullHTML）: ${item.sourcePath}`);
          continue;
        } else {
          console.warn(`[CoursewareContext] 无法找到课件且缺少仓库信息: ${item.sourcePath}`);
        }
      } else if (item.fullHTML) {
        // 用户本地上传的课件，恢复完整数据
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
    console.log(`[CoursewareContext] 恢复的课件页数:`, restored.map(cw => `${cw.title}: ${cw.pages.length}页`));
    console.log(`[CoursewareContext] 恢复的课件fullHTML状态:`, restored.map(cw => `${cw.title}: ${cw.fullHTML ? (cw.fullHTML.length > 100 ? `${(cw.fullHTML.length / 1024).toFixed(1)}KB` : 'empty') : 'null'}`));
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
        // 预编译课件存储标识和仓库信息，也保存pages字段（元数据较小）
        return {
          sourcePath: cw.sourcePath,
          isBundled: true,
          // 保存仓库信息（用于生成语义化URL）
          platform: cw.platform,
          owner: cw.owner,
          repo: cw.repo,
          branch: cw.branch,
          filePath: cw.filePath,
          groupId: cw.groupId,
          title: cw.title,
          // 保存pages字段，这样恢复时就有页面信息了
          pages: cw.pages,
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
  // 使用的课件列表（从用户仓库加载的 + 用户本地上传的）
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
  // 课件资源管理（从用户仓库加载的课件）
  bundledCoursewares: CoursewareData[]; // 所有可用的课件资源
  bundledCoursewareGroups: CoursewareGroup[]; // 所有可用的课件组
  addBundledCourseware: (courseware: CoursewareData) => void; // 从资源中选择课件使用
  removeBundledCourseware: (sourcePath: string) => void; // 从使用的课件中移除（但资源仍然存在）
  // 用户仓库管理
  loadFromRepos: (repos?: CoursewareRepoConfig[]) => Promise<void>; // 从仓库加载课件
  loadUserRepos: () => Promise<void>; // 加载用户绑定的仓库
  isLoading: boolean; // 是否正在加载
  repoConfigs: CoursewareRepoConfig[]; // 当前仓库配置列表（已废弃，使用Supabase管理）
  addRepo: (repo: CoursewareRepoConfig) => void; // 添加仓库（已废弃）
  removeRepo: (baseUrl: string) => void; // 删除仓库（已废弃）
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
  loadFromRepos: async () => {},
  isLoading: false,
  repoConfigs: [],
  addRepo: () => {},
  removeRepo: () => {},
});

export const CoursewareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // 外部加载的课件和组
  const [externalCoursewares, setExternalCoursewares] = useState<CoursewareData[]>([]);
  const [externalGroups, setExternalGroups] = useState<CoursewareGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [repoConfigs, setRepoConfigs] = useState<CoursewareRepoConfig[]>(() => {
    return getCoursewareRepos();
  });
  
  // 防止重复加载的标志
  const [hasLoadedUserRepos, setHasLoadedUserRepos] = useState(false);

  // 只使用外部加载的课件（删除编译期课件）
  const allBundledCoursewares = externalCoursewares;
  const allBundledGroups = externalGroups;

  // 使用的课件列表（从用户仓库加载的 + 用户本地上传的）
  // 从localStorage恢复
  const [coursewares, setCoursewares] = useState<CoursewareData[]>(() => {
    const restored = restoreCoursewares([]);
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

  // 从外部仓库加载课件
  const loadFromRepos = async (repos?: CoursewareRepoConfig[]) => {
    setIsLoading(true);
    try {
      const loadRepos = repos || repoConfigs;
      if (loadRepos.length === 0) {
        throw new Error('未配置课件仓库URL');
      }

      const { coursewares: loadedCoursewares, groups: loadedGroups } = await loadCoursewaresFromRepos(loadRepos);
      
      setExternalCoursewares(loadedCoursewares);
      setExternalGroups(loadedGroups);
      
      // 外部课件加载完成后，重新恢复课件列表（以便恢复外部仓库的课件）
      const restored = restoreCoursewares(loadedCoursewares);
      
      // 检查是否需要更新coursewares
      let needsUpdate = false;
      
      // 1. 如果课件数量不同，需要更新
      if (restored.length !== coursewares.length) {
        needsUpdate = true;
        console.log(`[CoursewareContext] 课件数量变化: ${coursewares.length} -> ${restored.length}`);
      }
      
      // 2. 如果有课件的fullHTML为空，需要更新
      if (!needsUpdate && coursewares.some(cw => !cw.fullHTML || cw.fullHTML.trim() === '')) {
        needsUpdate = true;
        console.log(`[CoursewareContext] 检测到课件缺少fullHTML，需要更新`);
      }
      
      // 3. 如果有新的课件被恢复，需要更新
      if (!needsUpdate) {
        const currentSourcePaths = new Set(coursewares.map(cw => cw.sourcePath).filter(Boolean));
        const hasNewCoursewares = restored.some(cw => cw.sourcePath && !currentSourcePaths.has(cw.sourcePath));
        if (hasNewCoursewares) {
          needsUpdate = true;
          console.log(`[CoursewareContext] 检测到新课件`);
        }
      }
      
      if (needsUpdate) {
        console.log(`[CoursewareContext] 外部课件加载完成，更新课件列表: ${restored.length} 个（之前: ${coursewares.length} 个）`);
        setCoursewares(restored);
      } else {
        console.log(`[CoursewareContext] 外部课件加载完成，coursewares 无需更新`);
      }
      
      console.log('[CoursewareContext] 成功从外部仓库加载课件');
    } catch (error) {
      console.error('[CoursewareContext] 从外部仓库加载课件失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 添加仓库
  const addRepo = (repo: CoursewareRepoConfig) => {
    addCoursewareRepo(repo);
    const updatedRepos = getCoursewareRepos();
    setRepoConfigs(updatedRepos);
  };

  // 删除仓库
  const removeRepo = (baseUrl: string) => {
    removeCoursewareRepo(baseUrl);
    const updatedRepos = getCoursewareRepos();
    setRepoConfigs(updatedRepos);
  };

  // 用户登录后，自动加载用户绑定的仓库
  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedUserRepos && !isLoading) {
      console.log('[CoursewareContext] 用户已登录，加载用户仓库');
      setHasLoadedUserRepos(true);
      loadUserRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // 加载用户仓库的课件
  const loadUserRepos = async () => {
    // 防止重复加载
    if (hasLoadedUserRepos) {
      console.log('[CoursewareContext] 已加载过用户仓库，跳过重复加载');
      return;
    }
    
    if (isLoading) {
      console.log('[CoursewareContext] 正在加载中，跳过重复请求');
      return;
    }
    
    setHasLoadedUserRepos(true);
    setIsLoading(true);
    try {
      // 获取用户的仓库列表（云端或本地）
      const userId = user?.id; // 如果未登录，user?.id 为 undefined
      const userRepos = await userRepoService.getUserRepos(userId);
      console.log('[CoursewareContext] 获取到仓库:', userRepos.length, userId ? '(云端)' : '(本地)');
      console.log('[CoursewareContext] 仓库详情:', userRepos.map(r => ({ id: r.id, url: r.rawUrl })));
      
      if (userRepos.length === 0) {
        console.log('[CoursewareContext] 没有绑定仓库');
        setIsLoading(false);
        return;
      }

      // 转换为CoursewareRepoConfig格式
      const repoConfigs: CoursewareRepoConfig[] = userRepos.map(repo => ({
        baseUrl: repo.rawUrl,
      }));

      console.log('[CoursewareContext] 转换后的仓库配置:', repoConfigs);

      // 加载所有仓库的课件
      await loadFromRepos(repoConfigs);
    } catch (error) {
      console.error('[CoursewareContext] 加载用户仓库失败:', error);
      // 加载失败时重置标志，允许重试
      setHasLoadedUserRepos(false);
    } finally {
      setIsLoading(false);
    }
  };

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
      // 检查是否已存在相同的课件（通过sourcePath或完整仓库信息判断）
      const isDuplicate = prev.some(cw => {
        if (courseware.sourcePath && cw.sourcePath === courseware.sourcePath) {
          return true;
        }
        if (courseware.platform && courseware.owner && courseware.repo && courseware.filePath &&
            cw.platform === courseware.platform &&
            cw.owner === courseware.owner &&
            cw.repo === courseware.repo &&
            cw.filePath === courseware.filePath) {
          return true;
        }
        return false;
      });

      if (isDuplicate) {
        console.log('[CoursewareContext] 课件已存在，跳过添加:', courseware.title);
        return prev; // 不添加重复课件
      }

      const newIndex = prev.length;
      setCurrentCoursewareIndex(newIndex); // 设置为新添加的课件索引
      // 根据课件是否已有isBundled标记来设置
      const newCourseware = { 
        ...courseware, 
        isBundled: courseware.isBundled !== undefined ? courseware.isBundled : false 
      };
      console.log('[CoursewareContext] 添加新课件:', newCourseware.title, '索引:', newIndex);
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
        bundledCoursewares: allBundledCoursewares,
        bundledCoursewareGroups: allBundledGroups,
        addBundledCourseware,
        removeBundledCourseware,
        loadFromRepos,
        loadUserRepos,
        isLoading,
        repoConfigs,
        addRepo,
        removeRepo,
      }}
    >
      {children}
    </CoursewareContext.Provider>
  );
};

export const useCourseware = () => useContext(CoursewareContext);

