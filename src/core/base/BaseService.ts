/**
 * 基礎服務類
 * Base Service Class - 抽象通用 CRUD 邏輯
 */

import { api, type ApiResponse, type ApiError } from '@/lib/api';
import { auditLogger, type AuditAction } from '../middleware/auditLogger';
import { apiInterceptor } from '../middleware/apiInterceptor';

/**
 * CRUD 操作配置
 */
export interface CrudConfig<T, CreateData, UpdateData, QueryParams> {
  baseEndpoint: string;
  resourceName: string;
  getDetailEndpoint?: (id: string) => string;
  getListEndpoint?: (params?: QueryParams) => string;
  getCreateEndpoint?: () => string;
  getUpdateEndpoint?: (id: string) => string;
  getDeleteEndpoint?: (id: string) => string;
}

/**
 * 基礎服務類
 */
export abstract class BaseService<
  T,
  CreateData = Partial<T>,
  UpdateData = Partial<T>,
  QueryParams = Record<string, any>
> {
  protected abstract config: CrudConfig<T, CreateData, UpdateData, QueryParams>;

  /**
   * 取得列表
   */
  async getList(params?: QueryParams): Promise<ApiResponse<T[]>> {
    const endpoint = this.config.getListEndpoint
      ? this.config.getListEndpoint(params)
      : `${this.config.baseEndpoint}${this.buildQueryString(params)}`;

    const [finalEndpoint, finalOptions] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      { method: 'GET' }
    );

    const response = await api.get<T[]>(finalEndpoint);
    return apiInterceptor.executeResponseInterceptors(response);
  }

  /**
   * 取得單一項目
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    const endpoint = this.config.getDetailEndpoint
      ? this.config.getDetailEndpoint(id)
      : `${this.config.baseEndpoint}/${id}`;

    const [finalEndpoint] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      { method: 'GET' }
    );

    const response = await api.get<T>(finalEndpoint);
    return apiInterceptor.executeResponseInterceptors(response);
  }

  /**
   * 建立項目
   */
  async create(data: CreateData): Promise<ApiResponse<T>> {
    const endpoint = this.config.getCreateEndpoint
      ? this.config.getCreateEndpoint()
      : this.config.baseEndpoint;

    const [finalEndpoint, finalOptions] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    const response = await api.post<T>(finalEndpoint, data);

    // 記錄審計日誌
    if (response.data) {
      auditLogger.log('CREATE', this.config.resourceName, {
        resourceId: (response.data as any).id,
        details: { data },
        success: !response.error,
        errorMessage: response.error?.message,
      });
    }

    return apiInterceptor.executeResponseInterceptors(response);
  }

  /**
   * 更新項目
   */
  async update(id: string, data: UpdateData): Promise<ApiResponse<T>> {
    const endpoint = this.config.getUpdateEndpoint
      ? this.config.getUpdateEndpoint(id)
      : `${this.config.baseEndpoint}/${id}`;

    const [finalEndpoint] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

    const response = await api.patch<T>(finalEndpoint, data);

    // 記錄審計日誌
    auditLogger.log('UPDATE', this.config.resourceName, {
      resourceId: id,
      details: { data },
      success: !response.error,
      errorMessage: response.error?.message,
    });

    return apiInterceptor.executeResponseInterceptors(response);
  }

  /**
   * 刪除項目
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    const endpoint = this.config.getDeleteEndpoint
      ? this.config.getDeleteEndpoint(id)
      : `${this.config.baseEndpoint}/${id}`;

    const [finalEndpoint] = await apiInterceptor.executeRequestInterceptors(
      endpoint,
      { method: 'DELETE' }
    );

    const response = await api.delete<null>(finalEndpoint);

    // 記錄審計日誌
    auditLogger.log('DELETE', this.config.resourceName, {
      resourceId: id,
      success: !response.error,
      errorMessage: response.error?.message,
    });

    return apiInterceptor.executeResponseInterceptors(response);
  }

  /**
   * 構建查詢字符串
   */
  protected buildQueryString(params?: QueryParams): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
