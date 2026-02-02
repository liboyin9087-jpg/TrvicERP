/**
 * Environment Configuration
 *
 * Central source of truth for all environment variables.
 * In production (Vercel), VITE_USE_MOCK should be set to 'false'
 * and VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must be configured.
 */

export interface EnvConfig {
  apiUrl: string;
  aiApiUrl: string;
  wsUrl: string;
  lineApiUrl: string;
  env: string;
  isDev: boolean;
  isProd: boolean;
  useMock: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// --- Core environment values ---

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_VERSION: string = import.meta.env.VITE_API_VERSION || 'v1';
export const MOCK_LATENCY_MS: number = parseInt(import.meta.env.VITE_MOCK_LATENCY_MS || '120', 10);

// Supabase
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Mock mode logic:
 * - In production builds (import.meta.env.PROD === true), mock is OFF by default
 *   unless explicitly set VITE_USE_MOCK=true.
 * - In development, mock is ON by default unless VITE_USE_MOCK=false.
 *
 * This ensures Vercel deployments always connect to real Supabase
 * without requiring extra env var configuration.
 */
function resolveMockMode(): boolean {
  const envValue = import.meta.env.VITE_USE_MOCK;

  // Explicit override takes precedence
  if (envValue === 'false') return false;
  if (envValue === 'true') return true;

  // No explicit value: production defaults to real, dev defaults to mock
  return !import.meta.env.PROD;
}

export const USE_MOCK_API: boolean = resolveMockMode();

export const getEnvConfig = (): EnvConfig => {
  return {
    apiUrl: API_BASE_URL,
    aiApiUrl: import.meta.env.VITE_AI_API_URL || '',
    wsUrl: import.meta.env.VITE_WS_URL || '',
    lineApiUrl: import.meta.env.VITE_LINE_API_URL || '',
    env: import.meta.env.MODE || 'development',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    useMock: USE_MOCK_API,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  };
};
