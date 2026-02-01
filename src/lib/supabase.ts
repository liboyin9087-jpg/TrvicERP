import { createClient, type SupabaseClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Whether Supabase is properly configured with environment variables.
 */
export const isSupabaseConfigured: boolean = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

/**
 * Create Supabase client with production-ready configuration.
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Supabase] Not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable.'
      );
    }
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'trvic-supabase-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-app-name': 'trvicerp',
      },
    },
    db: {
      schema: 'public',
    },
  });
}

/**
 * Supabase client singleton.
 * Returns null when environment variables are not configured (e.g. mock mode).
 */
export const supabase: SupabaseClient | null = createSupabaseClient();

/**
 * Auth state change listener type.
 */
export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

/**
 * Subscribe to Supabase auth state changes.
 * Returns an unsubscribe function, or a no-op if Supabase is not configured.
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  if (!supabase) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/**
 * Get current Supabase session. Returns null if not configured or no session.
 */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Supabase] Failed to get session:', error.message);
    return null;
  }
  return session;
}

/**
 * Get current access token. Returns null if not available.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
