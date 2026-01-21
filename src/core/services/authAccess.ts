// src/core/services/authAccess.ts
import type { Permission, User } from '../types/auth';
import { AuthService } from './authService';

export type AuthUser = User;

const AUTH_CHANGED_EVENT = 'trvic:auth_changed';

/**
 * 統一發送 auth 變更事件（登入/登出/refresh 後請呼叫）
 * - 你可以在 authService login/logout 成功後加上 emitAuthChanged()
 */
export function emitAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

/**
 * 訂閱 auth 狀態變化
 * - 會聽同 tab 的自訂事件 + 跨 tab 的 storage 事件
 */
export function subscribeAuthChanged(cb: () => void): () => void {
  const onEvent = () => cb();
  window.addEventListener(AUTH_CHANGED_EVENT, onEvent);
  window.addEventListener('storage', onEvent);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onEvent);
    window.removeEventListener('storage', onEvent);
  };
}

/**
 * 取得當前使用者
 */
export function getCurrentUser(): AuthUser | null {
  return AuthService.getCurrentUser();
}

/**
 * 檢查是否已登入
 */
export function isAuthenticated(): boolean {
  return AuthService.isAuthenticated();
}

/**
 * 檢查是否擁有指定權限
 */
export function hasPermission(permission: Permission): boolean {
  return AuthService.hasPermission(permission);
}

/**
 * 檢查是否擁有任一權限
 */
export function hasAnyPermission(permissions: Permission[]): boolean {
  return AuthService.hasAnyPermission(permissions);
}

/**
 * 檢查是否擁有全部權限
 */
export function hasAllPermissions(permissions: Permission[]): boolean {
  return AuthService.hasAllPermissions(permissions);
}
