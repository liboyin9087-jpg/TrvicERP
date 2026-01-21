import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Itinerary,
  DayItinerary,
  ResourceConflict,
  ItineraryVersion,
  ApiResponse,
} from '../../../core/types/itinerary';
import { checkResourceConflicts } from '../../../core/types/itinerary';
import { ApiError } from '../../../core/types/itinerary';

export class ItineraryService {
  static async getItinerary(sessionId: string): Promise<ApiResponse<Itinerary>> {
    try {
      return await api.get<Itinerary>(`${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`);
    } catch (error) {
      return { data: null, error: new ApiError('取得行程安排失敗', 'UNKNOWN_ERROR') };
    }
  }

  static async createItinerary(
    sessionId: string,
    data: Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<ApiResponse<Itinerary>> {
    try {
      return await api.post<Itinerary>(
        `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`,
        data
      );
    } catch (error) {
      return { data: null, error: new ApiError('建立行程安排失敗', 'UNKNOWN_ERROR') };
    }
  }

  static async updateItinerary(
    sessionId: string,
    data: Partial<Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<Itinerary>> {
    try {
      return await api.patch<Itinerary>(
        `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary`,
        data
      );
    } catch (error) {
      return { data: null, error: new ApiError('更新行程安排失敗', 'UNKNOWN_ERROR') };
    }
  }

  static async updateDayItinerary(
    sessionId: string,
    day: number,
    data: Omit<DayItinerary, 'day'>
  ): Promise<ApiResponse<DayItinerary>> {
    try {
      return await api.patch<DayItinerary>(
        `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/days/${day}`,
        data
      );
    } catch (error) {
      return { data: null, error: new ApiError('更新單日行程失敗', 'UNKNOWN_ERROR') };
    }
  }

  static async getItineraryVersions(
    sessionId: string
  ): Promise<ApiResponse<ItineraryVersion[]>> {
    try {
      return await api.get<ItineraryVersion[]>(
        `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/versions`
      );
    } catch (error) {
      return { data: null, error: new ApiError('取得版本歷史失敗', 'UNKNOWN_ERROR') };
    }
  }

  static async revertToVersion(
    sessionId: string,
    version: number
  ): Promise<ApiResponse<Itinerary>> {
    try {
      return await api.post<Itinerary>(
        `${API_ENDPOINTS.sessions.detail(sessionId)}/itinerary/revert`,
        { version }
      );
    } catch (error) {
      return { data: null, error: new ApiError('還原版本失敗', 'UNKNOWN_ERROR') };
    }
  }

  static checkResourceConflicts(itineraries: Itinerary[]): ResourceConflict[] {
    return checkResourceConflicts(itineraries);
  }

  static async cloneItinerary(
    fromSessionId: string,
    toSessionId: string
  ): Promise<ApiResponse<Itinerary>> {
    try {
      return await api.post<Itinerary>(
        `${API_ENDPOINTS.sessions.detail(toSessionId)}/itinerary/clone`,
        { fromSessionId }
      );
    } catch (error) {
      return { data: null, error: new ApiError('複製行程安排失敗', 'UNKNOWN_ERROR') };
    }
  }
}

export default ItineraryService;