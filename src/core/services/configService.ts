import { ApiError, api, API_ENDPOINTS, type ApiResponse } from '@/lib/api';

export type ConfigCategory = 'general' | 'notification' | 'integration' | 'security' | 'ui';

export interface SystemConfig<T = unknown> {
  id: string;
  key: string;
  value: T;
  category: ConfigCategory;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}

export class ConfigService {
  private static cache: Map<string, SystemConfig> = new Map();
  private static cacheExpiry = 5 * 60 * 1000;
  private static lastFetch = 0;

  private static isCacheValid(): boolean {
    return Date.now() - this.lastFetch < this.cacheExpiry && this.cache.size > 0;
  }

  static async getAllConfigs(): Promise<ApiResponse<SystemConfig[]>> {
    if (this.isCacheValid()) {
      return {
        data: Array.from(this.cache.values()),
        error: null,
      };
    }

    try {
      const result = await api.get<SystemConfig[]>(`${API_ENDPOINTS.users.list}/config`);
      
      if (result.data) {
        this.cache.clear();
        result.data.forEach((config) => {
          this.cache.set(config.key, config);
        });
        this.lastFetch = Date.now();
      }

      return result;
    } catch (error) {
      return {
        data: null,
        error: new ApiError('FETCH_FAILED', 'Failed to fetch configurations'),
      };
    }
  }

  static async getConfig(key: string): Promise<ApiResponse<SystemConfig>> {
    if (this.cache.has(key)) {
      return {
        data: this.cache.get(key)!,
        error: null,
      };
    }

    if (!this.isCacheValid()) {
      await this.getAllConfigs();
    }

    const config = this.cache.get(key);
    if (config) {
      return { data: config, error: null };
    }

    return {
      data: null,
      error: new ApiError('NOT_FOUND', `Configuration key "${key}" not found`),
    };
  }

  static async getConfigValue<T = unknown>(
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    const result = await this.getConfig(key);
    return (result.data?.value as T | undefined) ?? defaultValue;
  }

  static async updateConfig<T = unknown>(
    key: string,
    value: T
  ): Promise<ApiResponse<SystemConfig<T>>> {
    try {
      const result = await api.patch<SystemConfig<T>>(
        `${API_ENDPOINTS.users.list}/config/${key}`,
        { value }
      );

      if (result.data) {
        this.cache.set(key, result.data);
      }

      return result;
    } catch (error) {
      return {
        data: null,
        error: new ApiError('UPDATE_FAILED', `Failed to update configuration for key "${key}"`),
      };
    }
  }

  static clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}