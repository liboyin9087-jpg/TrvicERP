
export interface Attraction {
  id: string;
  name: string;
  image_url: string;
  type: string;
  duration_minutes: number;
  lat?: number; // 緯度
  lng?: number; // 經度
  description?: string; // 景點描述
  address?: string; // 地址
}

export interface ItineraryItem extends Attraction {
  time?: string;
  instanceId?: string; 
}

export interface ItineraryState {
  [key: string]: ItineraryItem[];
}

export interface TourSession {
  id: string;
  series_id: string;
  group_number?: string; // 團號
  group_type?: 'welfare' | 'regular'; // 團型：福委團/一般團
  start_date: string;
  end_date: string;
  status: 'soliciting' | 'guaranteed' | 'closed' | 'completed';
  min_pax: number;
  max_pax: number;
  current_pax: number;
  seat_release_date: string;
  price_twd: number; 
  agent_commission: number;
  // 資源分配
  hotel_rooms?: HotelRoomAllocation[];
  transportation_seats?: SeatAssignment[];
  tour_leader_id?: string;
  tour_leader_name?: string;
  // 版本控制
  itinerary_version?: number;
  itinerary_versions?: ItineraryVersion[];
  // 出團前文件
  meeting_info?: MeetingInfo;
  created_at?: string;
  updated_at?: string;
}

// 飯店房型分配
export interface HotelRoomAllocation {
  id: string;
  hotel_name: string;
  room_type: 'single' | 'double' | 'twin' | 'family' | 'suite';
  room_type_label: string; // 顯示用：單人房、雙人房等
  total_count: number; // 總房數
  locked_count: number; // 已鎖定房數
  available_count: number; // 可用房數
  price_per_night?: number;
  nights?: number;
}

// 座位分配
export interface SeatAssignment {
  id: string;
  vehicle_type: 'bus' | 'train' | 'plane' | 'ferry';
  vehicle_number?: string; // 車號/航班號
  seat_number: string; // 座位號
  passenger_id?: string;
  passenger_name?: string;
  booking_id?: string;
  is_assigned: boolean;
}

// 導遊/領隊
export interface TourLeader {
  id: string;
  name: string;
  phone: string;
  email?: string;
  license_number?: string;
  experience_years?: number;
}

// 行程版本
export interface ItineraryVersion {
  version: number;
  created_at: string;
  created_by: string;
  changes: string; // 變更說明
  itinerary_data: any; // 行程資料快照
}

// 集合資訊
export interface MeetingInfo {
  location: string; // 集合地點
  address?: string; // 詳細地址
  meeting_time: string; // 集合時間
  contact_person: string; // 聯絡人
  contact_phone: string; // 聯絡電話
  notes?: string; // 備註
}

// --- Weapon 3: Semi-FIT Options ---
export interface TourOption {
  id: string;
  session_id: string;
  day_number: number;
  title: string;
  description: string;
  price_add_on: number;
  capacity_limit: number;
  quota_used: number;
  image_url?: string;
}

export interface BookingSelection {
  id: string;
  booking_id: string;
  option_id: string;
  pax_count: number;
  total_price: number;
}

export interface Announcement {
  id: string;
  message: string;
  created_at: string;
}

export interface PassportData {
  name: string;
  passport_number: string;
  expiry_date: string;
  nationality: string;
  birthday?: string;
  personal_id?: string;
}

export interface Booking {
  id: string;
  session_id: string;
  user_id?: string; 
  customer_name: string;
  passport_data?: PassportData;
  receipt_number?: string;
  status: 'confirmed' | 'pending' | 'paid' | 'pending_payment' | 'verifying';
  total_amount: number;
  payment_proof_url?: string;
  tags?: string[];
  email?: string;
  // 報名資訊
  room_type?: 'single' | 'double' | 'twin' | 'family';
  meal_preference?: 'normal' | 'vegetarian' | 'halal' | 'other';
  special_needs?: string; // 特殊需求
  seat_preference?: string; // 座位偏好（靠窗、靠走道等）
  companions?: Companion[];
  // 分配資訊
  assigned_room?: string; // 分配的房間號
  assigned_seat?: string; // 分配的座位號
}

