// src/core/components/RequirePermission.tsx
import type { ReactNode } from 'react';
import type { Permission } from '../types/auth';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../services/authAccess';

type RequirePermissionProps = {
  /** 單一權限 */
  permission?: Permission;
  /** 多個權限 */
  permissions?: Permission[];
  /** permissions 模式下：true=全部需要；false=任一即可 */
  requireAll?: boolean;

  /** 沒權限時顯示的內容（若未提供，顯示預設 403） */
  fallback?: ReactNode;

  /** 沒權限時要導向的路徑（可選） */
  redirectTo?: string;

  children: ReactNode;
};

export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  fallback,
  redirectTo,
  children,
}: RequirePermissionProps) {
  // ✅ 預設允許（避免忘記傳參數就整頁被擋）
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (hasAccess) return <>{children}</>;

  if (redirectTo) {
    // 不依賴 react-router；今天要快就用這個
    window.location.assign(redirectTo);
    return null;
  }

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
        <span className="text-red-600">!</span>
      </div>
      <h2 className="text-lg font-semibold text-red-700">無權限存取</h2>
      <p className="mt-1 text-sm text-red-700/80">您沒有權限檢視此內容，請聯絡管理員。</p>
    </div>
  );
}
