// =====================================================
// TravelCanvas - Extended Type Definitions
// 擴展類型：反雷資料庫、供應商管理、RFP、版本控制
// =====================================================

// =====================================================
// 反雷資料庫類型
// =====================================================

export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WarningCategory = 'quality' | 'service' | 'safety' | 'price' | 'reliability' | 'legal';
export type SupplierType = 'hotel' | 'restaurant' | 'transport' | 'activity' | 'shopping' | 'other';

export interface WarningReport {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_type: SupplierType;
  severity: WarningSeverity;
  category: WarningCategory;
  title: string;
  description: string;
  evidence: string[];
  reported_by: string;
  reported_at: string;
  verified: boolean;
  verified_by?: string;
  trust_score: number;
  view_count: number;
  is_active: boolean;
  resolution?: string;
  resolved_at?: string;
}

export interface WarningStats {
  total_reports: number;
  verified_reports: number;
  by_severity: Record<WarningSeverity, number>;
  by_category: Record<WarningCategory, number>;
  top_reported_suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    report_count: number;
  }>;
}

// =====================================================
// 供應商管理類型
// =====================================================

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  category: string;
  location: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  payment_terms: 'COD' | 'NET15' | 'NET30' | 'NET60';
  commission_rate: number;
  contract_start: string;
  contract_end: string;
  rating: number;
  warning_count: number;
  total_bookings: number;
  total_revenue: number;
  is_active: boolean;
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SupplierPayable {
  id: string;
  supplier_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  invoice_number?: string;
  invoice_date?: string;
  paid_date?: string;
  notes?: string;
}

export interface CommissionRecord {
  id: string;
  supplier_id: string;
  booking_id: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'received' | 'disputed';
  received_date?: string;
}

// =====================================================
// RFP (需求提案) 類型
// =====================================================

export interface RFPRequest {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  employee_count: number;
  budget_per_person: { min: number; max: number };
  preferred_destinations: string[];
  preferred_dates: { start: string; end: string };
  duration_days: number;
  special_requirements: string[];
  created_at: string;
  status: 'draft' | 'open' | 'reviewing' | 'awarded' | 'cancelled';
  quote_count: number;
  deadline: string;
  awarded_to?: string;
  awarded_quote_id?: string;
}

export interface QuoteResponse {
  id: string;
  rfp_id: string;
  agency_id: string;
  agency_name: string;
  submitted_at: string;
  
  // 基本報價
  price_per_person: number;
  total_price: number;
  currency: string;
  
  // 行程摘要
  itinerary_summary: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  
  // 詳細行程（原子化）
  detailed_itinerary?: ItineraryAtom[];
  
  // 狀態
  status: 'draft' | 'submitted' | 'shortlisted' | 'awarded' | 'rejected';
  
  // 評分
  client_rating?: number;
  client_feedback?: string;
  
  // 附件
  attachments?: string[];
}

// =====================================================
// 原子化行程類型
// =====================================================

export type AtomType = 'transport' | 'accommodation' | 'meal' | 'activity' | 'shopping' | 'checkpoint';

export interface ItineraryAtom {
  id: string;
  type: AtomType;
  day: number;
  sequence: number;
  
  // 時間
  start_time: string;
  end_time: string;
  duration_minutes: number;
  
  // 基本資訊
  name: string;
  description?: string;
  location: {
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  
  // 成本結構
  cost: {
    type: 'fixed' | 'per_person' | 'tiered';
    base_cost: number;
    per_person_cost?: number;
    tiers?: Array<{ min_pax: number; max_pax: number; cost_per_person: number }>;
  };
  
  // 供應商
  supplier_id?: string;
  supplier_name?: string;
  
  // 容量限制
  capacity?: {
    min: number;
    max: number;
  };
  
  // 標籤與元數據
  tags?: string[];
  seasonality?: string[];
  accessibility?: string[];
  
  // 警告狀態
  warning_count?: number;
  risk_level?: 'low' | 'medium' | 'high';
  
  // 媒體
  image_url?: string;
  
  // 備註
  notes?: string;
  tips?: string;
}

// =====================================================
// 版本控制類型
// =====================================================

export interface VersionChange {
  field: string;
  old_value: any;
  new_value: any;
  price_impact: number;
}

export interface VersionHistory {
  id: string;
  entity_type: 'itinerary' | 'quote' | 'booking';
  entity_id: string;
  version: number;
  changes: VersionChange[];
  created_by: string;
  created_at: string;
  note?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface VersionDiff {
  version_from: number;
  version_to: number;
  changes: VersionChange[];
  total_price_impact: number;
  summary: string;
}

// =====================================================
// LINE 整合類型
// =====================================================

export interface LINENotification {
  id: string;
  booking_id: string;
  type: 'reminder' | 'update' | 'emergency' | 'photo_share';
  title: string;
  message: string;
  scheduled_at?: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  recipients: string[];
  error_message?: string;
}

export interface LINEGroup {
  id: string;
  booking_id: string;
  group_name: string;
  group_id: string;
  created_at: string;
  member_count: number;
  is_active: boolean;
}

// =====================================================
// 儀表板統計類型
// =====================================================

export interface DashboardMetrics {
  // 訂單統計
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    this_month: number;
    growth_percent: number;
  };
  
  // 營收統計
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_percent: number;
  };
  
  // 供應商統計
  suppliers: {
    total: number;
    active: number;
    with_warnings: number;
    pending_payables: number;
  };
  
  // RFP 統計
  rfp: {
    open: number;
    submitted: number;
    won: number;
    win_rate: number;
  };
  
  // 警告統計
  warnings: {
    total_active: number;
    critical: number;
    pending_verification: number;
  };
}

// =====================================================
// 擴展基礎類型
// =====================================================

export interface Destination {
  id: string;
  name: string;
  country: string;
  city: string | null;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TravelPackage {
  id: string;
  destination_id: string | null;
  name: string;
  description: string;
  duration_days: number;
  base_price: number;
  currency: string;
  max_capacity: number;
  image_url: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  destination?: Destination;
}

export interface Customer {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  company?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  package_id: string;
  booking_number: string;
  travel_date: string;
  return_date: string;
  number_of_travelers: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  package?: TravelPackage;
}
