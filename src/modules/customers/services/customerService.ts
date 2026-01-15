/**
 * 客戶管理服務層
 * Customer Management Service Layer
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Customer,
  CustomerProfile,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerQuery,
  CustomerInteraction,
} from '../../../core/types/customer';

/**
 * 客戶服務
 */
export class CustomerService {
  /**
   * 取得客戶列表
   */
  static async getCustomers(query?: CustomerQuery): Promise<{
    data: Customer[] | null;
    error: any;
  }> {
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
    return api.get<Customer[]>(endpoint);
  }

  /**
   * 取得單一客戶
   */
  static async getCustomer(id: string): Promise<{
    data: Customer | null;
    error: any;
  }> {
    return api.get<Customer>(API_ENDPOINTS.customers.detail(id));
  }

  /**
   * 取得客戶完整資料 (CDP)
   */
  static async getCustomerProfile(id: string): Promise<{
    data: CustomerProfile | null;
    error: any;
  }> {
    return api.get<CustomerProfile>(`${API_ENDPOINTS.customers.detail(id)}/profile`);
  }

  /**
   * 建立客戶
   */
  static async createCustomer(data: CreateCustomerData): Promise<{
    data: Customer | null;
    error: any;
  }> {
    return api.post<Customer>(API_ENDPOINTS.customers.create, data);
  }

  /**
   * 更新客戶
   */
  static async updateCustomer(
    id: string,
    data: UpdateCustomerData
  ): Promise<{
    data: Customer | null;
    error: any;
  }> {
    return api.patch<Customer>(API_ENDPOINTS.customers.update(id), data);
  }

  /**
   * 刪除客戶
   */
  static async deleteCustomer(id: string): Promise<{
    data: null;
    error: any;
  }> {
    return api.delete(API_ENDPOINTS.customers.delete(id));
  }

  /**
   * 取得客戶互動記錄
   */
  static async getCustomerInteractions(customerId: string): Promise<{
    data: CustomerInteraction[] | null;
    error: any;
  }> {
    return api.get<CustomerInteraction[]>(
      `${API_ENDPOINTS.customers.detail(customerId)}/interactions`
    );
  }

  /**
   * 新增客戶互動記錄
   */
  static async addCustomerInteraction(
    customerId: string,
    interaction: Omit<CustomerInteraction, 'id' | 'customerId' | 'createdAt'>
  ): Promise<{
    data: CustomerInteraction | null;
    error: any;
  }> {
    return api.post<CustomerInteraction>(
      `${API_ENDPOINTS.customers.detail(customerId)}/interactions`,
      interaction
    );
  }

  /**
   * 搜尋客戶
   */
  static async searchCustomers(keyword: string): Promise<{
    data: Customer[] | null;
    error: any;
  }> {
    return this.getCustomers({ search: keyword, limit: 20 });
  }
}

export default CustomerService;
