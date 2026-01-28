/**
 * 報價管理服務層
 * Quotation Management Service Layer
 *
 * 職責: 僅負責與後端 API 進行資料傳輸，不包含任何商業邏輯計算或驗證。
 * Responsibilities: Only responsible for data transfer with the backend API,
 * without including any business logic calculations or validations.
 */

import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  Quotation,
  QuotationItem,
  CostBreakdown,
  ConvertQuotationToOrderData, // Original type for conversion payload
} from '../../../core/types/quotation';

// --- 問題修復說明 ---
// 1.  [architect] 服務層直接處理商業邏輯(成本計算、價格計算)而非單純的 API 呼叫 (中)
//     - 解決方案: 報價的成本、價格、有效期限等計算邏輯已從服務層中移除。
//       這些邏輯應由呼叫者 (例如應用服務層、控制器或領域層) 在呼叫 `QuotationService` 之前完成。
//       服務層現在只接收包含所有計算完成數據的 payload。
//     - 移除 `calculateQuotationCost`, `calculateSellingPrice`, `isQuotationExpired` 等業務邏輯的導入和使用。
//     - 移除 `calculateQuotationPreview` 方法，因為它是純粹的業務計算，不涉及 API 呼叫。
//
// 2.  [architect] 錯誤處理方式不一致 (中)
//     - 解決方案: 服務層方法現在統一返回 `Promise<ApiResponse<T>>` 類型。
//       `ApiResponse` 包含 `data` 和 `error` 屬性，確保 API 呼叫結果的一致性。
//       所有業務驗證錯誤 (如報價過期、狀態不符) 已從服務層移除，
//       這些錯誤應由上層業務邏輯在呼叫服務之前進行判斷並拋出。
//
// 3.  [architect] 部分方法過於複雜(如 updateQuotation) (中)
//     - 解決方案: `updateQuotation` 方法已大幅簡化。它不再負責獲取現有報價、條件判斷或重新計算字段。
//       它只接收一個完整的 `QuotationUpdatePayload`，並直接將其發送至後端 API。
//       所有預處理和計算應由呼叫此方法的上層邏輯完成。
//
// 4.  [architect] 缺少介面隔離 (中)
//     - 解決方案: 服務層的職責已被明確劃定為僅限於 API 呼叫。
//       雖然 TypeScript 對於靜態類別的 `implements` 語法有所限制，但 `IQuotationService` 介面的定義，
//       清晰地勾勒了 `QuotationService` 應提供的公共方法契約，提高了其可理解性和潛在的可測試性。
//       同時，將業務邏輯從服務層中分離，本身就是一種職責的隔離。
//
// --- 補充說明 ---
// - Kintone/Dashtail UI 規範 (拖曳、顏色、結構等) 不適用於後端服務層檔案，故未在此檔案中實作。

// --- 介面和類型定義 ---

/**
 * 報價建立請求的 payload 結構。
 * 包含所有已由業務邏輯層計算好的成本、價格、有效期限等，準備直接發送至後端。
 */
export interface QuotationCreatePayload {
  customerId: string;
  quotationNumber?: string;
  items: QuotationItem[];
  paxCount: number;
  profitMargin: number;
  costBreakdown: CostBreakdown;
  sellingPrice: number;
  totalAmount: number;
  validUntil: string;
  currency: string;
  // 其他可能需要的報價建立字段
}

/**
 * 報價更新請求的 payload 結構。
 * 包含需要更新的字段，若涉及重新計算的字段，其計算結果應已包含在此 payload 中。
 */
export interface QuotationUpdatePayload {
  items?: QuotationItem[];
  paxCount?: number;
  profitMargin?: number;
  costBreakdown?: CostBreakdown; // 允許更新時重新計算並傳遞
  sellingPrice?: number;         // 允許更新時重新計算並傳遞
  totalAmount?: number;          // 允許更新時重新計算並傳遞
  validUntil?: string;           // 允許更新時重新計算並傳遞
  currency?: string;             // 允許更新時更新幣別
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  // 其他可能需要的報價更新字段
}

/**
 * 報價轉換為訂單請求的 payload 結構。
 * 使用原始的 ConvertQuotationToOrderData 類型。
 */
export type ConvertQuotationToOrderPayload = ConvertQuotationToOrderData;


/**
 * 統一的 API 回應結構，包含資料或錯誤資訊。
 */
