import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Supabase client instance.
 * Returns null when environment variables are not configured (e.g. mock mode).
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Whether Supabase is properly configured with environment variables.
 */
export const isSupabaseConfigured: boolean = !!(supabaseUrl && supabaseAnonKey);
