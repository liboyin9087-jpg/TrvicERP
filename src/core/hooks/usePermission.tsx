/**
 * 權限檢查 Hook
 * Permission Check Hook
 */

import { useMemo } from 'react';
import { AuthService } from '../services/authService';
import type { Permission } from '../types/auth';

/**
 * 權限檢查 Hook
 */
export function usePermission(permission: Permission): boolean {
  return useMemo(() => {
    return AuthService.hasPermission(permission);
  }, [permission]);
}

/**
 * 多權限檢查 Hook（任一）
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  return useMemo(() => {
    return AuthService.hasAnyPermission(permissions);
  }, [permissions]);
}

/**
 * 多權限檢查 Hook（全部）
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  return useMemo(() => {
    return AuthService.hasAllPermissions(permissions);
  }, [permissions]);
}

/**
 * 權限保護組件 Props
 */
interface PermissionGuardProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 權限保護組件
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasPermission = useMemo(() => {
    if (Array.isArray(permission)) {
      return requireAll
        ? AuthService.hasAllPermissions(permission)
        : AuthService.hasAnyPermission(permission);
    }
    return AuthService.hasPermission(permission);
  }, [permission, requireAll]);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
