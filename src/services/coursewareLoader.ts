/**
 * 课件加载服务
 * 支持从外部git仓库加载课件
 */

import type { CoursewareData, CoursewareGroup } from '../types';
import { parseHTMLCourseware, setAudioPathMap } from '../utils/coursewareParser';
import { parseRawUrl, type ParsedRepoUrl } from '../utils/urlParser';

/**
 * 从raw URL解析仓库信息
 */
function parseRepoInfoFromRawUrl(rawUrl: string): ParsedRepoUrl | null {
  return parseRawUrl(rawUrl);
}

// 课件仓库配置（简化版，URL中已包含分支）
export interface CoursewareRepoConfig {
  // Git仓库的raw内容URL（必须包含分支，例如：https://raw.githubusercontent.com/user/repo/main/）
  baseUrl: string;
}

// localStorage键名
const STORAGE_KEY = 'reedu_courseware_repos';

/**
 * 获取所有仓库配置
 */
export function getCoursewareRepos(): CoursewareRepoConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const repos = JSON.parse(stored) as CoursewareRepoConfig[];
      return repos;
    }
    // 如果没有存储的配置，返回空数组
    return [];
  } catch (error) {
    console.error('[CoursewareLoader] 读取仓库配置失败:', error);
    return [];
  }
}

/**
 * 保存仓库配置
 */
export function saveCoursewareRepos(repos: CoursewareRepoConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
    console.log('[CoursewareLoader] 已保存仓库配置:', repos);
  } catch (error) {
    console.error('[CoursewareLoader] 保存仓库配置失败:', error);
  }
}

/**
 * 将GitHub仓库URL转换为raw URL
 * 例如：https://github.com/user/repo -> https://raw.githubusercontent.com/user/repo/main/
 */
export function convertGitHubUrlToRaw(githubUrl: string, branch: string = 'main'): string {
  // 如果已经是raw URL，直接返回
  if (githubUrl.includes('raw.githubusercontent.com')) {
    return githubUrl.endsWith('/') ? githubUrl : `${githubUrl}/`;
  }
  
  // 匹配GitHub仓库URL格式
  // https://github.com/user/repo 或 https://github.com/user/repo/
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    const [, owner, repo] = match;
    // 移除可能的 .git 后缀
    const repoName = repo.replace(/\.git$/, '');
    return `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/`;
  }
  
  // 如果无法转换，返回原URL
  return githubUrl;
}

/**
 * 添加仓库
 */
export function addCoursewareRepo(repo: CoursewareRepoConfig) {
  const repos = getCoursewareRepos();
  // 自动转换GitHub URL
  const rawUrl = convertGitHubUrlToRaw(repo.baseUrl);
  const finalRepo = { baseUrl: rawUrl };
  
  // 检查是否已存在
  if (!repos.some(r => r.baseUrl === finalRepo.baseUrl)) {
    repos.push(finalRepo);
    saveCoursewareRepos(repos);
  }
}

/**
 * 删除仓库
 */
export function removeCoursewareRepo(baseUrl: string) {
  const repos = getCoursewareRepos();
  const filtered = repos.filter(r => r.baseUrl !== baseUrl);
  saveCoursewareRepos(filtered);
}

/**
 * 从URL加载文件内容
 */
async function fetchFileContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`[CoursewareLoader] 加载文件失败: ${url}`, error);
    throw error;
  }
}


/**
 * 加载manifest.json文件（包含课件列表信息）
 */
async function loadManifest(config: CoursewareRepoConfig): Promise<{
  groups: Array<{
    id: string;
    name: string;
    files: string[];
  }>;
}> {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
  const manifestUrl = `${baseUrl}manifest.json`;
  
  try {
    const content = await fetchFileContent(manifestUrl);
    const manifest = JSON.parse(content);
    return manifest;
  } catch (error) {
    console.error('[CoursewareLoader] 加载manifest.json失败:', error);
    // 返回空manifest
    return { groups: [] };
  }
}

/**
 * 构建文件的完整URL
 */
function buildFileUrl(filePath: string, config: CoursewareRepoConfig): string {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
  return `${baseUrl}${filePath}`;
}

/**
 * 构建音频文件的URL
 */
