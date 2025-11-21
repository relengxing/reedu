/**
 * 用户仓库管理服务
 * 支持云端存储（Supabase）和本地存储（localStorage）
 */

import { supabase, SCHEMA, TABLES } from '../config/supabase';
import { parseUserRepoUrl } from '../utils/urlParser';
import type { Platform } from '../utils/urlParser';

// localStorage 键名
const LOCAL_REPOS_KEY = 'reedu_local_repos';

export interface UserRepo {
  id: string;
  userId: string;
  platform: Platform;
  repoUrl: string;
  rawUrl: string;
  createdAt: string;
}

/**
 * 从本地存储获取仓库
 */
function getLocalRepos(): UserRepo[] {
  try {
    const stored = localStorage.getItem(LOCAL_REPOS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[UserRepoService] 读取本地仓库失败:', error);
    return [];
  }
}

/**
 * 保存仓库到本地存储
 */
function saveLocalRepos(repos: UserRepo[]): void {
  try {
    localStorage.setItem(LOCAL_REPOS_KEY, JSON.stringify(repos));
  } catch (error) {
    console.error('[UserRepoService] 保存本地仓库失败:', error);
    throw error;
  }
}

/**
 * 获取用户绑定的仓库列表
 * 如果没有 userId（未登录），返回本地仓库
 */
export async function getUserRepos(userId?: string): Promise<UserRepo[]> {
  // 未登录，返回本地仓库
  if (!userId) {
    console.log('[UserRepoService] 未登录，返回本地仓库');
    return getLocalRepos();
  }

  // 已登录，从云端获取
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UserRepoService] 获取用户仓库列表失败:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      platform: row.platform as Platform,
      repoUrl: row.repo_url,
      rawUrl: row.raw_url,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('[UserRepoService] 获取用户仓库列表异常:', error);
    return [];
  }
}

/**
 * 添加新仓库
 * 如果没有 userId（未登录），保存到本地
 */
export async function addUserRepo(userId: string | undefined, repoUrl: string): Promise<UserRepo> {
  // 解析仓库URL
  const parsed = parseUserRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error('无效的仓库URL');
  }

  // 未登录，保存到本地
  if (!userId) {
    console.log('[UserRepoService] 未登录，保存到本地');
    const localRepos = getLocalRepos();
    const newRepo: UserRepo = {
      id: `local_${Date.now()}`,
      userId: 'local',
      platform: parsed.platform,
      repoUrl: parsed.repoUrl,
      rawUrl: parsed.rawUrl,
      createdAt: new Date().toISOString(),
    };
    localRepos.push(newRepo);
    saveLocalRepos(localRepos);
    return newRepo;
  }

  // 已登录，保存到云端
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .insert({
        user_id: userId,
        platform: parsed.platform,
        repo_url: parsed.repoUrl,
        raw_url: parsed.rawUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[UserRepoService] 添加仓库失败:', error);
      throw new Error(`添加仓库失败: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      platform: data.platform as Platform,
      repoUrl: data.repo_url,
      rawUrl: data.raw_url,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('[UserRepoService] 添加仓库异常:', error);
    throw error;
  }
}

/**
 * 删除仓库
 * 如果是本地仓库ID（以 local_ 开头），从本地删除
 */
export async function deleteUserRepo(repoId: string): Promise<void> {
  // 本地仓库
  if (repoId.startsWith('local_')) {
    console.log('[UserRepoService] 删除本地仓库:', repoId);
    const localRepos = getLocalRepos();
    const filteredRepos = localRepos.filter(r => r.id !== repoId);
    saveLocalRepos(filteredRepos);
    return;
  }

  // 云端仓库
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .delete()
      .eq('id', repoId);

    if (error) {
      console.error('[UserRepoService] 删除仓库失败:', error);
      throw new Error(`删除仓库失败: ${error.message}`);
    }
  } catch (error) {
    console.error('[UserRepoService] 删除仓库异常:', error);
    throw error;
  }
}

/**
 * 解析用户仓库URL并验证
 */
export { parseUserRepoUrl };
