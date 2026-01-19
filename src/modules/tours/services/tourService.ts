import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Tour,
  PublicTourData,
  CreateTourData,
  UpdateTourData,
  TourQuery,
} from '../../../core/types/tour';
import { ApiError } from '../../../core/types/api';

export class TourService {
  static async getTours(query?: TourQuery): Promise<{
    data: Tour[] | null;
    error: ApiError | null;
  }> {
    try {
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
      return await api.get<Tour[]>(endpoint);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async getTour(id: string): Promise<{
    data: Tour | null;
    error: ApiError | null;
  }> {
    try {
      return await api.get<Tour>(API_ENDPOINTS.tours.detail(id));
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async createTour(data: CreateTourData): Promise<{
    data: Tour | null;
    error: ApiError | null;
  }> {
    try {
      return await api.post<Tour>(API_ENDPOINTS.tours.create, data);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async updateTour(
    id: string,
    data: UpdateTourData
  ): Promise<{
    data: Tour | null;
    error: ApiError | null;
  }> {
    try {
      return await api.patch<Tour>(API_ENDPOINTS.tours.update(id), data);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async deleteTour(id: string): Promise<{
    data: null;
    error: ApiError | null;
  }> {
    try {
      return await api.delete(API_ENDPOINTS.tours.delete(id));
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async getPublicTour(shareToken: string): Promise<{
    data: PublicTourData | null;
    error: ApiError | null;
  }> {
    try {
      return await api.get<PublicTourData>(`${API_ENDPOINTS.tours.list}/public/${shareToken}`);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async cloneTour(id: string, newCode?: string): Promise<{
    data: Tour | null;
    error: ApiError | null;
  }> {
    try {
      return await api.post<Tour>(`${API_ENDPOINTS.tours.detail(id)}/clone`, { newCode });
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async searchTours(keyword: string): Promise<{
    data: Tour[] | null;
    error: ApiError | null;
  }> {
    try {
      return await this.getTours({ search: keyword, status: 'active', limit: 20 });
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }
}

export default TourService;