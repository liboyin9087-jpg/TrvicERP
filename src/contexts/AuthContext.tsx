/**
 * Auth Context - 統一 API 介面 (修復版)
 * 
 * 支援：
 * 1. Supabase Auth (生產環境)
 * 2. Demo Mode (開發環境，無需 Supabase)
 * 
 * API 統一為：
 * - auth: AuthState 物件
 * - login(credentials): 登入
 * - logout(): 登出
 * - usingSupabase: boolean
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, User as SupabaseUser, Session, AuthError, SupabaseClient } from '@supabase/supabase-js';
import type { User, Role, AuthState } from '../types';

// ==============================================
// Configuration
// ==============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// ==============================================
// Demo Mode Users (僅開發環境)
// ==============================================

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: { id: 'demo-admin', username: 'admin', name: '系統管理員', role: 'ADMIN' },
  },
  boss: {
    password: 'boss123',
    user: { id: 'demo-boss', username: 'boss', name: '旅行社老闆', role: 'BOSS' },
  },
  client: {
    password: 'client123',
    user: { id: 'demo-client', username: 'client', name: '福委會代表', role: 'CLIENT' },
  },
  hr: {
    password: 'hr123',
    user: { id: 'demo-hr', username: 'hr', name: 'HR 人資', role: 'HR' },
  },
  staff: {
    password: 'staff123',
    user: { id: 'demo-staff', username: 'staff', name: '員工/導遊', role: 'EMPLOYEE' },
  },
};

// ==============================================
// Types
// ==============================================

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
  role: 'welfare_committee' | 'travel_agency' | 'employee' | 'admin';
}

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  usingSupabase: boolean;
}

// ==============================================
// Context
// ==============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ==============================================
// Helper: Map Supabase User to App User
// ==============================================

function mapSupabaseUser(supabaseUser: SupabaseUser, role: Role = 'EMPLOYEE'): User {
  return {
    id: supabaseUser.id,
    username: supabaseUser.email || supabaseUser.id,
    name: supabaseUser.user_metadata?.display_name || supabaseUser.email || 'User',
    role,
    avatarUrl: supabaseUser.user_metadata?.avatar_url,
  };
}

// ==============================================
// Provider
// ==============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // 獲取使用者角色（從 profiles 表）
  const fetchUserRole = useCallback(async (userId: string): Promise<Role> => {
    if (!supabase) return 'EMPLOYEE';
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error || !data?.role) return 'EMPLOYEE';
      
      // 映射 Supabase role 到 App role
      const roleMap: Record<string, Role> = {
        'admin': 'ADMIN',
        'welfare_committee': 'CLIENT',
        'travel_agency': 'BOSS',
        'employee': 'EMPLOYEE',
      };
      
      return roleMap[data.role] || 'EMPLOYEE';
    } catch {
      return 'EMPLOYEE';
    }
  }, []);

  // 初始化：檢查現有 Session
  useEffect(() => {
    if (!supabase) {
      // Demo Mode: 檢查 localStorage
      const savedUser = localStorage.getItem('trvicerp_demo_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          setAuth({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
        } catch {
          localStorage.removeItem('trvicerp_demo_user');
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    // Supabase Mode
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session?.user) {
        setAuth({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: error?.message || null,
        });
        return;
      }

      const role = await fetchUserRole(session.user.id);
      setAuth({
        isAuthenticated: true,
        user: mapSupabaseUser(session.user, role),
        isLoading: false,
        error: null,
      });
    });

    // 監聽 Auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);

        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          setAuth({
            isAuthenticated: true,
            user: mapSupabaseUser(session.user, role),
            isLoading: false,
            error: null,
          });
        } else {
          setAuth({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  // 登入
  const login = async ({ username, password }: LoginCredentials) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    if (!supabase) {
      // Demo Mode
      const demoUser = DEMO_USERS[username.toLowerCase()];
      
      if (demoUser && demoUser.password === password) {
        localStorage.setItem('trvicerp_demo_user', JSON.stringify(demoUser.user));
        setAuth({
          isAuthenticated: true,
          user: demoUser.user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuth({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: '帳號或密碼錯誤',
        });
      }
      return;
    }

    // Supabase Mode: 假設 username 是 email
    const email = username.includes('@') ? username : `${username}@demo.trvicerp.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuth({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.message,
      });
      return;
    }

    if (data.user) {
      const role = await fetchUserRole(data.user.id);
      setAuth({
        isAuthenticated: true,
        user: mapSupabaseUser(data.user, role),
        isLoading: false,
        error: null,
      });
    }
  };

  // 註冊
  const signup = async ({ email, password, displayName, role }: SignupCredentials) => {
    if (!supabase) {
      setAuth(prev => ({ ...prev, error: 'Demo 模式不支援註冊功能' }));
      return;
    }

    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role,
        },
      },
    });

    if (error) {
      setAuth({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.message,
      });
      return;
    }

    if (data.user) {
      const appRole = {
        'admin': 'ADMIN' as Role,
        'welfare_committee': 'CLIENT' as Role,
        'travel_agency': 'BOSS' as Role,
        'employee': 'EMPLOYEE' as Role,
      }[role] || 'EMPLOYEE' as Role;

      setAuth({
        isAuthenticated: true,
        user: mapSupabaseUser(data.user, appRole),
        isLoading: false,
        error: null,
      });
    }
  };

  // 登出
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('trvicerp_demo_user');
    }

    setAuth({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    auth,
    login,
    signup,
    logout,
    usingSupabase: isSupabaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==============================================
// Hook
// ==============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
