// =============================================================================
// TrvicERP Branded Types - 統一型別定義
// 版本：2.0.0
// 說明：所有 Branded Types 的單一真相來源
// =============================================================================

// =============================================================================
// 基礎 Branded Type 工具
// =============================================================================

export type Branded<T, B> = T & { readonly __brand: B };

// =============================================================================
// 通用 ID 類型
// =============================================================================

export type ID = Branded<string, 'ID'>;
export type UUID = Branded<string, 'UUID'>;

// =============================================================================
// 使用者相關 ID
// =============================================================================

export type UserId = Branded<string, 'UserId'>;
export type CustomerId = Branded<string, 'CustomerId'>;
export type AgentId = Branded<string, 'AgentId'>;
export type ContactId = Branded<string, 'ContactId'>;
export type TagId = Branded<string, 'TagId'>;
export type TourLeaderId = Branded<string, 'TourLeaderId'>;

// =============================================================================
// 旅遊業務相關 ID
// =============================================================================

export type SessionId = Branded<string, 'SessionId'>;
export type SeriesId = Branded<string, 'SeriesId'>;
export type TourId = Branded<string, 'TourId'>;
export type QuotationId = Branded<string, 'QuotationId'>;
export type OrderId = Branded<string, 'OrderId'>;

// =============================================================================
// 住宿與房間相關 ID
// =============================================================================

export type HotelId = Branded<string, 'HotelId'>;
export type RoomId = Branded<string, 'RoomId'>;
export type RoomingListId = Branded<string, 'RoomingListId'>;
export type HotelRoomAllocationId = Branded<string, 'HotelRoomAllocationId'>;

// =============================================================================
// 行程與活動相關 ID
// =============================================================================

export type ItineraryId = Branded<string, 'ItineraryId'>;
export type AttractionId = Branded<string, 'AttractionId'>;
export type HighlightId = Branded<string, 'HighlightId'>;
export type InclusionId = Branded<string, 'InclusionId'>;
export type ActivityId = Branded<string, 'ActivityId'>;
export type POIId = Branded<string, 'POIId'>;

// =============================================================================
// 財務相關 ID
// =============================================================================

export type TransactionId = Branded<string, 'TransactionId'>;
export type InvoiceId = Branded<string, 'InvoiceId'>;
export type ReceiptId = Branded<string, 'ReceiptId'>;
export type PaymentId = Branded<string, 'PaymentId'>;

// =============================================================================
// 文件與合約相關 ID
// =============================================================================

export type ContractId = Branded<string, 'ContractId'>;
export type DocumentId = Branded<string, 'DocumentId'>;
export type TemplateId = Branded<string, 'TemplateId'>;
export type PolicyId = Branded<string, 'PolicyId'>;

// =============================================================================
// 設備與資源相關 ID
// =============================================================================

export type VehicleId = Branded<string, 'VehicleId'>;
export type EquipmentId = Branded<string, 'EquipmentId'>;
export type SupplierId = Branded<string, 'SupplierId'>;
export type GuideId = Branded<string, 'GuideId'>;

// =============================================================================
// 數值與金額相關 Branded Types
// =============================================================================

export type NTAmount = Branded<number, 'NTAmount'>;
export type USDAmount = Branded<number, 'USDAmount'>;
export type Price = Branded<number, 'Price'>;
export type Cost = Branded<number, 'Cost'>;
export type Percentage = Branded<number, 'Percentage'>;
export type Quantity = Branded<number, 'Quantity'>;

// =============================================================================
// 時間與日期相關 Branded Types
// =============================================================================

export type DateTimeString = Branded<string, 'DateTimeString'>;
export type DateString = Branded<string, 'DateString'>;
export type TimeString = Branded<string, 'TimeString'>;
export type Duration = Branded<number, 'Duration'>;
export type DaysCount = Branded<number, 'DaysCount'>;

// =============================================================================
// 狀態與流程相關 ID
// =============================================================================

export type StatusId = Branded<string, 'StatusId'>;
export type WorkflowId = Branded<string, 'WorkflowId'>;
export type TaskId = Branded<string, 'TaskId'>;
export type ProcessId = Branded<string, 'ProcessId'>;

// =============================================================================
// 位置與地理相關 ID
// =============================================================================

export type LocationId = Branded<string, 'LocationId'>;
export type AddressId = Branded<string, 'AddressId'>;
export type RegionId = Branded<string, 'RegionId'>;
export type CountryId = Branded<string, 'CountryId'>;

// =============================================================================
// 通訊與聯絡相關 ID
// =============================================================================

export type PhoneId = Branded<string, 'PhoneId'>;
export type EmailId = Branded<string, 'EmailId'>;
export type MessageId = Branded<string, 'MessageId'>;
export type NotificationId = Branded<string, 'NotificationId'>;

