import { api, API_ENDPOINTS } from '../../../lib/api';
import { SessionStatus } from '../../../core/types/session';
import type {
  Session,
  CreateSessionData,
  UpdateSessionData,
  SessionQuery,
} from '../../../core/types/session';

/**
 * Session status transition state machine
 * Defines valid transitions between session statuses
 */
const STATE_MACHINE: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.SOLICITING]: [SessionStatus.GUARANTEED, SessionStatus.CANCELLED],
  [SessionStatus.GUARANTEED]: [SessionStatus.CLOSED, SessionStatus.CANCELLED],
  [SessionStatus.CLOSED]: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.CANCELLED]: [],
};

/**
 * Validates if a session status transition is allowed
 * Business Rule: Cannot transition to 'guaranteed' unless current_pax >= min_pax
 * @param from - Current session status
 * @param to - Target session status
 * @param session - Session data for business rule validation
 * @returns true if transition is valid, false otherwise
 */
function canTransition(
  from: SessionStatus,
  to: SessionStatus,
  session?: { currentPax: number; minPax: number }
): boolean {
  // Check state machine transition
  const isValidStateTransition = STATE_MACHINE[from]?.includes(to) ?? false;
  
  if (!isValidStateTransition) {
    return false;
  }

  // Business Rule: Cannot transition to 'guaranteed' unless current_pax >= min_pax
  if (to === SessionStatus.GUARANTEED && session) {
    if (session.currentPax < session.minPax) {
      return false;
    }
  }

  return true;
}

/**
 * API Error type for service responses
 */
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class SessionService {
  private static auditLog(statusChange: {
    sessionId: string;
    from: SessionStatus;
    to: SessionStatus;
    userId: string;
  }) {
    return api.post(API_ENDPOINTS.audit.logs, {
      action: 'SESSION_STATUS_CHANGE',
      metadata: statusChange,
    });
  }

  static async getSessions(query?: SessionQuery): Promise<{
    data: Session[] | null;
    error: ApiError | null;
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

  static async getSession(id: string): Promise<{
    data: Session | null;
    error: ApiError | null;
  }> {
    return api.get<Session>(API_ENDPOINTS.sessions.detail(id));
  }

  static async createSession(data: CreateSessionData): Promise<{
    data: Session | null;
    error: ApiError | null;
  }> {
    return api.post<Session>(API_ENDPOINTS.sessions.create, data);
  }

  static async updateSession(
    id: string,
    data: UpdateSessionData,
    userId: string
  ): Promise<{
    data: Session | null;
    error: ApiError | null;
  }> {
    try {
      const currentSession = await this.getSession(id);
      if (currentSession.error) return currentSession;

      if (data.status && currentSession.data) {
        const canTransitionResult = canTransition(
          currentSession.data.status,
          data.status,
          {
            currentPax: currentSession.data.currentPax,
            minPax: currentSession.data.minPax,
          }
        );

        if (!canTransitionResult) {
          const errorMessage = data.status === SessionStatus.GUARANTEED
            ? `無法轉換為「已成團」狀態：目前報名人數 (${currentSession.data.currentPax}) 未達最低成團人數 (${currentSession.data.minPax})`
            : `無效的狀態轉換：從 ${currentSession.data.status} 到 ${data.status}`;

          return {
            data: null,
            error: {
              code: 'INVALID_TRANSITION',
              message: errorMessage,
            },
          };
        }

        const optimisticData = {
          ...currentSession.data,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        const response = await api.patch<Session>(
          API_ENDPOINTS.sessions.update(id),
          data
        );

        if (response.error) {
          await api.patch(API_ENDPOINTS.sessions.update(id), {
            status: currentSession.data.status,
          });
          return response;
        }

        await this.auditLog({
          sessionId: id,
          from: currentSession.data.status,
          to: data.status,
          userId,
        });

        return response;
      }

      return api.patch<Session>(API_ENDPOINTS.sessions.update(id), data);
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred during status transition',
        },
      };
    }
  }

  static async deleteSession(id: string): Promise<{
    data: null;
    error: ApiError | null;
  }> {
    return api.delete(API_ENDPOINTS.sessions.delete(id));
  }

  static async getSessionsByTour(tourId: string): Promise<{
    data: Session[] | null;
    error: ApiError | null;
  }> {
    return api.get<Session[]>(API_ENDPOINTS.tours.sessions(tourId));
  }
}

export default SessionService;