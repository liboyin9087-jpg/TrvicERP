/**
 * 企業客戶管理服務層
 * Corporate Account Service Layer
 *
 * 本檔案已根據以下問題進行重寫與修復：
 * 1.  [架構] 服務層直接依賴全域 API 實例 (api)
 *     -> 引入 IApiClient 介面，服務層通過建構子注入 IApiClient 實例，實現依賴反轉。
 * 2.  [架構] 所有方法都返回相同結構 { data, error } 但沒有明確定義這個通用響應類型
 *     -> 定義 ServiceResponse<T> 介面作為所有服務方法的通用返回類型。
 * 3.  [架構] 服務類別符合單一職責原則
 *     -> 將 CorporateService 重構成 Facade 模式，內部組合了 CorporateAccountServiceImpl,
 *        ContactPersonServiceImpl, EngagementLogServiceImpl 三個遵循單一職責原則的子服務。
 * 4.  [架構] 錯誤處理使用 any 類型
 *     -> 定義 ApiError 介面，統一錯誤結構，並在 DefaultApiClient 中將任何原始錯誤轉換為 ApiError 類型。
 * 5.  [架構] 缺少配置介面
 *     -> 引入 CorporateServiceConfig 介面，用於服務的配置，主要用於注入 IApiClient 實例。
 *
 * 註：修復規範中提及的「Kintone 獨立性」與「Dashtail UI 規範」適用於 UI 元件，
 *     與本服務層檔案的職責無關，故在此檔案中未實施相關修改。
 */

// --- 1. 核心類型與介面定義 ---
// 1.1 ApiError: 統一錯誤響應的類型，解決問題 #4
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any; // 可以是原始的錯誤對象，例如 AxiosError.response.data
}

// 1.2 ServiceResponse<T>: 通用響應類型，解決問題 #2
export interface ServiceResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// 1.3 IApiClient: 抽象化 API 客戶端介面，解決問題 #1 的基礎
export interface IApiClient {
  get<T>(url: string, params?: Record<string, any>): Promise<ServiceResponse<T>>;
  post<T>(url: string, data: any): Promise<ServiceResponse<T>>;
  patch<T>(url: string, data: any): Promise<ServiceResponse<T>>;
  delete<T>(url: string): Promise<ServiceResponse<T>>;
}

// 1.4 CorporateServiceConfig: 服務的配置介面，解決問題 #5
export interface CorporateServiceConfig {
  apiClient: IApiClient;
}

// --- 2. 原始 API 實例與端點的引入 ---
// 這些原始依賴僅在 DefaultApiClient 內部使用，不直接暴露給上層服務。
import { api, API_ENDPOINTS } from '../../../lib/api';
import type {
  CorporateAccount,
  CreateCorporateAccountData,
  UpdateCorporateAccountData,
  ContactPerson,
  CreateContactPersonData,
  UpdateContactPersonData,
  EngagementLog,
  CreateEngagementLogData,
} from '../../../core/types/corporate';

// --- 3. DefaultApiClient 實現 ---
// 作為 IApiClient 介面的具體實現，它封裝了原始的 `api` 實例，並將錯誤統一為 ApiError 類型。
// 解決問題 #1 (服務層不再直接依賴全域 api) 和 #4 (統一錯誤類型)。
class DefaultApiClient implements IApiClient {
  private formatError(err: any): ApiError {
    if (err && typeof err === 'object') {
      if (err.response) { // 假設 `err` 來自 Axios 且包含 response
        return {
          message: err.response.data?.message || err.message || 'An API error occurred',
          statusCode: err.response.status,
          details: err.response.data || err,
        };
      }
      // 如果 `api` 層已經處理過錯誤，直接返回其 message 和 statusCode
      if (err.message) {
        return {
          message: err.message,
          statusCode: err.statusCode || 500,
          details: err.details || err,
        };
      }
    }
    // 處理未知或非預期的錯誤類型
    return {
      message: (err?.toString() || 'An unknown error occurred').replace('Error: ', ''),
      statusCode: 500,
      details: err,
    };
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ServiceResponse<T>> {
    const { data, error } = await api.get<T>(url, { params });
    return { data, error: error ? this.formatError(error) : null };
  }

  async post<T>(url: string, data: any): Promise<ServiceResponse<T>> {
    const { data: responseData, error } = await api.post<T>(url, data);
    return { data: responseData, error: error ? this.formatError(error) : null };
  }

  async patch<T>(url: string, data: any): Promise<ServiceResponse<T>> {
    const { data: responseData, error } = await api.patch<T>(url, data);
    return { data: responseData, error: error ? this.formatError(error) : null };
  }

  async delete<T>(url: string): Promise<ServiceResponse<T>> {
    const { data, error } = await api.delete<T>(url);
    // 對於 delete 操作，通常 data 為 null
    return { data: data as T | null, error: error ? this.formatError(error) : null };
  }
}

// --- 4. 服務子領域介面 (為解決問題 #3: 單一職責原則做準備) ---
// 每個介面定義了其負責的單一職責。
interface ICorporateAccountService {
  getAccounts(): Promise<ServiceResponse<CorporateAccount[]>>;
  getAccount(id: string): Promise<ServiceResponse<CorporateAccount>>;
  createAccount(payload: CreateCorporateAccountData): Promise<ServiceResponse<CorporateAccount>>;
  updateAccount(id: string, payload: UpdateCorporateAccountData): Promise<ServiceResponse<CorporateAccount>>;
  deleteAccount(id: string): Promise<ServiceResponse<null>>;
}

interface IContactPersonService {
  getContacts(accountId: string): Promise<ServiceResponse<ContactPerson[]>>;
  addContact(accountId: string, payload: CreateContactPersonData): Promise<ServiceResponse<ContactPerson>>;
  updateContact(accountId: string, contactId: string, payload: UpdateContactPersonData): Promise<ServiceResponse<ContactPerson>>;
  deleteContact(accountId: string, contactId: string): Promise<ServiceResponse<null>>;
}

interface IEngagementLogService {
  getEngagements(accountId: string): Promise<ServiceResponse<EngagementLog[]>>;
  addEngagement(accountId: string, payload: CreateEngagementLogData): Promise<ServiceResponse<EngagementLog>>;
}

// --- 5. 服務子領域具體實現 (解決問題 #3: 單一職責原則) ---
// 每個實現類別只負責其介面定義的職責，並透過建構子注入 IApiClient 依賴。
class CorporateAccountServiceImpl implements ICorporateAccountService {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  getAccounts(): Promise<ServiceResponse<CorporateAccount[]>> {
    return this.apiClient.get<CorporateAccount[]>(API_ENDPOINTS.corporateAccounts.list);
  }