// =============================================================================
// 安全與權限相關 ID
// =============================================================================

export type PermissionId = Branded<string, 'PermissionId'>;
export type RoleId = Branded<string, 'RoleId'>;
export type Token = Branded<string, 'Token'>;
export type SessionToken = Branded<string, 'SessionToken'>;

// =============================================================================
// 報告與分析相關 ID
// =============================================================================

export type ReportId = Branded<string, 'ReportId'>;
export type DashboardId = Branded<string, 'DashboardId'>;
export type MetricId = Branded<string, 'MetricId'>;
export type AnalyticsId = Branded<string, 'AnalyticsId'>;

// =============================================================================
// 團控管理相關 ID
// =============================================================================

export type PaxCount = Branded<number, 'PaxCount'>;
export type SeatAssignmentId = Branded<string, 'SeatAssignmentId'>;
export type GroupId = Branded<string, 'GroupId'>;
export type SubgroupId = Branded<string, 'SubgroupId'>;

// =============================================================================
// 健康與醫療相關 ID
// =============================================================================

export type MedicalRecordId = Branded<string, 'MedicalRecordId'>;
export type InsuranceId = Branded<string, 'InsuranceId'>;
export type EmergencyContactId = Branded<string, 'EmergencyContactId'>;
export type AllergyId = Branded<string, 'AllergyId'>;

// =============================================================================
// 證件與簽證相關 ID
// =============================================================================

export type PassportId = Branded<string, 'PassportId'>;
export type VisaId = Branded<string, 'VisaId'>;
export type DocumentNumber = Branded<string, 'DocumentNumber'>;

// =============================================================================
// 類型驗證工具函數
// =============================================================================

/**
 * 建立 Branded Type 的工具函數
 * @param value 原始值
 * @returns Branded Type
 */
export function createId<T extends string>(value: T): Branded<T, 'ID'> {
    return value as Branded<T, 'ID'>;
}

export function createUserId(value: string): UserId {
    return value as UserId;
}

export function createSessionId(value: string): SessionId {
    return value as SessionId;
}

export function createQuotationId(value: string): QuotationId {
    return value as QuotationId;
}

export function createOrderId(value: string): OrderId {
    return value as OrderId;
}

export function createNTAmount(value: number): NTAmount {
    return value as NTAmount;
}

export function createPercentage(value: number): Percentage {
    return value as Percentage;
}

/**
 * 檢查是否為有效的 Branded Type
 * @param value 要檢查的值
 * @param brand 期望的品牌類型
 */
export function isValidBranded<T>(value: any, brand: string): value is Branded<any, T> {
    return typeof value === 'string' && value.includes && typeof value === 'object';
}

/**
 * 安全地從 Branded Type 提取原始值
 * @param brandedValue Branded Type 值
 * @returns 原始值
 */
export function extractBrandedValue<T>(brandedValue: Branded<T, any>): T {
    return brandedValue as T;
}

// =============================================================================
// 通用 Branded Type 別名
// =============================================================================

export type CommonBrandedTypes = {
    ID: ID;
    UserId: UserId;
    SessionId: SessionId;
    QuotationId: QuotationId;
    OrderId: OrderId;
    NTAmount: NTAmount;
    Percentage: Percentage;
    DateTimeString: DateTimeString;
};

// =============================================================================
// 匯出所有 Branded Types（用於類型檢查）
// =============================================================================

export type AllBrandedTypes = 
    | ID | UUID
    | UserId | CustomerId | AgentId | ContactId | TagId | TourLeaderId
    | SessionId | SeriesId | TourId | QuotationId | OrderId
    | HotelId | RoomId | RoomingListId | HotelRoomAllocationId
    | ItineraryId | AttractionId | HighlightId | InclusionId | ActivityId | POIId
    | TransactionId | InvoiceId | ReceiptId | PaymentId
    | ContractId | DocumentId | TemplateId | PolicyId
    | VehicleId | EquipmentId | SupplierId | GuideId
    | NTAmount | USDAmount | Price | Cost | Percentage | Quantity
    | DateTimeString | DateString | TimeString | Duration | DaysCount
    | StatusId | WorkflowId | TaskId | ProcessId
    | LocationId | AddressId | RegionId | CountryId
    | PhoneId | EmailId | MessageId | NotificationId
    | PermissionId | RoleId | Token | SessionToken
    | ReportId | DashboardId | MetricId | AnalyticsId
    | PaxCount | SeatAssignmentId | GroupId | SubgroupId
    | MedicalRecordId | InsuranceId | EmergencyContactId | AllergyId
    | PassportId | VisaId | DocumentNumber;

// =============================================================================
// 版本資訊
// =============================================================================

export const BRANDED_TYPES_VERSION = '2.0.0';
export const BRANDED_TYPES_LAST_UPDATED = '2025-01-21';
