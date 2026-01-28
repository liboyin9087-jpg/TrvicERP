/**
 * 團次管理核心類型定義
 * Session Management Core Types
 */

/**
 * 團次狀態
 */
export type SessionStatus = 'soliciting' | 'guaranteed' | 'closed' | 'completed' | 'cancelled';

/**
 * 團型
 */
export type GroupType = 'welfare' | 'regular';

/**
 * 房型
 */
export type RoomType = 'single' | 'double' | 'twin' | 'family' | 'suite';

/**
 * 飯店房型分配
 */
export interface HotelRoomAllocation {
  id: string;
  hotelName: string;
  roomType: RoomType;
  roomTypeLabel: string;
  totalCount: number;
  lockedCount: number;
  availableCount: number;
  pricePerNight?: number;
  nights?: number;
}

/**
 * 座位分配
 */
export interface SeatAssignment {
  id: string;
  vehicleType: 'bus' | 'train' | 'plane' | 'ferry';
  vehicleNumber?: string;
  seatNumber: string;
  passengerId?: string;
  passengerName?: string;
  bookingId?: string;
  isAssigned: boolean;
}

/**
 * 導遊/領隊
 * 備註：email 和 licenseNumber 在資料結構層面為可選，
 * 但在特定業務情境（例如團次確認出發時）可能需要業務邏輯進行強制驗證。
 */
export interface TourLeader {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  experienceYears?: number;
}

/**
 * 行程活動類型
 */
export type ItineraryActivityType = 'sightseeing' | 'meal' | 'transportation' | 'accommodation' | 'free_time' | 'other';

/**
 * 行程中的單個活動
 */
export interface ItineraryActivity {
  id: string; // 活動的唯一識別碼
  type: ItineraryActivityType; // 活動類型
  startTime?: string; // 活動開始時間 (例如: "08:00", "08:30 AM")
  endTime?: string;   // 活動結束時間 (例如: "10:00", "10:30 AM")
  title: string;      // 活動標題或名稱
  description?: string; // 活動詳細描述
  location?: string;  // 活動地點名稱或地址
  coordinates?: { lat: number; lng: number }; // 活動的地理座標
  notes?: string;     // 活動備註
}

/**
 * 行程中的單天安排
 */
export interface ItineraryDay {
  dayNumber: number; // 行程中的第幾天 (1-based)
  date?: string;     // 該天的具體日期 (ISO 8601 格式: YYYY-MM-DD), 如果行程有固定日期
  theme?: string;    // 該天的主題 (例如: "古蹟探索日", "海濱風情")
  activities: ItineraryActivity[]; // 該天的活動列表
  meals?: {
    breakfast?: string; // 早餐描述 (例如: "飯店早餐", "自理")
    lunch?: string;     // 午餐描述
    dinner?: string;    // 晚餐描述
  };
  accommodation?: {
    hotelName: string;
    roomType?: RoomType;
    address?: string;
    contactPhone?: string;
  };
  transportationDetails?: string; // 該天交通總覽或備註
  notes?: string;    // 該天備註
}

/**
 * 團次行程內容
 * 詳細定義 itineraryData 的結構，取代 any
 */
export interface ItineraryContent {
  id: string; // 行程內容的唯一識別碼 (例如，作為版本識別的一部分)
  name: string; // 行程名稱 (例如: "日本關西五日遊標準版")
  durationDays: number; // 行程總天數
  overview?: string; // 行程總覽描述
  days: ItineraryDay[]; // 每日行程細節
  inclusions?: string[]; // 包含項目列表 (例如: "來回機票", "全程餐食")
  exclusions?: string[]; // 不包含項目列表
  travelTips?: string; // 行程旅行提示
}

/**
 * 行程版本
 */
export interface ItineraryVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  itineraryData: ItineraryContent; // 已修正: 使用 ItineraryContent 類型取代 'any'
}

/**
 * 集合資訊
 */
export interface MeetingInfo {
  location: string;
  address?: string;
  meetingTime: string;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
}

/**
 * 團次
 */
export interface Session {
  id: string;
  seriesId: string;
  tourId: string;
  groupNumber?: string;
  groupType?: GroupType;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  minPax: number;
  maxPax: number;
  currentPax: number;
  seatReleaseDate: string;
  priceTwd: number;
  agentCommission: number;
  hotelRooms?: HotelRoomAllocation[];
  transportationSeats?: SeatAssignment[];
  tourLeaderId?: string;
  tourLeaderName?: string;
  itineraryVersion?: number;
  itineraryVersions?: ItineraryVersion[];
  meetingInfo?: MeetingInfo;
  createdAt: string;
  updatedAt: string;
}

/**
 * 建立團次資料
 */
export interface CreateSessionData {
  seriesId: string;
  tourId: string;
  groupNumber?: string;
  groupType?: GroupType;
  startDate: string;
  endDate: string;
  minPax: number;
  maxPax: number;
  seatReleaseDate: string;
  priceTwd: number;
  agentCommission?: number;
}

/**
 * 更新團次資料
 */
export interface UpdateSessionData {
  groupNumber?: string;
  groupType?: GroupType;
  startDate?: string;
  endDate?: string;
  status?: SessionStatus;
  minPax?: number;
  maxPax?: number;
  currentPax?: number;
  seatReleaseDate?: string;
  priceTwd?: number;
  agentCommission?: number;
  tourLeaderId?: string;
  tourLeaderName?: string;
  meetingInfo?: MeetingInfo;
}

/**
 * 團次查詢條件
 */
export interface SessionQuery {
  tourId?: string;
  status?: SessionStatus | SessionStatus[];
  groupType?: GroupType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * 團次狀態轉換規則
 */
export const SESSION_STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  soliciting: ['guaranteed', 'cancelled'],
  guaranteed: ['closed', 'cancelled'],
  closed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * 驗證團次狀態轉換
 */
export function isValidSessionTransition(
  currentStatus: SessionStatus,
  newStatus: SessionStatus
): boolean {
  return SESSION_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}