interface ApiResponse<T> {
  data: T | null;
  error: any; // 錯誤類型可以進一步細化，例如為 AxiosError 或自定義的 ApiError
}

/**
 * 報價服務接口
 * 定義了報價相關 API 操作的契約，用於明確服務層的職責。
 * 注意: TypeScript 不直接支援類別 `implements` 靜態成員。
 * 此介面主要作為對 `QuotationService` 靜態方法的類型約束與文件。
 */
export interface IQuotationService {
  getQuotations(params?: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Quotation[]>>;

  getQuotation(id: string): Promise<ApiResponse<Quotation>>;

  createQuotation(data: QuotationCreatePayload): Promise<ApiResponse<Quotation>>;

  updateQuotation(id: string, data: QuotationUpdatePayload): Promise<ApiResponse<Quotation>>;

  deleteQuotation(id: string): Promise<ApiResponse<null>>;

  convertToOrder(
    id: string,
    convertData?: ConvertQuotationToOrderPayload
  ): Promise<ApiResponse<{ orderId: string }>>;

  getQuotationVersions(id: string): Promise<ApiResponse<Quotation[]>>;
}

/**
 * 報價服務
 * 僅處理 API 呼叫，實踐與後端資料傳輸的職責。
 * 所有的商業邏輯計算與驗證都已抽離至專屬的領域層。
 */
export class QuotationService /* 移除 implements IQuotationService，因為 TypeScript 不直接支援靜態方法實現介面 */ {
  /**
   * 取得報價列表
   */
  static async getQuotations(params?: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Quotation[]>> {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.quotations.list}?${queryParams.toString()}`;
    return api.get<Quotation[]>(endpoint);
  }

  /**
   * 取得單一報價
   */
  static async getQuotation(id: string): Promise<ApiResponse<Quotation>> {
    return api.get<Quotation>(API_ENDPOINTS.quotations.detail(id));
  }

  /**
   * 建立報價
   *
   * @param data 完整的報價建立 payload，包含所有已由業務邏輯層計算好的成本、價格、有效期限等。
   *             服務層直接將此資料發送至後端 API。
   */
  static async createQuotation(
    data: QuotationCreatePayload
  ): Promise<ApiResponse<Quotation>> {
    return api.post<Quotation>(
      API_ENDPOINTS.quotations.create,
      data
    );
  }

  /**
   * 更新報價
   *
   * @param id 報價 ID
   * @param data 欲更新的報價 payload。如果包含需要重新計算的字段 (例如 items, paxCount, profitMargin)，
   *             這些字段應已由業務邏輯層處理並將其計算結果包含在此資料中。
   */
  static async updateQuotation(
    id: string,
    data: QuotationUpdatePayload
  ): Promise<ApiResponse<Quotation>> {
    return api.patch<Quotation>(API_ENDPOINTS.quotations.update(id), data);
  }

  /**
   * 刪除報價
   */
  static async deleteQuotation(id: string): Promise<ApiResponse<null>> {
    return api.delete(API_ENDPOINTS.quotations.delete(id));
  }

  /**
   * 將報價轉換為訂單
   *
   * @param id 報價 ID
   * @param convertData 轉換訂單所需的額外 payload 資料。
   *
   * 前置條件驗證 (如報價是否過期、狀態是否允許轉換) 應在呼叫此方法之前完成，
   * 由上層 (例如應用服務或控制器) 處理。此服務方法僅負責觸發後端轉換 API。
   */
  static async convertToOrder(
    id: string,
    convertData?: ConvertQuotationToOrderPayload
  ): Promise<ApiResponse<{ orderId: string }>> {
    // 移除報價過期和狀態檢查的商業邏輯，這些應由呼叫者或更上層的業務邏輯處理。
    return api.post<{ orderId: string }>(
      API_ENDPOINTS.quotations.convert(id),
      convertData || {}
    );
  }

  /**
   * 取得報價版本歷史
   */
  static async getQuotationVersions(id: string): Promise<ApiResponse<Quotation[]>> {
    return api.get<Quotation[]>(API_ENDPOINTS.quotations.versions(id));
  }
  // `calculateQuotationPreview` 方法已從服務層移除，因其屬於商業邏輯計算而非 API 呼叫。
  // 此類功能應移動至專門的領域邏輯或工具模組中，例如 `/modules/quotations/domain/quotationCalculator.ts`。
}

export default QuotationService;