type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };
type DateTimeString = string & { readonly __brand: 'DateTimeString' };
type Token = string & { readonly __brand: 'Token' };

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  OPERATOR = 'operator',
  FINANCE = 'finance',
  WELFARE = 'welfare',
  TRAVELER = 'traveler'
}

export enum Permission {
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',
  ORDER_DELETE = 'order:delete',
  ORDER_CANCEL = 'order:cancel',
  ORDER_REFUND = 'order:refund',
  QUOTATION_CREATE = 'quotation:create',
  QUOTATION_READ = 'quotation:read',
  QUOTATION_UPDATE = 'quotation:update',
  QUOTATION_DELETE = 'quotation:delete',
  QUOTATION_CONVERT = 'quotation:convert',
  ITINERARY_CREATE = 'itinerary:create',
  ITINERARY_READ = 'itinerary:read',
  ITINERARY_UPDATE = 'itinerary:update',
  ITINERARY_DELETE = 'itinerary:delete',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_EXPORT = 'financial:export',
  FINANCIAL_APPROVE = 'financial:approve',
  ADMIN_MANAGE = 'admin:manage',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_USERS = 'admin:users'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_DELETE, Permission.ORDER_CANCEL, Permission.ORDER_REFUND,
    Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE, Permission.QUOTATION_DELETE, Permission.QUOTATION_CONVERT,
    Permission.ITINERARY_CREATE, Permission.ITINERARY_READ, Permission.ITINERARY_UPDATE, Permission.ITINERARY_DELETE,
    Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE, Permission.CUSTOMER_DELETE,
    Permission.FINANCIAL_VIEW, Permission.FINANCIAL_EXPORT, Permission.FINANCIAL_APPROVE,
    Permission.ADMIN_MANAGE, Permission.ADMIN_SETTINGS, Permission.ADMIN_USERS,
  ],
  [UserRole.MANAGER]: [
    Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_CANCEL,
    Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE, Permission.QUOTATION_CONVERT,
    Permission.ITINERARY_CREATE, Permission.ITINERARY_READ, Permission.ITINERARY_UPDATE,
    Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE,
    Permission.FINANCIAL_VIEW, Permission.FINANCIAL_EXPORT,
  ],
  [UserRole.SALES]: [
    Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE,
    Permission.QUOTATION_CREATE, Permission.QUOTATION_READ, Permission.QUOTATION_UPDATE, Permission.QUOTATION_CONVERT,
    Permission.ITINERARY_READ,
    Permission.CUSTOMER_CREATE, Permission.CUSTOMER_READ, Permission.CUSTOMER_UPDATE,
  ],
  [UserRole.OPERATOR]: [
    Permission.ORDER_READ, Permission.ORDER_UPDATE,
    Permission.QUOTATION_READ,
    Permission.ITINERARY_CREATE, Permission.ITINERARY_READ, Permission.ITINERARY_UPDATE,
    Permission.CUSTOMER_READ,
  ],
  [UserRole.FINANCE]: [
    Permission.ORDER_READ,
    Permission.QUOTATION_READ,
    Permission.CUSTOMER_READ,
    Permission.FINANCIAL_VIEW, Permission.FINANCIAL_EXPORT,
  ],
  [UserRole.WELFARE]: [
    Permission.ORDER_READ,
    Permission.ITINERARY_READ,
  ],
  [UserRole.TRAVELER]: [
    Permission.ORDER_READ,
    Permission.ITINERARY_READ,
  ],
};

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface User {
  id: UserId;
  email: Email;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLogin: DateTimeString | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export interface LoginCredentials {
  email: Email;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User | null;
  token: Token | null;
  refreshToken: Token | null;
  error: string | null;
}

export interface TokenPayload {
  userId: UserId;
  email: Email;
  role: UserRole;
  permissions: Permission[];
  exp: number;
  iat: number;
}

export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return permissions.some(permission => user.permissions.includes(permission));
}

export function hasAllPermissions(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return permissions.every(permission => user.permissions.includes(permission));
}