import type { ApiError } from './api';

export type ServiceError = ApiError;

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };
