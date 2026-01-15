/**
 * 行程產品管理服務層
 * Tour Product Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Tour,
  PublicTourData,
  CreateTourData,
  UpdateTourData,
  TourQuery,
} from '../../../core/types/tour';

/**
 * 行程產品服務
 */
export class TourService {
  /**
   * 取得行程列表
   */
  static async getTours(query?: TourQuery): Promise<{
    data: Tour[] | null;
    error: any;
  }> {
    const params = new URLSearchParams();
    if (query?.status) {
      if (Array.isArray(query.status)) {
        params.append('status', query.status.join(','));
      } else {
        params.append('status', query.status);
      }
    }
    if (query?.type) {
      if (Array.isArray(query.type)) {
        params.append('type', query.type.join(','));
      } else {
        params.append('type', query.type);
      }
    }
    if (query?.destination) params.append('destination', query.destination);
    if (query?.countries) params.append('countries', query.countries.join(','));
    if (query?.minDays) params.append('minDays', query.minDays.toString());
    if (query?.maxDays) params.append('maxDays', query.maxDays.toString());
    if (query?.minPrice) params.append('minPrice', query.minPrice.toString());
    if (query?.maxPrice) params.append('maxPrice', query.maxPrice.toString());
    if (query?.tags) params.append('tags', query.tags.join(','));
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const endpoint = `${API_ENDPOINTS.tours.list}?${params.toString()}`;
    return api.get<Tour[]>(endpoint);
  }

  /**
   * 取得單一行程
   */
  static async getTour(id: string): Promise<{
    data: Tour | null;
    error: any;
  }> {
    return api.get<Tour>(API_ENDPOINTS.tours.detail(id));
  }

  /**
   * 建立行程
   */
  static async createTour(data: CreateTourData): Promise<{
    data: Tour | null;
    error: any;
  }> {
    return api.post<Tour>(API_ENDPOINTS.tours.create, data);
  }

  /**
   * 更新行程
   */
  static async updateTour(
    id: string,
    data: UpdateTourData
  ): Promise<{
    data: Tour | null;
    error: any;
  }> {
    return api.patch<Tour>(API_ENDPOINTS.tours.update(id), data);
  }

  /**
   * 刪除行程
   */
  static async deleteTour(id: string): Promise<{
    data: null;
    error: any;
  }> {
    return api.delete(API_ENDPOINTS.tours.delete(id));
  }

  /**
   * 取得公開行程資料（分享用）
   */
  static async getPublicTour(shareToken: string): Promise<{
    data: PublicTourData | null;
    error: any;
  }> {
    return api.get<PublicTourData>(`${API_ENDPOINTS.tours.list}/public/${shareToken}`);
  }

  /**
   * 複製行程
   */
  static async cloneTour(id: string, newCode?: string): Promise<{
    data: Tour | null;
    error: any;
  }> {
    return api.post<Tour>(`${API_ENDPOINTS.tours.detail(id)}/clone`, { newCode });
  }

  /**
   * 搜尋行程
   */
  static async searchTours(keyword: string): Promise<{
    data: Tour[] | null;
    error: any;
  }> {
    return this.getTours({ search: keyword, status: 'active', limit: 20 });
  }
}

export default TourService;
