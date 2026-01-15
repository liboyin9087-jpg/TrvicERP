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
  SessionStatus,
} from '../../../core/types/session';
import { isValidSessionTransition } from '../../../core/types/session';

/**
 * 團次服務
 */
export class SessionService {
  /**
   * 取得團次列表
   */
  static async getSessions(query?: SessionQuery): Promise<{
    data: Session[] | null;
    error: any;
  }> {
    const params = new URLSearchParams();
    if (query?.tourId) params.append('tourId', query.tourId);
    if (query?.status) {
      if (Array.isArray(query.status)) {
        params.append('status', query.status.join(','));
      } else {
        params.append('status', query.status);
      }
    }
    if (query?.groupType) params.append('groupType', query.groupType);
    if (query?.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query?.dateTo) params.append('dateTo', query.dateTo);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const endpoint = `${API_ENDPOINTS.sessions.list}?${params.toString()}`;
    return api.get<Session[]>(endpoint);
  }

  /**
   * 取得單一團次
   */
  static async getSession(id: string): Promise<{
    data: Session | null;
    error: any;
  }> {
    return api.get<Session>(API_ENDPOINTS.sessions.detail(id));
  }

  /**
   * 建立團次
   */
  static async createSession(data: CreateSessionData): Promise<{
    data: Session | null;
    error: any;
  }> {
    return api.post<Session>(API_ENDPOINTS.sessions.create, data);
  }

  /**
   * 更新團次
   */
  static async updateSession(
    id: string,
    data: UpdateSessionData
  ): Promise<{
    data: Session | null;
    error: any;
  }> {
    // 驗證狀態轉換
    if (data.status) {
      const currentSession = await this.getSession(id);
      if (currentSession.error) {
        return currentSession;
      }
      if (currentSession.data) {
        const isValid = isValidSessionTransition(
          currentSession.data.status,
          data.status
        );
        if (!isValid) {
          return {
            data: null,
            error: {
              code: 'INVALID_TRANSITION',
              message: `無法從 ${currentSession.data.status} 轉換到 ${data.status}`,
            },
          };
        }
      }
    }

    return api.patch<Session>(API_ENDPOINTS.sessions.update(id), data);
  }

  /**
   * 刪除團次
   */
  static async deleteSession(id: string): Promise<{
    data: null;
    error: any;
  }> {
    return api.delete(API_ENDPOINTS.sessions.delete(id));
  }

  /**
   * 取得行程下的所有團次
   */
  static async getSessionsByTour(tourId: string): Promise<{
    data: Session[] | null;
    error: any;
  }> {
    return api.get<Session[]>(API_ENDPOINTS.tours.sessions(tourId));
  }
}

export default SessionService;
