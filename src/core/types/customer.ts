/**
 * 客戶管理核心類型定義
 * Customer Management Core Types
 */

/**
 * 客戶類型
 */
export type CustomerType = 'individual' | 'corporate' | 'agent';

/**
 * 客戶等級
 */
export type CustomerTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'vip';

/**
 * 客戶狀態
 */
export type CustomerStatus = 'active' | 'inactive' | 'blocked';

/**
 * 客戶互動類型
 */
export type InteractionType = 'line' | 'call' | 'email' | 'counter' | 'whatsapp';

/**
 * 客戶互動情緒
 */
export type InteractionSentiment = 'positive' | 'neutral' | 'negative';

/**
 * 客戶互動記錄
 */
export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: InteractionType;
  content: string;
  agentId?: string;
  agentName: string;
  sentiment?: InteractionSentiment;
  createdAt: string;
}

/**
 * 客戶標籤
 */
export interface CustomerTag {
  id: string;
  name: string;
  color: string;
  category?: string;
}

/**
 * 聯絡人
 */
export interface Contact {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}

/**
 * 緊急聯絡人
 */
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

/**
 * 客戶
 */
export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  englishName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  tier: CustomerTier;
  status: CustomerStatus;
  tags: CustomerTag[];
  contacts?: Contact[];
  emergencyContact?: EmergencyContact;
  // 企業客戶欄位
  companyName?: string;
  taxId?: string;
  // 統計資訊
  totalSpend: number;
  orderCount: number;
  lastOrderDate?: string;
  // 偏好設定
  preferredLanguage?: string;
  preferredContact?: InteractionType;
  notes?: string;
  // 時間戳
  createdAt: string;
  updatedAt: string;
}

/**
 * 客戶資料 (CDP)
 */
export interface CustomerProfile extends Customer {
  interactions: CustomerInteraction[];
  visitedCountries?: string[];
  tripCount?: number;
  averageOrderValue?: number;
  lifetimeValue?: number;
}

/**
 * 建立客戶資料
 */
export interface CreateCustomerData {
  type: CustomerType;
  name: string;
  englishName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  tier?: CustomerTier;
  tags?: string[];
  contacts?: Omit<Contact, 'id'>[];
  companyName?: string;
  taxId?: string;
  preferredLanguage?: string;
  preferredContact?: InteractionType;
  notes?: string;
}

/**
 * 更新客戶資料
 */
export interface UpdateCustomerData {
  type?: CustomerType;
  name?: string;
  englishName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  tier?: CustomerTier;
  status?: CustomerStatus;
  tags?: string[];
  companyName?: string;
  taxId?: string;
  preferredLanguage?: string;
  preferredContact?: InteractionType;
  notes?: string;
}

/**
 * 客戶查詢條件
 */
export interface CustomerQuery {
  type?: CustomerType;
  tier?: CustomerTier | CustomerTier[];
  status?: CustomerStatus;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 客戶等級升級規則
 */
export const TIER_THRESHOLDS: Record<CustomerTier, number> = {
  standard: 0,
  silver: 50000,
  gold: 150000,
  platinum: 500000,
  vip: 1000000,
};

/**
 * 計算客戶等級
 */
export function calculateCustomerTier(totalSpend: number): CustomerTier {
  if (totalSpend >= TIER_THRESHOLDS.vip) return 'vip';
  if (totalSpend >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (totalSpend >= TIER_THRESHOLDS.gold) return 'gold';
  if (totalSpend >= TIER_THRESHOLDS.silver) return 'silver';
  return 'standard';
}
