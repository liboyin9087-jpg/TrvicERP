interface IApiClient {
  get<T>(url: string, config?: RequestInit): Promise<{ data: T | null; error: any }>;
  post<T>(url: string, data?: any, config?: RequestInit): Promise<{ data: T | null; error: any }>;
  patch<T>(url: string, data?: any, config?: RequestInit): Promise<{ data: T | null; error: any }>;
  // 可根據需要添加 put, delete 等其他 HTTP 方法
}

// 服務層不應直接依賴具體的 API 實作，而是透過介面。
// 這裡定義一個符合 api 模組行為的介面。
// 為了避免循環依賴，這裡將 api 及 API_ENDPOINTS 暫時引入。
// 在更完善的架構中，api 模組本身也應該提供一個符合 IApiClient 的實例，
// 並在服務初始化時傳入。
import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Itinerary,
  DayItinerary,
  ResourceConflict,
} from '../../../core/types/itinerary';
// checkResourceConflicts 是一個純粹的領域邏輯工具函數，不應是服務的一部分。
// 消費者可以直接從其原始模組導入使用。

/**
 * 定義建立行程的資料傳輸物件 (DTO)，改善參數過多的問題
 */
type CreateItineraryPayload = Omit<
  Itinerary,
  'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt' | 'createdBy'
>;

/**
 * 定義更新行程的資料傳輸物件 (DTO)，改善參數過多的問題
 */
type UpdateItineraryPayload = Partial<
  Omit<Itinerary, 'id' | 'sessionId' | 'version' | 'createdAt' | 'updatedAt'>
>;

/**
 * 定義更新單日行程的資料傳輸物件 (DTO)，改善參數過多的問題
 */
type UpdateDayItineraryPayload = Omit<DayItinerary, 'day'>;

/**
 * 行程安排服務
 */
export class ItineraryService {
  private apiClient: IApiClient;
  private apiEndpoints: typeof API_ENDPOINTS;

  /**
   * 透過建構子注入方式，讓服務層依賴抽象的 IApiClient 介面，而非具體的 api 模組。
   * 這提升了服務的靈活性和可測試性。
   *
   * @param apiClient 實現 IApiClient 介面的 API 客戶端實例
   * @param apiEndpoints API 終端點配置
   */
  constructor(apiClient: IApiClient, apiEndpoints: typeof API_ENDPOINTS) {
    this.apiClient = apiClient;
    this.apiEndpoints = apiEndpoints;
  }

  /**
   * 統一的錯誤處理機制。
   * 確保所有服務方法返回的 Promise 都以 { data: T | null; error: any; } 結構解析，
   * 即使底層 API 客戶端拋出錯誤。
   *
   * @param apiCall 待執行的 API Promise
   * @returns 包含數據或錯誤的統一結果對象
   */
  private async safeApiCall<T>(
    apiCall: Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> {
    try {
      return await apiCall;
    } catch (error: any) {
      console.error('API call failed:', error); // 記錄錯誤以便調試
      // 返回一個標準化的錯誤響應
      return { data: null, error: error?.response?.data || error?.message || '未知錯誤' };
    }
  }

  /**
   * 取得團次的行程安排
   * @param sessionId 會話 ID
   */
  async getItinerary(
    sessionId: string
  ): Promise<{ data: Itinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.get<Itinerary>(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary`
      )
    );
  }

  /**
   * 建立行程安排
   * @param sessionId 會話 ID
   * @param data 建立行程的資料
   */
  async createItinerary(
    sessionId: string,
    data: CreateItineraryPayload // 使用定義好的 DTO 類型
  ): Promise<{ data: Itinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.post<Itinerary>(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary`,
        data
      )
    );
  }

  /**
   * 更新行程安排
   * @param sessionId 會話 ID
   * @param data 更新行程的資料
   */
  async updateItinerary(
    sessionId: string,
    data: UpdateItineraryPayload // 使用定義好的 DTO 類型
  ): Promise<{ data: Itinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.patch<Itinerary>(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary`,
        data
      )
    );
  }

  /**
   * 更新單日行程
   * @param sessionId 會話 ID
   * @param day 日數
   * @param data 更新單日行程的資料
   */
  async updateDayItinerary(
    sessionId: string,
    day: number,
    data: UpdateDayItineraryPayload // 使用定義好的 DTO 類型
  ): Promise<{ data: DayItinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.patch<DayItinerary>(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary/days/${day}`,
        data
      )
    );
  }

  /**
   * 取得行程版本歷史
   * @param sessionId 會話 ID
   */
  async getItineraryVersions(
    sessionId: string
  ): Promise<{
    data: Array<{
      version: number;
      createdAt: string;
      createdBy: string;
      changes: string;
    }> | null;
    error: any;
  }> {
    return this.safeApiCall(
      this.apiClient.get(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary/versions`
      )
    );
  }

  /**
   * 還原到指定版本
   * @param sessionId 會話 ID
   * @param version 指定的版本號
   */
  async revertToVersion(
    sessionId: string,
    version: number
  ): Promise<{ data: Itinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.post<Itinerary>(
        `${this.apiEndpoints.sessions.detail(sessionId)}/itinerary/revert`,
        { version }
      )
    );
  }

  /**
   * 複製行程安排
   * @param fromSessionId 源會話 ID
   * @param toSessionId 目標會話 ID
   */
  async cloneItinerary(
    fromSessionId: string,
    toSessionId: string
  ): Promise<{ data: Itinerary | null; error: any }> {
    return this.safeApiCall(
      this.apiClient.post<Itinerary>(
        `${this.apiEndpoints.sessions.detail(toSessionId)}/itinerary/clone`,
        { fromSessionId }
      )
    );
  }
}

// 外部可以這樣初始化服務：
// const itineraryService = new ItineraryService(api, API_ENDPOINTS);
// 然後使用 itineraryService.getItinerary(...) 等方法。
// 移除 `export default ItineraryService;` 以鼓勵顯式導入。

// 如果需要提供一個預設的單例實例，可以在此創建並導出：
// export const defaultItineraryService = new ItineraryService(api, API_ENDPOINTS);