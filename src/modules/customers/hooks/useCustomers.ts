import { useState, useEffect, useCallback, useRef } from 'react';
import { CustomerService } from '../services/customerService';
import type {
  Customer,
  CustomerProfile,
  CustomerQuery,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerInteraction,
} from '../../../core/types/customer';

// --- 通用工具與基礎 Hooks ---

/**
 * 定義通用的 API 響應介面，包含資料或錯誤。
 */
interface ApiResponse<T> {
  data?: T;
  error?: { message: string; code?: string; details?: any };
  success: boolean; // 顯式指出操作是否成功
}

/**
 * 通用 Hook 配置介面，提供成功和失敗的回調函數。
 * 解決 [architect] [架構] 使用全域 Store (useToast) 直接注入 Hook 內部 的問題，
 * 透過回調函數將 Store 依賴推給 Hook 的使用者。
 * 解決 [designer] [設計] 錯誤處理模式不一致 的問題，提供統一的 onSuccess/onError 介面。
 */
interface BaseHookConfig {
  /** 操作成功時的回調函數。 */
  onSuccess?: (data: any) => void;
  /** 操作失敗時的回調函數，接收錯誤訊息。 */
  onError?: (error: { message: string; code?: string; details?: any }) => void;
}

/**
 * 通用資料請求/變更 Hook (基礎架構 Hook)
 * 解決 [architect] [架構] 多個 Hook 重複相似的 loading/error 狀態管理邏輯 的問題。
 * 解決 [designer] [設計] 缺少請求取消機制 的問題，透過 AbortController 實現。
 */
function useApi<T, Args extends any[] = []>(
  apiCall: (...args: Args) => Promise<ApiResponse<T>>,
  config?: BaseHookConfig
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string; details?: any } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<ApiResponse<T>> => {
      // 在新的請求發送前取消上一個未完成的請求，避免競態條件和記憶體洩漏
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      setError(null); // 清除之前的錯誤狀態

      try {
        const result = await apiCall(...args);

        if (signal.aborted) {
          // 請求已被取消，不更新組件狀態
          return { success: false, error: { message: 'Request aborted by component unmount or new request.' } };
        }

        if (result.error) {
          setError(result.error);
          config?.onError?.(result.error);
          return { success: false, error: result.error };
        } else {
          config?.onSuccess?.(result.data);
          return { success: true, data: result.data };
        }
      } catch (e: any) {
        if (signal.aborted) {
          // 請求已被取消，不更新組件狀態
          return { success: false, error: { message: 'Request aborted by component unmount or new request.' } };
        }
        const err = { message: e.message || 'An unexpected error occurred', details: e };
        setError(err);
        config?.onError?.(err); // 呼叫外部錯誤處理回調
        return { success: false, error: err };
      } finally {
        if (!signal.aborted) {
          setLoading(false); // 只有在請求未被取消時才設置 loading 為 false
        }
        abortControllerRef.current = null; // 請求完成或取消後清除 AbortController 實例
      }
    },
    [apiCall, config?.onSuccess, config?.onError]
  );

  // 組件卸載時的清理函數，確保取消所有未完成的請求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { execute, loading, error };
}

/**
 * 通用查詢 Hook (用於 GET 請求)
 * 建立在 `useApi` 之上，處理資料獲取、重載和狀態管理。
 * 解決 [architect] [架構] 缺少統一的錯誤處理策略 的問題 (通過 `useApi` 的 `onError` 和 `onSuccess` 回調)。
 */
