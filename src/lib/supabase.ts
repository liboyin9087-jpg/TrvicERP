/**
 * Supabase Client Configuration
 * Supabase 客戶端配置
 * 
 * 統一使用 Supabase 作為後端服務，支援自動更新和實時同步
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
 * 配置自動更新、實時同步和會話管理
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
        flowType: 'pkce', // 使用 PKCE 流程提高安全性
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        // 自動重連配置
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      },
      global: {
        headers: {
          'x-client-info': 'trvic-erp-web@2.0.0',
        },
      },
      db: {
        schema: 'public',
      },
    });

    // 監聽連接狀態變化
    client.realtime.onOpen(() => {
      console.log('[Supabase] Realtime connection opened');
    });

    client.realtime.onClose(() => {
      console.log('[Supabase] Realtime connection closed');
    });

    client.realtime.onError((error) => {
      console.error('[Supabase] Realtime error:', error);
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
 * 重置 Supabase 客戶端（用於重新連接）
 */
export function resetSupabaseClient(): void {
  if (supabaseClient) {
    supabaseClient.realtime.disconnect();
    supabaseClient = null;
  }
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