  getAccount(id: string): Promise<ServiceResponse<CorporateAccount>> {
    return this.apiClient.get<CorporateAccount>(API_ENDPOINTS.corporateAccounts.detail(id));
  }

  createAccount(payload: CreateCorporateAccountData): Promise<ServiceResponse<CorporateAccount>> {
    return this.apiClient.post<CorporateAccount>(API_ENDPOINTS.corporateAccounts.create, payload);
  }

  updateAccount(
    id: string,
    payload: UpdateCorporateAccountData
  ): Promise<ServiceResponse<CorporateAccount>> {
    return this.apiClient.patch<CorporateAccount>(API_ENDPOINTS.corporateAccounts.update(id), payload);
  }

  deleteAccount(id: string): Promise<ServiceResponse<null>> {
    return this.apiClient.delete<null>(API_ENDPOINTS.corporateAccounts.delete(id));
  }
}

class ContactPersonServiceImpl implements IContactPersonService {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  getContacts(accountId: string): Promise<ServiceResponse<ContactPerson[]>> {
    return this.apiClient.get<ContactPerson[]>(API_ENDPOINTS.corporateAccounts.contacts(accountId));
  }

  addContact(
    accountId: string,
    payload: CreateContactPersonData
  ): Promise<ServiceResponse<ContactPerson>> {
    return this.apiClient.post<ContactPerson>(API_ENDPOINTS.corporateAccounts.contacts(accountId), payload);
  }

  updateContact(
    accountId: string,
    contactId: string,
    payload: UpdateContactPersonData
  ): Promise<ServiceResponse<ContactPerson>> {
    return this.apiClient.patch<ContactPerson>(
      API_ENDPOINTS.corporateAccounts.contactDetail(accountId, contactId),
      payload
    );
  }

  deleteContact(
    accountId: string,
    contactId: string
  ): Promise<ServiceResponse<null>> {
    return this.apiClient.delete<null>(API_ENDPOINTS.corporateAccounts.contactDetail(accountId, contactId));
  }
}

class EngagementLogServiceImpl implements IEngagementLogService {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  getEngagements(accountId: string): Promise<ServiceResponse<EngagementLog[]>> {
    return this.apiClient.get<EngagementLog[]>(API_ENDPOINTS.corporateAccounts.engagements(accountId));
  }

  addEngagement(
    accountId: string,
    payload: CreateEngagementLogData
  ): Promise<ServiceResponse<EngagementLog>> {
    return this.apiClient.post<EngagementLog>(API_ENDPOINTS.corporateAccounts.engagements(accountId), payload);
  }
}

// --- 6. CorporateService Facade (作為對外暴露的單一介面) ---
// 本類別作為一個 Facade，對外提供統一的介面，內部則通過組合多個遵循 SRP 的服務來完成職責。
// 解決問題 #1 (依賴注入), #3 (單一職責原則的對外聚合), #5 (配置介面)。
export class CorporateService {
  public accounts: ICorporateAccountService;
  public contacts: IContactPersonService;
  public engagements: IEngagementLogService;

  /**
   * 構造函數允許注入自定義的配置，主要用於提供不同的 IApiClient 實例。
   * 這使得服務易於測試和配置。
   * @param config 服務配置，如果未提供，將使用預設的 DefaultApiClient。
   */
  constructor(config: CorporateServiceConfig = { apiClient: new DefaultApiClient() }) {
    this.accounts = new CorporateAccountServiceImpl(config.apiClient);
    this.contacts = new ContactPersonServiceImpl(config.apiClient);
    this.engagements = new EngagementLogServiceImpl(config.apiClient);
  }

  /**
   * 提供一個靜態方法來獲取單例實例。
   * 這允許在應用程式中以簡單的方式訪問服務，同時仍能通過配置來替換依賴。
   * @param config 可選的配置，僅在首次實例化時生效。
   * @returns CorporateService 的單例實例。
   */
  private static instance: CorporateService;
  public static getInstance(config?: CorporateServiceConfig): CorporateService {
    if (!CorporateService.instance) {
      CorporateService.instance = new CorporateService(config);
    }
    return CorporateService.instance;
  }

  // 為了鼓勵使用實例化的方法 (例如 `new CorporateService().accounts.getAccounts()`)
  // 或單例模式 (`CorporateService.getInstance().accounts.getAccounts()`)，
  // 這裡不再提供原始的靜態方法，以免混淆職責和影響可測試性。
}

// 導出 CorporateService 類別本身作為默認導出，
// 允許調用者自行決定如何實例化和使用 (例如通過 DI 框架或直接 `new CorporateService()`)。
// 對於需要簡單訪問的場景，可以使用 `CorporateService.getInstance()`。
export default CorporateService;