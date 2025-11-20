/**
 * 认证上下文
 * 管理全局用户登录状态
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as authService from '../services/authService';
import type { AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'Not implemented' }),
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：获取当前用户
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        const currentSession = await authService.getSession();
        setUser(currentUser);
        setSession(currentSession);
      } catch (error) {
        console.error('[AuthContext] 初始化认证失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    const subscription = authService.onAuthStateChange((newUser, newSession) => {
      console.log('[AuthContext] 认证状态变化:', newUser ? '已登录' : '未登录');
      setUser(newUser);
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    if (error) {
      return { error: error.message || '登录失败' };
    }
    // 用户状态会通过onAuthStateChange自动更新
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await authService.signUp(email, password);
    if (error) {
      return { error: error.message || '注册失败' };
    }
    // 用户状态会通过onAuthStateChange自动更新
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      console.error('[AuthContext] 登出失败:', error);
    }
    // 用户状态会通过onAuthStateChange自动更新
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email);
    if (error) {
      return { error: error.message || '发送密码重置邮件失败' };
    }
    return { error: null };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

