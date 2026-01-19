/**
 * Supabase Client Configuration
 * Supabase 客戶端配置
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 環境變數
 * 使用環境變數或預設值（生產環境建議使用環境變數）
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ktsxyjkoiwcvpddfvgns.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3h5amtvaXdjdnBkZGZ2Z25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzk0OTUsImV4cCI6MjA4MjkxNTQ5NX0.yqTaKhdfe2IMgdp9j8sOOD7dTdBeMVKIK80hJzlDbww';

/**
 * 檢查 Supabase 配置是否完整
 */
function validateSupabaseConfig(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    );
    return false;
  }
  return true;
}

/**
 * 建立 Supabase 客戶端
 * 如果配置不完整，返回 null（應用程式將回退到 REST API）
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (!validateSupabaseConfig()) {
    return null;
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return client;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return null;
  }
}

/**
 * 單例 Supabase 客戶端
 * Singleton Supabase Client
 */
let supabaseClient: SupabaseClient | null = null;

/**
 * 取得 Supabase 客戶端實例
 * Get Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

/**
 * 檢查是否已配置 Supabase
 */
export function isSupabaseConfigured(): boolean {
  return validateSupabaseConfig();
}

/**
 * 預設匯出（用於向後兼容）
 */
export const supabase = getSupabaseClient();

export default supabase;
