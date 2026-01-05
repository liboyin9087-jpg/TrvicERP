import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function getSupabaseUrl(): string {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('SUPABASE_URL is not set');
  return url;
}

export function getServiceKey(): string {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (set it via `supabase secrets set` )');
  return key;
}

export function getAnonKey(): string {
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new Error('SUPABASE_ANON_KEY is not set');
  return key;
}

export function createServiceClient() {
  return createClient(getSupabaseUrl(), getServiceKey(), {
    auth: { persistSession: false },
  });
}

export function createAnonClient(authHeader?: string) {
  // If authHeader is provided, pass it through so RLS policies apply to that user
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: { persistSession: false },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
}
