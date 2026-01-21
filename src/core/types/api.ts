import type { ApiResponse as LibApiResponse } from '../../lib/api';

export { ApiError } from '../../lib/api';
export type ApiResponse<T> = LibApiResponse<T>;
