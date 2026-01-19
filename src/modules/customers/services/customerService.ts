import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Customer,
  CustomerProfile,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerQuery,
  CustomerInteraction,
  ApiResponse,
  ApiError,
} from '../../../core/types/customer';

export class CustomerService {
  static async getCustomers(query?: CustomerQuery): Promise<ApiResponse<Customer[]>> {
    const params = new URLSearchParams();
    if (query?.type) params.append('type', query.type);
    if (query?.tier) {
      if (Array.isArray(query.tier)) {
        params.append('tier', query.tier.join(','));
      } else {
        params.append('tier', query.tier);
      }
    }
    if (query?.status) params.append('status', query.status);
    if (query?.tags) params.append('tags', query.tags.join(','));
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const endpoint = `${API_ENDPOINTS.customers.list}?${params.toString()}`;
    try {
      return await api.get<Customer[]>(endpoint);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    try {
      return await api.get<Customer>(API_ENDPOINTS.customers.detail(id));
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async getCustomerProfile(id: string): Promise<ApiResponse<CustomerProfile>> {
    try {
      return await api.get<CustomerProfile>(`${API_ENDPOINTS.customers.detail(id)}/profile`);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async createCustomer(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    try {
      return await api.post<Customer>(API_ENDPOINTS.customers.create, data);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async updateCustomer(
    id: string,
    data: UpdateCustomerData
  ): Promise<ApiResponse<Customer>> {
    try {
      return await api.patch<Customer>(API_ENDPOINTS.customers.update(id), data);
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    try {
      return await api.delete(API_ENDPOINTS.customers.delete(id));
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async getCustomerInteractions(customerId: string): Promise<ApiResponse<CustomerInteraction[]>> {
    try {
      return await api.get<CustomerInteraction[]>(
        `${API_ENDPOINTS.customers.detail(customerId)}/interactions`
      );
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async addCustomerInteraction(
    customerId: string,
    interaction: Omit<CustomerInteraction, 'id' | 'customerId' | 'createdAt'>
  ): Promise<ApiResponse<CustomerInteraction>> {
    try {
      return await api.post<CustomerInteraction>(
        `${API_ENDPOINTS.customers.detail(customerId)}/interactions`,
        interaction
      );
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  static async searchCustomers(keyword: string): Promise<ApiResponse<Customer[]>> {
    try {
      return await this.getCustomers({ search: keyword, limit: 20 });
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }
}

export default CustomerService;