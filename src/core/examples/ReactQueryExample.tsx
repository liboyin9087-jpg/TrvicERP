/**
 * React Query 使用範例
 * React Query Usage Example
 *
 * 展示如何使用 React Query + BaseService 替代傳統的 useState + useEffect
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../query/hooks/useCustomerQueries';
import { queryKeys } from '../query/queryKeys';
import { CustomerStatus, CustomerType } from '@/core/types/customer';
import type { Customer } from '@/core/types/customer';
import { Loading } from '@/components/shared/Loading';

/**
 * 客戶列表組件（使用 React Query）
 *
 * ✨ 優勢對比：
 *
 * ❌ 傳統做法：
 * - 需要手動管理 loading, error, data 狀態
 * - 需要 useEffect 觸發 fetch
 * - 容易出現 Race Condition
 * - 沒有快取，每次切換頁面都重新載入
 *
 * ✅ React Query 做法：
 * - 一行代碼獲得所有狀態
 * - 自動管理 loading/error
 * - 自動快取和去重
 * - 自動重試
 */
export function CustomerListExample() {
  // ✨ 一行代碼獲得所有狀態管理
  const {
    data: customers,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomers();

  // Mutation hooks
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // 處理建立客戶
  const handleCreate = async () => {
    await createMutation.mutateAsync({
      type: CustomerType.INDIVIDUAL,
      name: '新客戶',
      email: 'new@example.com',
      // ... 其他欄位
    } as any);
    // 不需要手動 refetch，React Query 會自動更新列表
  };

  // 處理更新客戶
  const handleUpdate = async (id: string) => {
    await updateMutation.mutateAsync({
      id,
      data: { name: '更新後的姓名' } as any,
    });
    // 自動更新快取，不需要手動 setState
  };

  // 處理刪除客戶
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    // 自動從快取移除，列表自動更新
  };

  if (isLoading) {
    return <Loading />; // 自動管理的 loading 狀態
  }

  if (isError) {
    return (
      <div>
        <p>錯誤：{error?.message}</p>
        <button onClick={() => refetch()}>重試</button>
      </div>
    );
  }

  return (
    <div>
      <h2>客戶列表</h2>

      {/* 建立按鈕 */}
      <button onClick={handleCreate} disabled={createMutation.isPending}>
        {createMutation.isPending ? '建立中...' : '建立客戶'}
      </button>

      {/* 客戶列表 */}
      <ul>
        {customers?.map((customer) => (
          <li key={customer.id}>
            {customer.name}
            <button
              onClick={() => handleUpdate(customer.id)}
              disabled={updateMutation.isPending}
            >
              更新
            </button>
            <button
              onClick={() => handleDelete(customer.id)}
              disabled={deleteMutation.isPending}
            >
              刪除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 使用範例：帶篩選的客戶列表
 */
export function CustomerListWithFiltersExample() {
  const [filters, setFilters] = React.useState<{ status: CustomerStatus }>({
    status: CustomerStatus.ACTIVE,
  });

  // 當 filters 改變時，React Query 會自動重新獲取
  const { data: customers, isLoading } = useCustomers(filters);

  return (
    <div>
      <select
        value={filters.status}
        onChange={(e) =>
          setFilters({ ...filters, status: e.target.value as CustomerStatus })
        }
      >
        <option value={CustomerStatus.ACTIVE}>活躍</option>
        <option value={CustomerStatus.INACTIVE}>非活躍</option>
        <option value={CustomerStatus.BLOCKED}>已封鎖</option>
      </select>

      {isLoading ? (
        <Loading />
      ) : (
        <ul>
          {customers?.map((customer) => (
            <li key={customer.id}>{customer.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 樂觀更新的 Context 類型
 */
interface OptimisticUpdateContext {
  previousCustomer: Customer | undefined;
}

/**
 * 使用範例：樂觀更新（Optimistic Updates）
 */
export function OptimisticUpdateExample() {
  const queryClient = useQueryClient();

  const handleOptimisticUpdate = async (id: string, newName: string) => {
    // 取消正在進行的查詢，避免覆蓋樂觀更新
    await queryClient.cancelQueries({
      queryKey: queryKeys.customers.detail(id),
    });

    // 保存當前快取值
    const previousCustomer = queryClient.getQueryData<Customer>(
      queryKeys.customers.detail(id)
    );

    // 樂觀更新快取
    queryClient.setQueryData<Customer>(
      queryKeys.customers.detail(id),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          name: newName,
        };
      }
    );

    try {
      // 發送實際請求
      // await CustomerService.updateCustomer(id, { name: newName });

      // 成功後重新獲取最新數據
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(id),
      });
    } catch (error) {
      // 如果失敗，回滾到之前的狀態
      if (previousCustomer) {
        queryClient.setQueryData(
          queryKeys.customers.detail(id),
          previousCustomer
        );
      }
      throw error;
    }
  };

  return null; // 示例組件
}
