/**
 * URL解析和转换工具
 * 支持GitHub和Gitee仓库URL的解析和转换
 */

export type Platform = 'github' | 'gitee';

export interface ParsedRepoUrl {
  platform: Platform;
  owner: string;
  repo: string;
  rawUrl: string;
  branch?: string;
}

/**
 * 解析用户输入的仓库URL
 * 支持格式:
 * - https://github.com/user/repo
 * - https://github.com/user/repo/
 * - github.com/user/repo
 * - github/user/repo
 * - gitee/user/project
 * - https://gitee.com/user/project
 * - gitee.com/user/project
 */
export function parseUserRepoUrl(input: string, defaultBranch: string = 'main'): ParsedRepoUrl | null {
  try {
    // 清理输入
    let cleanInput = input.trim();
    
    // 如果没有协议,添加https://
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) {
      // 如果只是 github/user/repo 或 gitee/user/repo 格式
      if (cleanInput.match(/^(github|gitee)\/[^\/]+\/[^\/]+/i)) {
        const parts = cleanInput.split('/');
        const platform = parts[0].toLowerCase();
        cleanInput = `https://${platform}.com/${parts[1]}/${parts[2]}`;
      } else {
        cleanInput = `https://${cleanInput}`;
      }
    }
    
    // 移除末尾的斜杠和.git后缀
    cleanInput = cleanInput.replace(/\/$/, '').replace(/\.git$/, '');
    
    // 解析URL
    const url = new URL(cleanInput);
    const hostname = url.hostname.toLowerCase();
    
    // 判断平台
    let platform: Platform;
    if (hostname.includes('github.com') || hostname === 'github') {
      platform = 'github';
    } else if (hostname.includes('gitee.com') || hostname === 'gitee') {
      platform = 'gitee';
    } else {
      console.warn('[UrlParser] 不支持的平台:', hostname);
      return null;
    }
    
    // 解析路径: /owner/repo 或 /owner/repo/tree/branch
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      console.warn('[UrlParser] URL格式无效:', input);
      return null;
    }
    
    const owner = pathParts[0];
    const repo = pathParts[1];
    
    // 尝试从URL中提取分支名(如果有)
    let branch = defaultBranch;
    if (pathParts.length >= 4 && pathParts[2] === 'tree') {
      branch = pathParts[3];
    }
    
    // 转换为raw URL
    const rawUrl = convertToRawUrl(platform, owner, repo, branch);
    
    return {
      platform,
      owner,
      repo,
      rawUrl,
      branch,
    };
  } catch (error) {
    console.error('[UrlParser] 解析URL失败:', error);
    return null;
  }
}

/**
 * 转换为raw内容URL
 * GitHub: https://raw.githubusercontent.com/owner/repo/branch/
 * Gitee: https://gitee.com/owner/repo/raw/branch/
 */
export function convertToRawUrl(
  platform: Platform,
  owner: string,
  repo: string,
  branch: string = 'main'
): string {
  if (platform === 'github') {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  } else if (platform === 'gitee') {
    return `https://gitee.com/${owner}/${repo}/raw/${branch}/`;
  }
  throw new Error(`不支持的平台: ${platform}`);
}

/**
 * 检查URL是否为raw URL
 */
export function isRawUrl(url: string): boolean {
  return url.includes('raw.githubusercontent.com') || url.includes('/raw/');
}

/**
 * 从raw URL中提取平台信息
 */
export function parseRawUrl(rawUrl: string): ParsedRepoUrl | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === 'raw.githubusercontent.com') {
      // GitHub raw URL: https://raw.githubusercontent.com/owner/repo/branch/
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length < 3) return null;
      
      return {
        platform: 'github',
        owner: pathParts[0],
        repo: pathParts[1],
        branch: pathParts[2],
        rawUrl: rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`,
      };
    } else if (hostname.includes('gitee.com')) {
      // Gitee raw URL: https://gitee.com/owner/repo/raw/branch/
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length < 4 || pathParts[2] !== 'raw') return null;
      
      return {
        platform: 'gitee',
        owner: pathParts[0],
        repo: pathParts[1],
        branch: pathParts[3],
        rawUrl: rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`,
      };
    }
    
    return null;
  } catch (error) {
    console.error('[UrlParser] 解析raw URL失败:', error);
    return null;
  }
}

/**
 * 构建仓库的web URL
 */
export function buildRepoWebUrl(platform: Platform, owner: string, repo: string): string {
  if (platform === 'github') {
    return `https://github.com/${owner}/${repo}`;
  } else if (platform === 'gitee') {
    return `https://gitee.com/${owner}/${repo}`;
  }
  throw new Error(`不支持的平台: ${platform}`);
}

/**
 * 构建课件的URL路径
 * 格式: /:platform/:owner/:repo/:folder/:course/:pageIndex?
 */
export function buildCoursewareUrlPath(
  platform: Platform,
  owner: string,
  repo: string,
  folder: string,
  course: string,
  pageIndex?: number
): string {
  const basePath = `/${platform}/${owner}/${repo}/${encodeURIComponent(folder)}/${encodeURIComponent(course)}`;
  return pageIndex !== undefined ? `${basePath}/${pageIndex}` : basePath;
}

/**
 * 解析课件URL路径
 * 从 /:platform/:owner/:repo/:folder/:course/:pageIndex? 中提取信息
 */
export interface ParsedCoursewareUrl {
  platform: Platform;
  owner: string;
  repo: string;
  folder: string;
  course: string;
  pageIndex?: number;
  rawUrl: string;
}

export function parseCoursewareUrlPath(pathname: string, defaultBranch: string = 'main'): ParsedCoursewareUrl | null {
  try {
    // 移除开头的斜杠
    const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const parts = cleanPath.split('/');
    
    if (parts.length < 5) {
      console.warn('[UrlParser] 课件URL格式无效:', pathname);
      return null;
    }
    
    const platform = parts[0].toLowerCase() as Platform;
    if (platform !== 'github' && platform !== 'gitee') {
      return null;
    }
    
    const owner = parts[1];
    const repo = parts[2];
    const folder = decodeURIComponent(parts[3]);
    const course = decodeURIComponent(parts[4]);
    const pageIndex = parts[5] ? parseInt(parts[5], 10) : undefined;
    
    const rawUrl = convertToRawUrl(platform, owner, repo, defaultBranch);
    
    return {
      platform,
      owner,
      repo,
      folder,
      course,
      pageIndex: isNaN(pageIndex!) ? undefined : pageIndex,
      rawUrl,
    };
  } catch (error) {
    console.error('[UrlParser] 解析课件URL失败:', error);
    return null;
  }
}

/**
 * 验证URL格式
 */
export function validateRepoUrl(input: string): { valid: boolean; error?: string } {
  const parsed = parseUserRepoUrl(input);
  if (!parsed) {
    return { valid: false, error: '无法识别的仓库URL格式' };
  }
  return { valid: true };
}

