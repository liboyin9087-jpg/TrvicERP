import { API_ENDPOINTS } from '../../../lib/api';
import type {
  Customer,
  CustomerProfile,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerQuery,
  CustomerInteraction,
} from '../../../core/types/customer';

/**
 * 通用的服務響應類型，包含數據和潛在錯誤
 * Generic service response type, containing data and potential error
 */
export type ServiceResponse<T> = {
  data: T | null;
  error: any; // 考慮更具體的錯誤類型，例如 Error | AxiosError | null
};

/**
 * API 客戶端介面，定義服務層所需的 HTTP 方法
 * API client interface, defining the HTTP methods required by the service layer
 * 這允許依賴反轉 (Dependency Inversion) 和更容易的測試。
 */
export interface IApiClient {
  get<T>(url: string, config?: Record<string, any>): Promise<ServiceResponse<T>>;
  post<T>(url: string, data?: any, config?: Record<string, any>): Promise<ServiceResponse<T>>;
  patch<T>(url: string, data?: any, config?: Record<string, any>): Promise<ServiceResponse<T>>;
  delete<T>(url: string, config?: Record<string, any>): Promise<ServiceResponse<T>>;
}

/**
 * 根據 CustomerQuery 構建 URLSearchParams
 * Builds URLSearchParams based on CustomerQuery
 * 遵守單一職責原則。
 */
function buildCustomerQueryParams(query?: CustomerQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (!query) {
    return params;
  }

  if (query.type) params.append('type', query.type);
  if (query.tier) {
    if (Array.isArray(query.tier)) {
      params.append('tier', query.tier.join(','));
    } else {
      params.append('tier', query.tier);
    }
  }
  if (query.status) params.append('status', query.status);
  if (query.tags) params.append('tags', query.tags.join(','));
  if (query.search) params.append('search', query.search);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());

  return params;
}

/**
 * 客戶管理服務層
 * Customer Management Service Layer
 *
 * 這個類別現在透過建構子注入 API 客戶端依賴，
 * 使用實例方法 (instance methods)，並標準化了回傳類型。
 */
export class CustomerService {
  private apiClient: IApiClient;

  /**
   * 構造函數，注入 API 客戶端實例
   * Constructor, injects the API client instance
   *
   * @param apiClient 實現 IApiClient 介面的 API 客戶端實例
   */
  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 取得客戶列表
   * @param query 客戶查詢參數
   */
  async getCustomers(query?: CustomerQuery): Promise<ServiceResponse<Customer[]>> {
    const params = buildCustomerQueryParams(query);
    const endpoint = `${API_ENDPOINTS.customers.list}?${params.toString()}`;
    return this.apiClient.get<Customer[]>(endpoint);
  }

  /**
   * 取得單一客戶
   * @param id 客戶 ID
   */
  async getCustomer(id: string): Promise<ServiceResponse<Customer>> {
    return this.apiClient.get<Customer>(API_ENDPOINTS.customers.detail(id));
  }

  /**
   * 取得客戶完整資料 (CDP)
   * @param id 客戶 ID
   */
  async getCustomerProfile(id: string): Promise<ServiceResponse<CustomerProfile>> {
    return this.apiClient.get<CustomerProfile>(`${API_ENDPOINTS.customers.detail(id)}/profile`);
  }

  /**
   * 建立客戶
   * @param data 建立客戶的資料
   */
  async createCustomer(data: CreateCustomerData): Promise<ServiceResponse<Customer>> {
    return this.apiClient.post<Customer>(API_ENDPOINTS.customers.create, data);
  }

  /**
   * 更新客戶
   * @param id 客戶 ID
   * @param data 更新客戶的資料
   */
  async updateCustomer(id: string, data: UpdateCustomerData): Promise<ServiceResponse<Customer>> {
    return this.apiClient.patch<Customer>(API_ENDPOINTS.customers.update(id), data);
  }

  /**
   * 刪除客戶
   * @param id 客戶 ID
   */
  async deleteCustomer(id: string): Promise<ServiceResponse<null>> {
    // 假設刪除成功後回傳數據為 null
    return this.apiClient.delete<null>(API_ENDPOINTS.customers.delete(id));
  }

  /**
   * 取得客戶互動記錄
   * @param customerId 客戶 ID
   */
  async getCustomerInteractions(customerId: string): Promise<ServiceResponse<CustomerInteraction[]>> {
    return this.apiClient.get<CustomerInteraction[]>(
      `${API_ENDPOINTS.customers.detail(customerId)}/interactions`
    );
  }

  /**
   * 新增客戶互動記錄
   * @param customerId 客戶 ID
   * @param interaction 互動記錄資料
   */
  async addCustomerInteraction(
    customerId: string,
    interaction: Omit<CustomerInteraction, 'id' | 'customerId' | 'createdAt'>
  ): Promise<ServiceResponse<CustomerInteraction>> {
    return this.apiClient.post<CustomerInteraction>(
      `${API_ENDPOINTS.customers.detail(customerId)}/interactions`,
      interaction
    );
  }

  /**
   * 搜尋客戶
   * @param keyword 搜尋關鍵字
   */
  async searchCustomers(keyword: string): Promise<ServiceResponse<Customer[]>> {
    // 重用 getCustomers 方法實現搜尋功能
    return this.getCustomers({ search: keyword, limit: 20 });
  }
}

export default CustomerService;