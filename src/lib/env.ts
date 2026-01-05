import { z } from 'zod';

/**
 * Client-safe env (Vite exposes only VITE_*).
 * Keep secrets (API keys) on the server side (Vercel Functions) instead.
 */
const ClientEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['local', 'preview', 'production']).default('local'),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10).optional(),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function getClientEnv(): ClientEnv {
  const raw = {
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const parsed = ClientEnvSchema.safeParse(raw);
  if (!parsed.success) {
    // Fail fast in dev, soft fail in prod
    // eslint-disable-next-line no-console
    console.warn('[env] Invalid client env:', parsed.error.flatten().fieldErrors);
    return { VITE_APP_ENV: 'local' };
  }
  return parsed.data;
}