// --- Weapon 4: Footprints ---
export interface UserFootprint {
  user_id: string;
  email: string;
  visited_countries: string[]; // ISO codes like ['JP', 'TH', 'FR']
  trip_count: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: 'hotel' | 'airline' | 'transport' | 'restaurant';
  contact_email: string;
  payment_terms: string;
}

export interface TourCost {
  id: string;
  session_id: string;
  supplier_id: string;
  supplier_name: string; 
  item_name: string;
  cost_type: 'fixed' | 'per_pax';
  unit_cost: number;
  currency: string;
  exchange_rate: number;
  status: 'estimated' | 'committed' | 'paid';
}

export type PassportStatus = 'customer' | 'sales' | 'op_safe' | 'embassy' | 'tour_leader' | 'returned';

export interface Passenger {
  id: string;
  user_id?: string;
  name: string;
  english_name?: string;
  passport_number?: string;
  passport_location: PassportStatus;
  booking_id: string;
  birthday: string;
  personal_id: string;
  email?: string;
}

export interface PassportLog {
  id: string;
  passenger_id: string;
  from_user: string;
  to_user: string;
  action: 'check_in' | 'transfer' | 'check_out';
  timestamp: string;
}

export interface TourExpense {
  id: string;
  session_id: string;
  tour_leader_id: string;
  amount_foreign: number;
  currency: 'JPY' | 'USD' | 'EUR' | 'CNY';
  exchange_rate: number;
  amount_twd: number;
  category: 'meal' | 'ticket' | 'transport' | 'tip' | 'other';
  receipt_image_url?: string;
  created_at: string;
  note?: string;
}

export interface QuoteItem {
    id: string;
    name: string;
    type: 'flight' | 'hotel' | 'transport' | 'activity' | 'guide';
    cost_per_pax: number;
    currency: string;
}

export interface MiniQuoteItem {
  id: string;
  item_name: string;
  cost_type: 'fixed' | 'per_pax';
  amount: number;
}

export interface LineChatLog {
  id: string;
  line_user_id: string;
  message_type: 'text' | 'image';
  content: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

export interface CustomerInteraction {
    id: string;
    type: 'line' | 'call' | 'email' | 'counter';
    content: string;
    agent_name: string;
    timestamp: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface CustomerProfile {
    id: string;
    name: string;
    tags: string[];
    total_spend: number;
    interactions: CustomerInteraction[];
}

export interface PublicTourData {
  id: string;
  title: string;
  days: number;
  base_price: number;
  cover_image: string;
  description: string;
  itinerary_json: {
    points: { time: string; name: string; desc: string; image?: string }[];
    hotel: string;
  }[];
  share_token: string;
}

export interface CompanyBudget {
  id: string;
  company_name: string;
  total_budget: number;
  used_budget: number;
  last_updated: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'active' | 'closed';
  total_votes: number;
  ai_summary?: string; 
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  image_url?: string;
  tags: string[];
  vote_count: number;
  is_winner?: boolean;
}

export interface ChangeRequest {
  id: string;
  requester_name: string;
  category: 'itinerary' | 'hotel' | 'meal' | 'pax_count';
  description: string;
  status: 'pending' | 'op_review' | 'client_review' | 'approved' | 'rejected';
  cost_impact: number;
  created_at: string;
  comments?: string; 
}

export interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status_message: string;
  timestamp: string;
  is_active: boolean;
}

// 同行者
export interface Companion {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'other';
  age?: number;
  passport_number?: string;
  special_needs?: string;
}

// 特殊需求統計
export interface SpecialNeedsSummary {
  category: string; // 素食、輪椅、單人房等
  count: number;
  passengers: { id: string; name: string }[];
}

// 全團名單總覽
export interface GroupRoster {
  session_id: string;
  total_passengers: number;
  room_assignments: HotelRoomAllocation[];
  seat_assignments: SeatAssignment[];
  special_needs: SpecialNeedsSummary[];
  registration_progress: {
    total: number;
    confirmed: number;
    pending: number;
    percentage: number;
  };
}

// 房間分配（用於名單表）
export interface RoomAssignment {
  roomNumber: string;
  roomType: 'single' | 'double' | 'twin' | 'family' | 'suite';
  hotelName: string;
  occupants: { id: string; name: string }[];
  checkIn: string;
  checkOut: string;
  notes?: string;
}
