import { QueryFunction, QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Customer, Order } from '../../types';

export * from './useCustomerQueries';
export * from './useOrderQueries';

export function useCustomQuery<TData = unknown, TError = AxiosError>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>(queryKey, queryFn, {
    ...options,
    onError: (error) => {
      console.error('Query error:', error);
      options?.onError?.(error);
    }
  });
}

export function useCustomerQuery(customerId: string) {
  return useCustomQuery<Customer>(['customer', customerId], async () => {
    const response = await fetch(`/api/customers/${customerId}`);
    if (!response.ok) throw new Error('Failed to fetch customer');
    return response.json();
  });
}

export function useOrderQuery(orderId: string) {
  return useCustomQuery<Order>(['order', orderId], async () => {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  });
}