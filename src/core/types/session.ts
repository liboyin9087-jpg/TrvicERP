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
 * 行程版本
 */
export interface ItineraryVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  itineraryData: any;
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
