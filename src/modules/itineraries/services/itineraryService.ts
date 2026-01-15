/**
 * 行程安排管理服務層
 * Itinerary Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Itinerary,
  DayItinerary,
  ResourceConflict,
} from '../../../core/types/itinerary';
import { checkResourceConflicts } from '../../../core/types/itinerary';

/**
 * 行程安排服務
 */
export class ItineraryService {
  /**
   * 取得團次的行程安排
   */
  static async getItinerary(sessionId: string): Promise<{
    data: Itinerary | null;
    error: any;
  }> {
    return api.get<Itinerary>(`${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`);
  }

  /**
   * 建立行程安排
   */
  static async createItinerary(
    sessionId: string,
    data: Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<{
    data: Itinerary | null;
    error: any;
  }> {
    return api.post<Itinerary>(
      `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`,
      data
    );
  }

  /**
   * 更新行程安排
   */
  static async updateItinerary(
    sessionId: string,
    data: Partial<Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>>
  ): Promise<{
    data: Itinerary | null;
    error: any;
  }> {
    return api.patch<Itinerary>(
      `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`,
      data
    );
  }

  /**
   * 更新單日行程
   */
  static async updateDayItinerary(
    sessionId: string,
    day: number,
    data: Omit<DayItinerary, 'day'>
  ): Promise<{
    data: DayItinerary | null;
    error: any;
  }> {
    return api.patch<DayItinerary>(
      `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/days/${day}`,
      data
    );
  }

  /**
   * 取得行程版本歷史
   */
  static async getItineraryVersions(sessionId: string): Promise<{
    data: Array<{ version: number; createdAt: string; createdBy: string; changes: string }> | null;
    error: any;
  }> {
    return api.get(
      `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/versions`
    );
  }

  /**
   * 還原到指定版本
   */
  static async revertToVersion(
    sessionId: string,
    version: number
  ): Promise<{
    data: Itinerary | null;
    error: any;
  }> {
    return api.post<Itinerary>(
      `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/revert`,
      { version }
    );
  }

  /**
   * 檢查資源衝突
   */
  static checkResourceConflicts(itineraries: Itinerary[]): ResourceConflict[] {
    return checkResourceConflicts(itineraries);
  }

  /**
   * 複製行程安排
   */
  static async cloneItinerary(
    fromSessionId: string,
    toSessionId: string
  ): Promise<{
    data: Itinerary | null;
    error: any;
  }> {
    return api.post<Itinerary>(
      `${API_ENDPOINTS.sessions.detail(toSessionId)}/itinerary/clone`,
      { fromSessionId }
    );
  }
}

export default ItineraryService;
