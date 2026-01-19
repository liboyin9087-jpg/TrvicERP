/**
 * 系統配置服務
 * System Configuration Service
 */

import { api, API_ENDPOINTS, type ApiResponse } from '@/lib/api';

/**
 * 系統配置
 */
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  category: 'general' | 'notification' | 'integration' | 'security' | 'ui';
  description?: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * 配置服務
 */
export class ConfigService {
  private static cache: Map<string, SystemConfig> = new Map();
  private static cacheExpiry = 5 * 60 * 1000; // 5 分鐘
  private static lastFetch = 0;

  /**
   * 取得所有配置
   */
  static async getAllConfigs(): Promise<ApiResponse<SystemConfig[]>> {
    // 檢查緩存
    if (Date.now() - this.lastFetch < this.cacheExpiry && this.cache.size > 0) {
      return {
        data: Array.from(this.cache.values()),
        error: null,
      };
    }

    const result = await api.get<SystemConfig[]>(`${API_ENDPOINTS.users.list}/config`);
    
    if (result.data) {
      // 更新緩存
      this.cache.clear();
      result.data.forEach((config) => {
        this.cache.set(config.key, config);
      });
      this.lastFetch = Date.now();
    }

    return result;
  }

  /**
   * 取得單一配置
   */
  static async getConfig(key: string): Promise<ApiResponse<SystemConfig>> {
    // 檢查緩存
    if (this.cache.has(key)) {
      return {
        data: this.cache.get(key)!,
        error: null,
      };
    }

    // 如果緩存過期，重新載入
    if (Date.now() - this.lastFetch >= this.cacheExpiry) {
      await this.getAllConfigs();
    }

    const config = this.cache.get(key);
    if (config) {
      return { data: config, error: null };
    }

    return {
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Configuration key "${key}" not found`,
      } as any,
    };
  }

  /**
   * 取得配置值（帶預設值）
   */
  static async getConfigValue<T = any>(
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    const result = await this.getConfig(key);
    return result.data?.value ?? defaultValue;
  }

  /**
   * 更新配置
   */
  static async updateConfig(
    key: string,
    value: any
  ): Promise<ApiResponse<SystemConfig>> {
    const result = await api.patch<SystemConfig>(
      `${API_ENDPOINTS.users.list}/config/${key}`,
      { value }
    );

    if (result.data) {
      // 更新緩存
      this.cache.set(key, result.data);
    }

    return result;
  }

  /**
   * 清除緩存
   */
  static clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}
