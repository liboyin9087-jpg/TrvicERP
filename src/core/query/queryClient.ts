/**
 * React Query 配置
 * React Query Configuration
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { handleApiResponseError } from '@/lib/api';

/**
 * 創建 QueryClient 實例
 *
 * Note: In React Query v5, onError is handled via QueryCache/MutationCache
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // 統一錯誤處理
      if (error?.code) {
        handleApiResponseError(
          { data: null, error },
          { showToast: true, logError: true }
        );
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // 統一錯誤處理
      if (error?.code) {
        handleApiResponseError(
          { data: null, error },
          { showToast: true, logError: true }
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      // 預設配置
      staleTime: 1000 * 60 * 5, // 5 分鐘內資料視為新鮮
      gcTime: 1000 * 60 * 10, // 10 分鐘後從快取中移除
      retry: 3, // 失敗時自動重試 3 次
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指數退避
      refetchOnWindowFocus: true, // 視窗重新獲得焦點時重新獲取
      refetchOnReconnect: true, // 網路重新連接時重新獲取
      refetchOnMount: true, // 組件掛載時重新獲取（如果資料過期）
    },
    mutations: {
      // Mutation 預設配置
      retry: 1, // Mutation 只重試 1 次
    },
  },
});
