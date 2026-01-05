// =====================================================
// TravelCanvas - 完整類型定義
// =====================================================

// =====================================================
// 基礎枚舉與類型
// =====================================================

export enum BadgeType {
  URGENCY = 'URGENCY',
  GLORY = 'GLORY',
  NONE = 'NONE'
}

export type Role = 'BOSS' | 'ADMIN' | 'HR' | 'CLIENT' | 'EMPLOYEE';
// App-level role alias (for auth mapping)
export type UserRole = Role;
export type AudienceType = 'TECH' | 'SALES' | 'EXECUTIVE' | 'GENERAL';
export type Language = 'zh' | 'en';
export type ActivityType = 'MEETING' | 'FREE' | 'MEAL' | 'TRANSPORT' | 'ACTIVITY';
export type BatchStatus = 'OPEN' | 'FULL' | 'CLOSE' | 'WAITING';
export type OrderStatus = 'new' | 'deposit_paid' | 'confirmed' | 'ticketed' | 'departed' | 'completed' | 'cancelled' | 'refunded';
export type UrgencyLevel = 'critical' | 'urgent' | 'normal' | 'full';

// =====================================================
// 使用者 & 認證
// =====================================================

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// =====================================================
// 競品資料
// =====================================================

export interface CompetitorData {
  name: string;
  buildYear: number;
  distanceToStation: number;
  roomSize: number;
  tags: string[];
  hiddenCost: number;
  description: string;
}

export interface CompetitorHotel {
  id: string;
  hotel_name: string;
  location: string;
  star_rating: number;
  year_built?: number;
  year_renovated?: number;
  tags: string[];
  pros: string[];
  cons: string[];
  typical_price_range?: {
    min: number;
    max: number;
  };
  verified?: boolean;
}

// =====================================================
// 選項與類別 (配置器)
// =====================================================

export interface SpecData {
  buildYear: number;
  distanceToStation: number;
  roomSize: number;
  tags: string[];
}

export interface Option {
  id: string;
  title: string;
  description: string;
  priceModifier: number;
  imageUrl: string;
  badgeText?: string;
  badgeType?: BadgeType;
  specData?: SpecData;
  competitorBenchmark?: CompetitorData;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  options: Option[];
}

export interface TripConfig {
  basePrice: number;
  currency: string;
  tripName: string;
  duration: string;
  minGroupSize: number;
}

export interface SelectionState {
  [categoryId: string]: Option;
}

// =====================================================
// 行程導覽 (Pocket Guide)
// =====================================================

export interface ItineraryItem {
  id: string;
  startTime: Date;
  endTime: Date;
  activityName: string;
  locationName: string;
  geo: { lat: number; lng: number };
  type: ActivityType;
  imageUrl: string;
  tips?: string;
  isImportant?: boolean;
}

export interface WeatherInfo {
  temp: number;
  condition: 'SUNNY' | 'RAIN' | 'CLOUDY' | 'SNOW';
  advice: string;
}

export interface GuideContact {
  name: string;
  phone: string;
  lineId: string;
  avatarUrl: string;
}

// =====================================================
// ERP 團控管理
// =====================================================

export interface TourProduct {
  id: string;
  code: string;
  name: string;
  destination: string;
  duration_days: number;
  description?: string;
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  base_cost?: number;
  status?: 'draft' | 'active' | 'archived';
}

export interface TourGroup {
  id: string;
  group_code: string;
  product_code: string;
  product_name: string;
  destination?: string;
  departure_date: string;
  return_date: string;
  price_b2b: number;
  price_b2c: number;
  total_seats: number;
  reserved_seats: number;
  sold_seats: number;
  available_seats: number;
  occupancy_rate: number;
  urgency_level: UrgencyLevel;
  status: 'open' | 'full' | 'closed' | 'departed' | 'completed' | 'cancelled';
  status_display: string;
  guide_name?: string;
  guide_phone?: string;
  notes?: string;
}

export interface DepartureBatch {
  id: string;
  date: string;
  sku: string;
  totalSeats: number;
  sold: number;
  reserved: number;
  priceB2B: number;
  priceB2C: number;
  cost: number;
  status: BatchStatus;
  profitMargin: number;
}

export interface BookingOrder {
  id: string;
  order_number: string;
  tour_group?: TourGroup;
  group_code?: string;
  product_name?: string;
  departure_date?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_type: 'b2b' | 'b2c';
  pax_count: number;
  unit_price?: number;
  total_amount: number;
  deposit_amount?: number;
  paid_amount?: number;
  balance_due?: number;
  payment_status?: 'paid' | 'partial' | 'unpaid';
  status: OrderStatus;
  status_display?: string;
  created_at?: string;
}

export interface Passenger {
  id: string;
  order_id: string;
  name_zh: string;
  name_en: string;
  gender: 'M' | 'F';
  birth_date: string;
  passport_number: string;
  passport_expiry: string;
  id_number?: string;
  phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  dietary_restrictions?: string[];
  special_needs?: string;
  room_preference?: string;
}

// =====================================================
// 儀表板統計
// =====================================================

export interface DashboardStats {
  upcoming_groups: number;
  critical_groups: number;
  urgent_groups: number;
  orders_this_month: number;
  revenue_this_month: number;
  departing_soon: TourGroup[];
}

// =====================================================
// 飯店選項 (用於配置器)
// =====================================================

export interface HotelOption {
  id: string;
  hotel_name: string;
  location: string;
  star_rating: number;
  distance_to_station?: string;
  room_size?: number;
  year_built?: number;
  tags?: string[];
  price_modifier?: number;
  image_url?: string;
}

// =====================================================
// API 響應類型
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  next?: string;
  previous?: string;
}

// =====================================================
// 表單狀態
// =====================================================

export interface FormState {
  isLoading: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// =====================================================
// 翻譯類型
// =====================================================

export interface TranslationDict {
  // 通用
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  back: string;
  next: string;
  
  // 登入
  signIn: string;
  signingIn: string;
  username: string;
  password: string;
  loginError: string;
  secureLogin: string;
  hint: string;
  exit: string;
  
  // 配置器
  estimatedBudget: string;
  autoMatch: string;
  competitorAnalysis: string;
  generatePitch: string;
  
  // ERP
  dashboard: string;
  series: string;
  orders: string;
  newBatch: string;
  syncing: string;
  departureDate: string;
  status: string;
  avail: string;
  sold: string;
  reserved: string;
  saveChanges: string;
}
