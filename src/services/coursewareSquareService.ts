/**
 * 课件广场服务
 * 处理公开课件的发布、搜索、点赞等功能
 */

import { supabase, SCHEMA, TABLES } from '../config/supabase';

export interface PublicCourseware {
  id: string;
  userId: string;
  repoUrl: string;
  groupId: string;
  groupName: string;
  title: string;
  description?: string;
  likesCount: number;
  viewsCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userEmail?: string; // 作者邮箱(关联查询)
  isLiked?: boolean; // 当前用户是否已点赞
}

export interface CoursewareFilters {
  search?: string;
  sortBy?: 'latest' | 'popular' | 'likes';
  page?: number;
  pageSize?: number;
}

/**
 * 获取公开课件列表
 */
export async function getPublicCoursewares(
  filters: CoursewareFilters = {},
  currentUserId?: string
): Promise<{ coursewares: PublicCourseware[]; total: number }> {
  try {
    const {
      search,
      sortBy = 'latest',
      page = 1,
      pageSize = 20,
    } = filters;

    let query = supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .select('*, auth.users(email)', { count: 'exact' })
      .eq('is_public', true);

    // 搜索
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // 排序
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      query = query.order('views_count', { ascending: false });
    } else if (sortBy === 'likes') {
      query = query.order('likes_count', { ascending: false });
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[CoursewareSquareService] 获取公开课件列表失败:', error);
      return { coursewares: [], total: 0 };
    }

    // 如果有当前用户,查询点赞状态
    let likedCoursewareIds = new Set<string>();
    if (currentUserId && data && data.length > 0) {
      const coursewareIds = data.map(c => c.id);
      const { data: likes } = await supabase
        .schema(SCHEMA)
        .from(TABLES.COURSEWARE_LIKES)
        .select('courseware_id')
        .eq('user_id', currentUserId)
        .in('courseware_id', coursewareIds);

      if (likes) {
        likedCoursewareIds = new Set(likes.map(like => like.courseware_id));
      }
    }

    const coursewares: PublicCourseware[] = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      repoUrl: row.repo_url,
      groupId: row.group_id,
      groupName: row.group_name,
      title: row.title,
      description: row.description,
      likesCount: row.likes_count || 0,
      viewsCount: row.views_count || 0,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userEmail: row.users?.email,
      isLiked: likedCoursewareIds.has(row.id),
    }));

    return { coursewares, total: count || 0 };
  } catch (error) {
    console.error('[CoursewareSquareService] 获取公开课件列表异常:', error);
    return { coursewares: [], total: 0 };
  }
}

/**
 * 获取单个公开课件详情
 */
export async function getCoursewareDetail(
  coursewareId: string,
  currentUserId?: string
): Promise<PublicCourseware | null> {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .select('*, auth.users(email)')
      .eq('id', coursewareId)
      .eq('is_public', true)
      .single();

    if (error || !data) {
      console.error('[CoursewareSquareService] 获取课件详情失败:', error);
      return null;
    }

    // 查询当前用户是否已点赞
    let isLiked = false;
    if (currentUserId) {
      const { data: like } = await supabase
        .schema(SCHEMA)
        .from(TABLES.COURSEWARE_LIKES)
        .select('id')
        .eq('user_id', currentUserId)
        .eq('courseware_id', coursewareId)
        .single();

      isLiked = !!like;
    }

    return {
      id: data.id,
      userId: data.user_id,
      repoUrl: data.repo_url,
      groupId: data.group_id,
      groupName: data.group_name,
      title: data.title,
      description: data.description,
      likesCount: data.likes_count || 0,
      viewsCount: data.views_count || 0,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userEmail: data.users?.email,
      isLiked,
    };
  } catch (error) {
    console.error('[CoursewareSquareService] 获取课件详情异常:', error);
    return null;
  }
}

/**
 * 发布课件
 */
