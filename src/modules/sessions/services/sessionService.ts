export class ApiError extends Error {
  public readonly statusCode?: number;
  public readonly errorCode?: string;
  public readonly originalError: any;

  constructor(originalError: any, message?: string) {
    // Attempt to extract more details from originalError if it's an AxiosError or similar
    const detailedMessage = message || originalError?.response?.data?.message || originalError?.message || 'An API error occurred.';
    super(detailedMessage);
    this.name = 'ApiError';
    this.originalError = originalError;
    // Assuming originalError might be an Axios error object with a response property
    this.statusCode = originalError?.response?.status;
    this.errorCode = originalError?.response?.data?.code; // Assuming backend sends a specific error code

    // Proper prototype chaining for custom errors
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class ResourceNotFoundError extends ApiError {
  constructor(id: string, resourceType: string = 'Resource') {
    super(null, `${resourceType} with ID '${id}' not found.`);
    this.name = 'ResourceNotFoundError';
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

/**
 * Handles API responses that are expected to return a single entity.
 * Throws ApiError on API failure, ResourceNotFoundError if data is null.
 */
async function _handleSingleEntityResponse<T>(
  apiCall: Promise<{ data: T | null; error: any }>,
  id: string,
  resourceType: string = 'Resource'
): Promise<T> {
  const response = await apiCall;
  if (response.error) {
    throw new ApiError(response.error, `Failed to fetch ${resourceType} (ID: ${id}).`);
  }
  if (response.data === null) {
    throw new ResourceNotFoundError(id, resourceType);
  }
  return response.data;
}

/**
 * Handles API responses that are expected to return a list of entities.
 * Throws ApiError on API failure, returns empty array if data is null or empty.
 */
async function _handleListEntityResponse<T>(
  apiCall: Promise<{ data: T[] | null; error: any }>,
  resourceType: string = 'Resource list'
): Promise<T[]> {
  const response = await apiCall;
  if (response.error) {
    throw new ApiError(response.error, `Failed to fetch ${resourceType}.`);
  }
  return response.data || [];
}

/**
 * Handles API responses for operations that create or update an entity.
 * Throws ApiError on API failure. Returns the entity or null if API returns no content (e.g., 204).
 */
async function _handleCreateUpdateEntityResponse<T>(
  apiCall: Promise<{ data: T | null; error: any }>,
  resourceType: string = 'Resource'
): Promise<T | null> {
  const response = await apiCall;
  if (response.error) {
    throw new ApiError(response.error, `Failed to ${resourceType}.`);
  }
  return response.data; // Can be null if the API sends 204 No Content, for example.
}

/**
 * Handles API responses for delete operations.
 * Throws ApiError on API failure. Resolves void on success.
 */
async function _handleDeleteResponse(
  apiCall: Promise<{ data: null; error: any }>,
  id: string,
  resourceType: string = 'Resource'
): Promise<void> {
  const response = await apiCall;
  if (response.error) {
    throw new ApiError(response.error, `Failed to delete ${resourceType} (ID: ${id}).`);
  }
  return;
}

/**
 * 團次管理服務層
 * Session Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Session,
  CreateSessionData,
  UpdateSessionData,
  SessionQuery,
  SessionStatus, // Still used for typing UpdateSessionData, but not for validation logic here.
} from '../../../core/types/session';
// Removed isValidSessionTransition as the state transition validation logic
// should not be embedded directly in the service layer's update method.
// This logic should be handled by a higher-level application service or business logic layer.

/**
 * 團次服務
 */
export class SessionService {
  private apiInstance: typeof api;

  /**
   * 服務層構造函數
   * 允許透過依賴注入來提供 API 客戶端實例，提高測試性和擴展性。
   * @param apiClient API 客戶端實例，預設為全域的 api 實例。
   */
  constructor(apiClient: typeof api = api) {
    this.apiInstance = apiClient;
  }

  /**
   * Helper to build URLSearchParams from a query object.
   * Centralizes URL parameter construction logic to avoid repetition and inconsistency.
   */
  private _buildSearchParams(query?: SessionQuery): URLSearchParams {
    const params = new URLSearchParams();
    if (query) {
      if (query.tourId) params.append('tourId', query.tourId);
      if (query.status) {
        if (Array.isArray(query.status)) {
          params.append('status', query.status.join(','));
        } else {
          params.append('status', query.status);
        }
      }
      if (query.groupType) params.append('groupType', query.groupType);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      // Ensure page and limit are converted to string as URLSearchParams expects strings.
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
    }
    return params;
  }

  /**
   * 取得團次列表
   * @param query 查詢條件
   * @returns 團次列表
   * @throws ApiError 如果 API 請求失敗
   */
  async getSessions(query?: SessionQuery): Promise<Session[]> {
    const params = this._buildSearchParams(query);
    const endpoint = `${API_ENDPOINTS.sessions.list}?${params.toString()}`;
    return _handleListEntityResponse(this.apiInstance.get<Session[]>(endpoint), 'sessions list');
  }

  /**
   * 取得單一團次
   * @param id 團次 ID
   * @returns 單一團次資料
   * @throws ResourceNotFoundError 如果找不到團次
   * @throws ApiError 如果 API 請求失敗
   */
  async getSession(id: string): Promise<Session> {
    return _handleSingleEntityResponse(this.apiInstance.get<Session>(API_ENDPOINTS.sessions.detail(id)), id, 'session');
  }

  /**
   * 建立團次
   * @param data 建立團次資料
   * @returns 建立成功的團次資料，或 null 如果 API 回傳無內容
   * @throws ApiError 如果 API 請求失敗
   */
  async createSession(data: CreateSessionData): Promise<Session | null> {
    return _handleCreateUpdateEntityResponse(this.apiInstance.post<Session>(API_ENDPOINTS.sessions.create, data), 'create session');
  }

  /**
   * 更新團次
   * @param id 團次 ID
   * @param data 更新團次資料
   * @returns 更新後的團次資料，或 null 如果 API 回傳無內容
   * @throws ApiError 如果 API 請求失敗
   *
   * 狀態轉換驗證邏輯已移除。此服務方法現在專注於與 API 互動。
   * 任何業務邏輯，例如團次狀態的有效轉換，都應在呼叫此服務方法之前由更高層次的業務邏輯或應用程式服務處理。
   */
  async updateSession(id: string, data: UpdateSessionData): Promise<Session | null> {
    return _handleCreateUpdateEntityResponse(this.apiInstance.patch<Session>(API_ENDPOINTS.sessions.update(id), data), 'update session');
  }

  /**
   * 刪除團次
   * @param id 團次 ID
   * @returns void
   * @throws ApiError 如果 API 請求失敗
   */
  async deleteSession(id: string): Promise<void> {
    return _handleDeleteResponse(this.apiInstance.delete(API_ENDPOINTS.sessions.delete(id)), id, 'session');
  }

  /**
   * 取得行程下的所有團次
   * @param tourId 行程 ID
   * @returns 該行程下的所有團次列表
   * @throws ApiError 如果 API 請求失敗
   */
  async getSessionsByTour(tourId: string): Promise<Session[]> {
    // Note: This endpoint is specific to 'tours' but fetches 'sessions'.
    // The resourceType for error messages should reflect the actual data being fetched.
    return _handleListEntityResponse(this.apiInstance.get<Session[]>(API_ENDPOINTS.tours.sessions(tourId)), `sessions for tour ${tourId}`);
  }
}

// 導出一個 SessionService 的實例，方便在應用程式中直接使用。
// 如果需要替換依賴（例如進行單元測試），可以直接導入 SessionService 類並傳入模擬的 apiClient。
export default new SessionService();