/**
 * 用户仓库管理服务
 * 处理用户绑定的Git仓库的CRUD操作
 */

import { supabase, SCHEMA, TABLES } from '../config/supabase';
import { parseUserRepoUrl } from '../utils/urlParser';
import type { Platform } from '../utils/urlParser';

export interface UserRepo {
  id: string;
  userId: string;
  platform: Platform;
  repoUrl: string;
  rawUrl: string;
  createdAt: string;
}

/**
 * 获取用户绑定的仓库列表
 */
export async function getUserRepos(userId: string): Promise<UserRepo[]> {
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
 * 添加仓库
 * 自动解析URL并转换为raw URL
 */
export async function addUserRepo(
  userId: string,
  repoUrl: string
): Promise<{ success: boolean; error?: string; repo?: UserRepo }> {
  try {
    // 解析URL
    const parsed = parseUserRepoUrl(repoUrl);
    if (!parsed) {
      return { success: false, error: '无法识别的仓库URL格式' };
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .select('id')
      .eq('user_id', userId)
      .eq('raw_url', parsed.rawUrl)
      .single();

    if (existing) {
      return { success: false, error: '该仓库已经添加过了' };
    }

    // 插入数据
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .insert({
        user_id: userId,
        platform: parsed.platform,
        repo_url: repoUrl,
        raw_url: parsed.rawUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[UserRepoService] 添加仓库失败:', error);
      return { success: false, error: error.message || '添加仓库失败' };
    }

    const repo: UserRepo = {
      id: data.id,
      userId: data.user_id,
      platform: data.platform as Platform,
      repoUrl: data.repo_url,
      rawUrl: data.raw_url,
      createdAt: data.created_at,
    };

    return { success: true, repo };
  } catch (error) {
    console.error('[UserRepoService] 添加仓库异常:', error);
    return { success: false, error: '添加仓库失败' };
  }
}

/**
 * 删除仓库
 */
export async function removeUserRepo(repoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .delete()
      .eq('id', repoId);

    if (error) {
      console.error('[UserRepoService] 删除仓库失败:', error);
      return { success: false, error: error.message || '删除仓库失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[UserRepoService] 删除仓库异常:', error);
    return { success: false, error: '删除仓库失败' };
  }
}

/**
 * 获取单个仓库信息
 */
export async function getUserRepo(repoId: string): Promise<UserRepo | null> {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .select('*')
      .eq('id', repoId)
      .single();

    if (error || !data) {
      console.error('[UserRepoService] 获取仓库信息失败:', error);
      return null;
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
    console.error('[UserRepoService] 获取仓库信息异常:', error);
    return null;
  }
}

/**
 * 更新仓库URL
 */
export async function updateUserRepo(
  repoId: string,
  newRepoUrl: string
): Promise<{ success: boolean; error?: string; repo?: UserRepo }> {
  try {
    // 解析新URL
    const parsed = parseUserRepoUrl(newRepoUrl);
    if (!parsed) {
      return { success: false, error: '无法识别的仓库URL格式' };
    }

    // 更新数据
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.USER_REPOS)
      .update({
        platform: parsed.platform,
        repo_url: newRepoUrl,
        raw_url: parsed.rawUrl,
      })
      .eq('id', repoId)
      .select()
      .single();

    if (error) {
      console.error('[UserRepoService] 更新仓库失败:', error);
      return { success: false, error: error.message || '更新仓库失败' };
    }

    const repo: UserRepo = {
      id: data.id,
      userId: data.user_id,
      platform: data.platform as Platform,
      repoUrl: data.repo_url,
      rawUrl: data.raw_url,
      createdAt: data.created_at,
    };

    return { success: true, repo };
  } catch (error) {
    console.error('[UserRepoService] 更新仓库异常:', error);
    return { success: false, error: '更新仓库失败' };
  }
}