function buildAudioUrl(audioPath: string, config: CoursewareRepoConfig, groupPath: string): string {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
  // 如果音频路径是相对路径，需要基于组路径解析
  if (audioPath.startsWith('./')) {
    const groupDir = groupPath.split('/').slice(0, -1).join('/');
    const relativePath = audioPath.replace(/^\.\//, '');
    return `${baseUrl}${groupDir}/${relativePath}`;
  }
  return `${baseUrl}${audioPath}`;
}

/**
 * 从单个仓库加载课件
 */
async function loadCoursewaresFromSingleRepo(config: CoursewareRepoConfig): Promise<{
  coursewares: CoursewareData[];
  groups: CoursewareGroup[];
}> {
  console.log('[CoursewareLoader] 开始从仓库加载课件:', config.baseUrl);

  // 解析仓库信息
  const repoInfo = parseRepoInfoFromRawUrl(config.baseUrl);
  if (!repoInfo) {
    console.error('[CoursewareLoader] 无法解析仓库信息:', config.baseUrl);
    return { coursewares: [], groups: [] };
  }

  // 加载manifest.json
  const manifest = await loadManifest(config);
  
  const allCoursewares: CoursewareData[] = [];
  const coursewareGroups: CoursewareGroup[] = [];
  const audioPathMap = new Map<string, string>();

  // 处理每个课件组
  for (const groupInfo of manifest.groups) {
    const groupId = groupInfo.id;
    const groupName = groupInfo.name;
    const groupCoursewares: CoursewareData[] = [];

    // 加载该组的所有课件
    for (const filePath of groupInfo.files) {
      try {
        const fileUrl = buildFileUrl(filePath, config);
        console.log(`[CoursewareLoader] 加载课件: ${filePath}`);
        
        const htmlContent = await fetchFileContent(fileUrl);
        const filename = filePath.split('/').pop()?.replace(/\.html$/, '') || '未命名';
        
        // 先处理音频文件路径，提取课件中的音频路径并转换为完整URL
        const audioRegex = /new\s+Audio\s*\(\s*(['"])([^'"]+\.mp3)\1\s*\)/g;
        let match;
        while ((match = audioRegex.exec(htmlContent)) !== null) {
          const audioPath = match[2];
          const audioUrl = buildAudioUrl(audioPath, config, filePath);
          audioPathMap.set(audioPath, audioUrl);
          audioPathMap.set(`./${audioPath}`, audioUrl);
        }
        
        // 设置音频路径映射到解析器（在解析之前）
        setAudioPathMap(audioPathMap);
        
        // 解析课件（此时音频路径会被自动替换）
        const courseware = parseHTMLCourseware(htmlContent, filename);
        courseware.isBundled = true;
        // 使用 baseUrl + filePath 作为唯一标识，避免不同仓库的相同路径冲突
        courseware.sourcePath = `${config.baseUrl}${filePath}`;
        courseware.groupId = groupId;
        courseware.groupName = groupName;
        // 添加仓库信息
        courseware.platform = repoInfo.platform;
        courseware.owner = repoInfo.owner;
        courseware.repo = repoInfo.repo;
        courseware.branch = repoInfo.branch || 'main';
        courseware.filePath = filePath;

        groupCoursewares.push(courseware);
        allCoursewares.push(courseware);
        
        console.log(`[CoursewareLoader] 成功加载课件: ${groupName}/${filename}`);
      } catch (error) {
        console.error(`[CoursewareLoader] 加载课件失败: ${filePath}`, error);
      }
    }

    // 创建课件组
    if (groupCoursewares.length > 0) {
      // 使用语义化的课程ID：platform/owner/repo/folder
      const folder = groupId; // 文件夹名就是groupId
      const courseId = `${repoInfo.platform}/${repoInfo.owner}/${repoInfo.repo}/${folder}`;
      
      coursewareGroups.push({
        id: groupId,
        name: groupName,
        courseId: courseId,
        coursewares: groupCoursewares,
        // 添加仓库信息
        platform: repoInfo.platform,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch: repoInfo.branch || 'main',
        folder: folder,
      });
    }
  }

  // 最终设置音频路径映射（确保所有音频路径都已处理）
  setAudioPathMap(audioPathMap);

  console.log(`[CoursewareLoader] 从仓库 ${config.baseUrl} 成功加载 ${allCoursewares.length} 个课件，分为 ${coursewareGroups.length} 个组`);
  
  return {
    coursewares: allCoursewares,
    groups: coursewareGroups,
  };
}

/**
 * 从多个仓库加载所有课件
 */
export async function loadCoursewaresFromRepos(repos?: CoursewareRepoConfig[]): Promise<{
  coursewares: CoursewareData[];
  groups: CoursewareGroup[];
}> {
  const repoList = repos || getCoursewareRepos();
  
  if (repoList.length === 0) {
    throw new Error('未配置课件仓库URL');
  }

  console.log(`[CoursewareLoader] 开始从 ${repoList.length} 个仓库加载课件`);

  const allCoursewares: CoursewareData[] = [];
  const allGroups: CoursewareGroup[] = [];
  const groupMap = new Map<string, CoursewareGroup>(); // 用于合并相同ID的组

  // 从每个仓库加载课件
  for (const repo of repoList) {
    try {
      const { coursewares, groups } = await loadCoursewaresFromSingleRepo(repo);
      
      // 合并课件
      allCoursewares.push(...coursewares);
      
      // 合并课件组（如果组ID相同，合并课件列表）
      for (const group of groups) {
        const existingGroup = groupMap.get(group.id);
        if (existingGroup) {
          // 合并课件列表，避免重复
          const existingPaths = new Set(existingGroup.coursewares.map(cw => cw.sourcePath));
          const newCoursewares = group.coursewares.filter(cw => !existingPaths.has(cw.sourcePath));
          existingGroup.coursewares.push(...newCoursewares);
        } else {
          groupMap.set(group.id, { ...group });
        }
      }
    } catch (error) {
      console.error(`[CoursewareLoader] 从仓库 ${repo.baseUrl} 加载失败:`, error);
      // 继续加载其他仓库
    }
  }

  // 转换为数组
  allGroups.push(...Array.from(groupMap.values()));

  console.log(`[CoursewareLoader] 总共加载 ${allCoursewares.length} 个课件，分为 ${allGroups.length} 个组`);
  
  return {
    coursewares: allCoursewares,
    groups: allGroups,
  };
}

