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
