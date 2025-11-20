import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] 未配置Supabase环境变量，部分功能将不可用');
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 数据库 schema 名称
export const SCHEMA = 'reedu';

// 数据库表名常量
export const TABLES = {
  USER_REPOS: 'user_repos',
  PUBLIC_COURSEWARES: 'public_coursewares',
  COURSEWARE_LIKES: 'courseware_likes',
} as const;

