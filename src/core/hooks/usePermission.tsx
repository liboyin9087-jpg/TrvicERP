/**
 * 權限檢查 Hook
 * Permission Check Hook
 */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import type { Permission } from '../types/auth'; // Assuming this path is correct for Permission type

/**
 * [architect] [架構] 未定義 Config Props 的預設值介面 (中)
 * Kintone 獨立性 (架構): 確保元件可以作為獨立 Widget 被拖曳與配置。
 * 雖然這個檔案主要是 Hooks 和一個 Guard Component，而不是一個獨立的 Widget，
 * 但為了遵循規範，我們定義一個模組級別的 Config 介面，以示其可配置性。
 * 如果 PermissionGuard 本身作為一個 Kintone Widget 存在，則其 props 可以是這個 config 的子集。
 */
export interface UsePermissionConfig {
  // Add any module-level configuration here if needed.
  // For now, it might be empty or define behaviors.
}

/**
 * 權限服務接口
 * Defines the contract for any permission checking service.
 * This allows for dependency inversion and makes components/hooks independent of a specific implementation.
 */
export interface PermissionService {
  hasPermission(permission: Permission): boolean;
  hasAnyPermission(permissions: Permission[]): boolean;
  hasAllPermissions(permissions: Permission[]): boolean;
}

// [architect] [架構] 依賴全域 AuthService 而非透過 Props 或 Context 注入 (高)
// Solution: Create a Context for the PermissionService
const PermissionServiceContext = createContext<PermissionService | undefined>(undefined);

/**
 * Custom hook to get the PermissionService from context.
 * Includes error handling if the service is not provided.
 * [designer] [設計] 缺乏錯誤處理機制 (中)
 */
function usePermissionService(): PermissionService {
  const service = useContext(PermissionServiceContext);
  if (service === undefined) {
    // This error indicates a developer mistake: usePermission hooks/components are used outside a PermissionProvider.
    throw new Error('usePermission hooks and components must be used within a PermissionProvider.');
  }
  return service;
}

/**
 * Props for the PermissionProvider component.
 * It takes the PermissionService instance (or an object implementing it)
 * and the current user's permissions, which allows for dynamic updates.
 */
interface PermissionProviderProps {
  /** The current permissions of the logged-in user. This should be a reactive state from a higher level. */
  userPermissions: Permission[];
  children: React.ReactNode;
}

/**
 * PermissionProvider component.
 * Wraps part of the application to provide the PermissionService and current user permissions via context.
 * When `userPermissions` changes, all consuming hooks/components will re-render.
 *
 * [architect] [架構] 缺少對動態權限變更的處理 (中) - Handled by `userPermissions` prop and `useEffect`/`useMemo`.
 */
export function PermissionProvider({ userPermissions, children }: PermissionProviderProps) {
  // `currentPermissions` state within the provider ensures reactivity.
  // It's updated when `userPermissions` prop changes.
  const [currentPermissions, setCurrentPermissions] = useState<Permission[]>(userPermissions);

  useEffect(() => {
    setCurrentPermissions(userPermissions);
  }, [userPermissions]);

  // Create a memoized PermissionService instance that references the currentPermissions state.
  // This ensures that when currentPermissions change, the memoized service methods
  // will use the latest permissions, causing consumers to re-render.
  const reactiveService: PermissionService = useMemo(() => {
    return {
      hasPermission: (permission: Permission) => currentPermissions.includes(permission),
      hasAnyPermission: (permissions: Permission[]) =>
        permissions.some(p => currentPermissions.includes(p)),
      hasAllPermissions: (permissions: Permission[]) =>
        permissions.every(p => currentPermissions.includes(p)),
    };
  }, [currentPermissions]); // Dependency array includes currentPermissions for reactivity.

  return (
    <PermissionServiceContext.Provider value={reactiveService}>
      {children}
    </PermissionServiceContext.Provider>
  );
}

// --- Refactored Permission Check Hooks ---

/**
 * 權限檢查 Hook (單一權限)
 * Checks if the user has a specific permission.
 * [designer] [設計] PermissionGuard 的 useMemo 依賴項可能不完整 (中) - Handled by the reactive `usePermissionService` and `reactiveService` from context.
 */
export function usePermission(permission: Permission): boolean {
  const service = usePermissionService();
  return useMemo(() => {
    return service.hasPermission(permission);
  }, [permission, service]); // `service` itself is memoized and reacts to internal permission changes
}

/**
 * 權限檢查 Hook (多權限 - 任一)
 * Checks if the user has at least one of the given permissions.
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const service = usePermissionService();
  return useMemo(() => {
    return service.hasAnyPermission(permissions);
  }, [permissions, service]);
}

/**
 * 權限檢查 Hook (多權限 - 全部)
 * Checks if the user has all of the given permissions.
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const service = usePermissionService();
  return useMemo(() => {
    return service.hasAllPermissions(permissions);
  }, [permissions, service]);
}

// --- Refactored Permission Guard Components ---

/**
 * [architect] [架構] PermissionGuard 組件同時處理單一權限與多權限邏輯 (中)
 * Solution: Split into two distinct components for single vs. multiple permissions.
 * This separates concerns and makes the API clearer.
 */

/**
 * Props for the single permission guard component.
 */
interface SinglePermissionGuardProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 權限保護組件 (單一權限)
 * Displays children only if the user has the specified single permission.
 * Otherwise, displays the fallback.
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: SinglePermissionGuardProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Props for the multiple permissions guard component.
 */
interface MultiplePermissionsGuardProps {
  permissions: Permission[];
  requireAll?: boolean; // Defaults to false (hasAnyPermission)
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 權限保護組件 (多權限)
 * Displays children only if the user has the specified multiple permissions.
 * `requireAll` determines if all or any of the permissions are needed.
 */
export function PermissionsGuard({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: MultiplePermissionsGuardProps) {
  // Use the appropriate reactive hook based on `requireAll`
  const hasPermissions = requireAll
    ? useAllPermissions(permissions)
    : useAnyPermission(permissions);

  if (!hasPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}