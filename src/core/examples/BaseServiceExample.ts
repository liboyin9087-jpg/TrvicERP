/**
 * BaseService 使用範例
 * BaseService Usage Example
 * 
 * 此文件展示如何使用 BaseService 來簡化服務層實現
 */

import { BaseService, type CrudConfig } from '../base/BaseService';
import { API_ENDPOINTS } from '@/lib/api';
import type { Customer, CreateCustomerData, UpdateCustomerData, CustomerQuery } from '../types/customer';

/**
 * 客戶服務範例（使用 BaseService）
 */
export class CustomerServiceExample extends BaseService<
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerQuery
> {
  protected config: CrudConfig<Customer, CreateCustomerData, UpdateCustomerData, CustomerQuery> = {
    baseEndpoint: API_ENDPOINTS.customers.list,
    resourceName: 'customer',
    getDetailEndpoint: (id: string) => API_ENDPOINTS.customers.detail(id),
    getUpdateEndpoint: (id: string) => API_ENDPOINTS.customers.update(id),
    getDeleteEndpoint: (id: string) => API_ENDPOINTS.customers.delete(id),
  };

  /**
   * 自定義方法：搜尋客戶
   */
  async searchCustomers(keyword: string) {
    return this.getList({ search: keyword, limit: 20 } as CustomerQuery);
  }

  /**
   * 自定義方法：取得客戶完整資料 (CDP)
   */
  async getCustomerProfile(id: string) {
    const endpoint = `${API_ENDPOINTS.customers.detail(id)}/profile`;
    const { api } = await import('@/lib/api');
    return api.get(endpoint);
  }
}

/**
 * 使用說明：
 * 
 * 1. 繼承 BaseService 並提供泛型參數：
 *    - T: 資源類型（如 Customer）
 *    - CreateData: 建立時的數據類型
 *    - UpdateData: 更新時的數據類型
 *    - QueryParams: 查詢參數類型
 * 
 * 2. 實現 config 屬性，指定端點和資源名稱
 * 
 * 3. BaseService 自動提供：
 *    - getList(): 取得列表
 *    - getById(): 取得單一項目
 *    - create(): 建立項目
 *    - update(): 更新項目
 *    - delete(): 刪除項目
 * 
 * 4. 可以添加自定義方法來擴展功能
 * 
 * 5. 所有操作自動包含：
 *    - API 攔截器處理
 *    - 審計日誌記錄
 *    - 錯誤處理
 */
