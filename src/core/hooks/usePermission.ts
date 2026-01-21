// src/core/hooks/usePermission.ts
import { useMemo, useSyncExternalStore } from 'react';
import type { Permission } from '../types/auth';
import {
  getCurrentUser,
  isAuthenticated,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  subscribeAuthChanged,
} from '../services/authAccess';

export type UsePermissionReturn = {
  user: ReturnType<typeof getCurrentUser>;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
};

function snapshot() {
  return {
    user: getCurrentUser(),
    isAuthenticated: isAuthenticated(),
  };
}

export function usePermission(): UsePermissionReturn {
  const state = useSyncExternalStore(subscribeAuthChanged, snapshot, snapshot);

  return useMemo(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [state.user, state.isAuthenticated]
  );
}