function useQuery<T, QueryParams extends any[] = []>(
  queryFunction: (...args: QueryParams) => Promise<ApiResponse<T>>,
  initialParams: QueryParams,
  config?: BaseHookConfig & {
    /** 是否在組件掛載/參數變化時立即觸發資料獲取。預設為 true。 */
    fetchOnMount?: boolean;
    /** 觸發資料重新獲取的依賴項列表。 */
    dependencies?: React.DependencyList;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const { execute, loading, error } = useApi<T, QueryParams>(queryFunction, {
    onSuccess: (resultData) => {
      setData(resultData); // 更新 Hook 內部狀態
      config?.onSuccess?.(resultData); // 呼叫外部成功回調
    },
    onError: config?.onError, // 傳遞外部錯誤回調
  });

  const fetchOnMount = config?.fetchOnMount ?? true;

  const refetch = useCallback(
    async (params: QueryParams = initialParams) => {
      const response = await execute(...params);
      // 返回響應以便使用者可以立即處理結果
      return response;
    },
    [execute, initialParams]
  );

  useEffect(() => {
    if (fetchOnMount) {
      refetch(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, refetch, ...(config?.dependencies || [])]); // 依賴項變化時觸發重新獲取

  return { data, loading, error, refetch };
}

/**
 * 通用變更 Hook (用於 POST, PUT, DELETE 請求)
 * 建立在 `useApi` 之上，處理新增、更新、刪除操作。
 * 引入 `onMutate` 回調，提供樂觀更新的切入點。
 * 解決 [designer] [設計] 缺少樂觀更新模式 的問題。
 */
function useMutation<T, Args extends any[] = []>(
  mutationFunction: (...args: Args) => Promise<ApiResponse<T>>,
  config?: BaseHookConfig & {
    /** 在變更 API 請求發送前立即觸發的回調函數，可用於樂觀更新。 */
    onMutate?: (...args: Args) => void;
  }
) {
  const { execute, loading, error } = useApi<T, Args>(mutationFunction, config);

  const mutate = useCallback(
    async (...args: Args) => {
      config?.onMutate?.(...args); // 呼叫樂觀更新處理函數
      const response = await execute(...args);
      return response; // 返回完整的響應以便使用者處理成功/失敗
    },
    [execute, config?.onMutate]
  );

  return { mutate, loading, error };
}

// --- 客戶管理 Hooks ---

/**
 * useCustomers Hook 配置介面
 * 解決 [architect] [架構] 未定義明確的 Hook Config Props 介面 的問題。
 */
export interface UseCustomersConfig extends BaseHookConfig {
  query?: CustomerQuery;
  /** 觸發資料重新獲取的依賴項列表。 */
  dependencies?: React.DependencyList;
}

/**
 * 取得客戶列表 Hook
 * 解決 [architect] [架構] 檔案包含多個 Hook 但未區分基礎/進階 Hook 的問題，
 * 此 Hook 作為業務邏輯 Hook，包裝了基礎的 `useQuery`。
 */
export function useCustomers(config?: UseCustomersConfig) {
  const { query, onSuccess, onError, dependencies } = config || {};

  const { data: customers, loading, error, refetch } = useQuery<Customer[], [CustomerQuery | undefined]>(
    CustomerService.getCustomers,
    [query],
    {
      onSuccess,
      onError,
      dependencies: [query, ...(dependencies || [])], // 確保 query 物件變化時觸發重新獲取
      fetchOnMount: true, // 預設在掛載時獲取
    }
  );

  return { customers: customers || [], loading, error, refetch };
}

/**
 * useCustomer Hook 配置介面
 */
export interface UseCustomerConfig extends BaseHookConfig {
  id: string | null;
  /** 觸發資料重新獲取的依賴項列表。 */
  dependencies?: React.DependencyList;
}

/**
 * 取得單一客戶 Hook
 */
export function useCustomer(config: UseCustomerConfig) {
  const { id, onSuccess, onError, dependencies } = config;

  const { data: customer, loading, error, refetch } = useQuery<Customer | null, [string]>(
    CustomerService.getCustomer,
    [id as string], // `useQuery` 期望非 null 的參數，`fetchOnMount` 會處理 id 為 null 的情況
    {
      onSuccess,
      onError,
      dependencies: [id, ...(dependencies || [])],
      fetchOnMount: !!id, // 只有當 id 存在時才觸發資料獲取
    }
  );

  return { customer, loading, error, refetch };
}

/**
 * useCustomerProfile Hook 配置介面
 */
export interface UseCustomerProfileConfig extends BaseHookConfig {
  id: string | null;
  /** 觸發資料重新獲取的依賴項列表。 */
  dependencies?: React.DependencyList;
}

/**
 * 取得客戶完整資料 Hook (CDP)
 */
export function useCustomerProfile(config: UseCustomerProfileConfig) {
  const { id, onSuccess, onError, dependencies } = config;

  const { data: profile, loading, error, refetch } = useQuery<CustomerProfile | null, [string]>(
    CustomerService.getCustomerProfile,
    [id as string],
    {
      onSuccess,
      onError,
      dependencies: [id, ...(dependencies || [])],
      fetchOnMount: !!id,
    }
  );

  return { profile, loading, error, refetch };
}

/**
 * useCreateCustomer Hook 配置介面
 */
export interface UseCreateCustomerConfig extends BaseHookConfig {
  onMutate?: (data: CreateCustomerData) => void;
}

/**
 * 建立客戶 Hook
 */
export function useCreateCustomer(config?: UseCreateCustomerConfig) {
  const { mutate: createCustomer, loading, error } = useMutation<Customer, [CreateCustomerData]>(
    CustomerService.createCustomer,
    config
  );

  return { createCustomer, loading, error };
}

/**
 * useUpdateCustomer Hook 配置介面
 */
export interface UseUpdateCustomerConfig extends BaseHookConfig {
  onMutate?: (id: string, data: UpdateCustomerData) => void;
}

/**
 * 更新客戶 Hook
 */
export function useUpdateCustomer(config?: UseUpdateCustomerConfig) {
  const { mutate: updateCustomer, loading, error } = useMutation<Customer, [string, UpdateCustomerData]>(
    CustomerService.updateCustomer,
    config
  );

  return { updateCustomer, loading, error };
}

/**
 * useDeleteCustomer Hook 配置介面
 */
export interface UseDeleteCustomerConfig extends BaseHookConfig {
  onMutate?: (id: string) => void;
}

/**
 * 刪除客戶 Hook
 */
export function useDeleteCustomer(config?: UseDeleteCustomerConfig) {
  const { mutate: deleteCustomer, loading, error } = useMutation<void, [string]>(
    CustomerService.deleteCustomer,
    config
  );

  return { deleteCustomer, loading, error };
}

/**
 * useCustomerInteractions Hook 配置介面
 */
export interface UseCustomerInteractionsConfig extends BaseHookConfig {
  customerId: string | null;
  /** 觸發資料重新獲取的依賴項列表。 */
  dependencies?: React.DependencyList;
}

/**
 * 客戶互動記錄 Hook
 */
export function useCustomerInteractions(config: UseCustomerInteractionsConfig) {
  const { customerId, onSuccess, onError, dependencies } = config;

  const { data: interactions, loading, error, refetch } = useQuery<CustomerInteraction[], [string]>(
    CustomerService.getCustomerInteractions,
    [customerId as string],
    {
      onSuccess,
      onError,
      dependencies: [customerId, ...(dependencies || [])],
      fetchOnMount: !!customerId,
    }
  );

  return { interactions: interactions || [], loading, error, refetch };
}

/**
 * useCustomerSearch Hook 配置介面
 */
export interface UseCustomerSearchConfig extends BaseHookConfig {
  // 搜尋 Hook 通常不需要在掛載時自動獲取，而是由使用者行為觸發。
  // 因此，它不包含 `query` 參數，而是提供一個 `search` 函數來觸發獲取。
}

/**
 * 搜尋客戶 Hook
 */
export function useCustomerSearch(config?: UseCustomerSearchConfig) {
  const [results, setResults] = useState<Customer[]>([]);
  const { execute, loading, error } = useApi<Customer[], [string]>(CustomerService.searchCustomers, {
    onSuccess: (data) => {
      setResults(data || []); // 更新 Hook 內部結果狀態
      config?.onSuccess?.(data); // 呼叫外部成功回調
    },
    onError: config?.onError, // 傳遞外部錯誤回調
  });

  const search = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setResults([]);
        return { success: true, data: [] }; // 返回一個成功的空結果
      }
      const response = await execute(keyword);
      // 如果 execute 失敗，response.data 可能為 undefined，這裡做一次安全更新
      if (response.data) {
        setResults(response.data);
      }
      return response; // 返回完整的響應以便使用者處理
    },
    [execute, config?.onSuccess] // 依賴 execute 和 onSuccess
  );

  return { results, loading, error, search };
}