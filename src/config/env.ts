/**
 * Environment Configuration
 */

export interface EnvConfig {
  apiUrl: string;
  aiApiUrl: string;
  wsUrl: string;
  lineApiUrl: string;
  env: string;
  isDev: boolean;
  isProd: boolean;
}

export const getEnvConfig = (): EnvConfig => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || '',
    aiApiUrl: import.meta.env.VITE_AI_API_URL || '',
    wsUrl: import.meta.env.VITE_WS_URL || '',
    lineApiUrl: import.meta.env.VITE_LINE_API_URL || '',
    env: import.meta.env.MODE || 'development',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  };
};

// Export individual environment variables for backward compatibility
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_VERSION: string = import.meta.env.VITE_API_VERSION || 'v1';
export const USE_MOCK_API: boolean = import.meta.env.VITE_USE_MOCK !== 'false';
export const MOCK_LATENCY_MS: number = parseInt(import.meta.env.VITE_MOCK_LATENCY_MS || '120', 10);