export async function publishCourseware(
  userId: string,
  repoUrl: string,
  groupId: string,
  groupName: string,
  title: string,
  description?: string
): Promise<{ success: boolean; error?: string; courseware?: PublicCourseware }> {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .upsert({
        user_id: userId,
        repo_url: repoUrl,
        group_id: groupId,
        group_name: groupName,
        title,
        description,
        is_public: true,
      }, {
        onConflict: 'user_id,repo_url,group_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[CoursewareSquareService] 发布课件失败:', error);
      return { success: false, error: error.message || '发布课件失败' };
    }

    const courseware: PublicCourseware = {
      id: data.id,
      userId: data.user_id,
      repoUrl: data.repo_url,
      groupId: data.group_id,
      groupName: data.group_name,
      title: data.title,
      description: data.description,
      likesCount: data.likes_count || 0,
      viewsCount: data.views_count || 0,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, courseware };
  } catch (error) {
    console.error('[CoursewareSquareService] 发布课件异常:', error);
    return { success: false, error: '发布课件失败' };
  }
}

/**
 * 取消发布课件
 */
export async function unpublishCourseware(
  coursewareId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .update({ is_public: false })
      .eq('id', coursewareId);

    if (error) {
      console.error('[CoursewareSquareService] 取消发布失败:', error);
      return { success: false, error: error.message || '取消发布失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CoursewareSquareService] 取消发布异常:', error);
    return { success: false, error: '取消发布失败' };
  }
}

/**
 * 点赞课件
 */
export async function likeCourseware(
  coursewareId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.COURSEWARE_LIKES)
      .insert({
        user_id: userId,
        courseware_id: coursewareId,
      });

    if (error) {
      // 如果是重复点赞(unique约束),忽略错误
      if (error.code === '23505') {
        return { success: true };
      }
      console.error('[CoursewareSquareService] 点赞失败:', error);
      return { success: false, error: error.message || '点赞失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CoursewareSquareService] 点赞异常:', error);
    return { success: false, error: '点赞失败' };
  }
}

/**
 * 取消点赞
 */
export async function unlikeCourseware(
  coursewareId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.COURSEWARE_LIKES)
      .delete()
      .eq('user_id', userId)
      .eq('courseware_id', coursewareId);

    if (error) {
      console.error('[CoursewareSquareService] 取消点赞失败:', error);
      return { success: false, error: error.message || '取消点赞失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CoursewareSquareService] 取消点赞异常:', error);
    return { success: false, error: '取消点赞失败' };
  }
}

/**
 * 增加浏览次数
 */
export async function incrementViewCount(coursewareId: string): Promise<void> {
  try {
    // 使用RPC调用SECURITY DEFINER函数,避免RLS和竞态条件
    await supabase
      .schema(SCHEMA)
      .rpc('increment_view_count', { courseware_uuid: coursewareId });
  } catch (error) {
    console.error('[CoursewareSquareService] 增加浏览次数失败:', error);
  }
}

/**
 * 获取用户的公开课件列表
 */
export async function getUserPublicCoursewares(userId: string): Promise<PublicCourseware[]> {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoursewareSquareService] 获取用户课件列表失败:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      repoUrl: row.repo_url,
      groupId: row.group_id,
      groupName: row.group_name,
      title: row.title,
      description: row.description,
      likesCount: row.likes_count || 0,
      viewsCount: row.views_count || 0,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('[CoursewareSquareService] 获取用户课件列表异常:', error);
    return [];
  }
}

/**
 * 更新课件信息
 */
export async function updateCourseware(
  coursewareId: string,
  updates: {
    title?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .update(updates)
      .eq('id', coursewareId);

    if (error) {
      console.error('[CoursewareSquareService] 更新课件失败:', error);
      return { success: false, error: error.message || '更新课件失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CoursewareSquareService] 更新课件异常:', error);
    return { success: false, error: '更新课件失败' };
  }
}

/**
 * 删除课件
 */
export async function deleteCourseware(coursewareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .schema(SCHEMA)
      .from(TABLES.PUBLIC_COURSEWARES)
      .delete()
      .eq('id', coursewareId);

    if (error) {
      console.error('[CoursewareSquareService] 删除课件失败:', error);
      return { success: false, error: error.message || '删除课件失败' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CoursewareSquareService] 删除课件异常:', error);
    return { success: false, error: '删除课件失败' };
  }
}

