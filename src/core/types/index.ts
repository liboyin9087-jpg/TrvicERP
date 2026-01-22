/**
 * 統一類型匯出
 * Unified Type Exports
 */

// 認證與權限
export * from './auth';

// 訂單管理
export * from './order';

// 報價管理
export * from './quotation';

// 行程安排
export * from './itinerary';

// 團次管理
export * from './session';

// 客戶管理
export * from './customer';

// 企業客戶管理
export * from './corporate';

// 行程產品
export * from './tour';

// 從根目錄 types.ts 匯出的類型（逐步遷移中）
// 以下類型已遷移到對應模組，保留 re-export 以維持相容性
export type {
  ItineraryItem,
  ItineraryState,
  // 預訂相關（未來遷移到 bookings 模組）
  TourSession,
  Booking,
  TourOption,
  BookingSelection,
  Announcement,
  PassportData,
  // 旅客相關（未來遷移到 passengers 模組）
  UserFootprint,
  PassportStatus,
  Passenger,
  PassportLog,
  Companion,
  // 財務相關（未來遷移到 finance 模組）
  Supplier,
  TourCost,
  TourExpense,
  QuoteItem,
  MiniQuoteItem,
  // 通訊相關（未來遷移到 communication 模組）
  LineChatLog,
  // 企業福委相關（未來遷移到 welfare 模組）
  CompanyBudget,
  Poll,
  PollOption,
  // 其他
  ChangeRequest,
  Incident,
  SpecialNeedsSummary,
  GroupRoster,
} from '../../../types';
