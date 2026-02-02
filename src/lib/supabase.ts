import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Whether Supabase is properly configured with environment variables.
 */
export const isSupabaseConfigured: boolean = !!(supabaseUrl && supabaseAnonKey);

/**
 * Supabase client instance.
 * Returns null when environment variables are not configured (e.g. mock mode).
 */
export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured) {
    // 在非 Mock 模式下，警告 Supabase 未設定
    if (import.meta.env.VITE_USE_MOCK === 'false') {
      console.warn(
        '[Supabase] ⚠️ Supabase 環境變數未設定！\n' +
        '請在 Vercel Dashboard 或 .env.local 設定以下變數：\n' +
        '- VITE_SUPABASE_URL\n' +
        '- VITE_SUPABASE_ANON_KEY\n\n' +
        '取得方式：Supabase Dashboard → Settings → API'
      );
    }
    return null;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    
    if (import.meta.env.DEV) {
      console.log('[Supabase] ✅ Client initialized successfully');
    }
    
    return client;
  } catch (error) {
    console.error('[Supabase] ❌ Failed to initialize client:', error);
    return null;
  }
})();

/**
 * Get Supabase connection status for diagnostics
 */
export function getSupabaseStatus(): {
  configured: boolean;
  url: string;
  hasKey: boolean;
} {
  return {
    configured: isSupabaseConfigured,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '(not set)',
    hasKey: !!supabaseAnonKey,
  };
}
