/**
 * 认证服务
 * 封装Supabase认证功能
 */

import { supabase } from '../config/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface SignInResult {
  user: AuthUser | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpResult {
  user: AuthUser | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * 用户登录
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthService] 登录失败:', error);
      return { user: null, session: null, error };
    }

    const authUser = data.user ? convertUser(data.user) : null;
    return { user: authUser, session: data.session, error: null };
  } catch (error) {
    console.error('[AuthService] 登录异常:', error);
    return { 
      user: null, 
      session: null, 
      error: error as AuthError 
    };
  }
}

/**
 * 用户注册
 */
export async function signUp(email: string, password: string): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[AuthService] 注册失败:', error);
      return { user: null, session: null, error };
    }

    const authUser = data.user ? convertUser(data.user) : null;
    return { user: authUser, session: data.session, error: null };
  } catch (error) {
    console.error('[AuthService] 注册异常:', error);
    return { 
      user: null, 
      session: null, 
      error: error as AuthError 
    };
  }
}

/**
 * 用户登出
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthService] 登出失败:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('[AuthService] 登出异常:', error);
    return { error: error as AuthError };
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[AuthService] 获取用户失败:', error);
      return null;
    }

    return user ? convertUser(user) : null;
  } catch (error) {
    console.error('[AuthService] 获取用户异常:', error);
    return null;
  }
}

/**
 * 获取当前会话
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthService] 获取会话失败:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[AuthService] 获取会话异常:', error);
    return null;
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: AuthUser | null, session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ? convertUser(session.user) : null;
    callback(user, session);
  });

  return subscription;
}

/**
 * 发送密码重置邮件
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('[AuthService] 发送密码重置邮件失败:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('[AuthService] 发送密码重置邮件异常:', error);
    return { error: error as AuthError };
  }
}

/**
 * 更新密码
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('[AuthService] 更新密码失败:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('[AuthService] 更新密码异常:', error);
    return { error: error as AuthError };
  }
}

/**
 * 转换Supabase User为AuthUser
 */
function convertUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    createdAt: user.created_at,
  };
}

