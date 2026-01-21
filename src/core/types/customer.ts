import type { CustomerId, AgentId, ContactId, TagId, NTAmount } from './branded';

export type { CustomerId, AgentId, ContactId, TagId, NTAmount };
export { ApiError } from './api';
export type { ApiResponse } from './api';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  AGENT = 'agent'
}

export enum CustomerTier {
  STANDARD = 'standard',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  VIP = 'vip'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum InteractionType {
  LINE = 'line',
  CALL = 'call',
  EMAIL = 'email',
  COUNTER = 'counter',
  WHATSAPP = 'whatsapp'
}

export enum InteractionSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export interface CustomerInteraction {
  id: string;
  customerId: CustomerId;
  type: InteractionType;
  content: string;
  agentId: AgentId | null;
  agentName: string;
  sentiment: InteractionSentiment | null;
  createdAt: string;
}

export interface CustomerTag {
  id: TagId;
  name: string;
  color: string;
  category: string | null;
}

export interface Contact {
  id: ContactId;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

export interface Customer {
  id: CustomerId;
  type: CustomerType;
  name: string;
  englishName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  tier: CustomerTier;
  status: CustomerStatus;
  tags: CustomerTag[];
  contacts: Contact[];
  companyName: string | null;
  taxId: string | null;
  totalSpend: NTAmount;
  orderCount: number;
  lastOrderDate: string | null;
  preferredLanguage: string | null;
  preferredContact: InteractionType | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile extends Customer {
  interactions: CustomerInteraction[];
  visitedCountries: string[];
  tripCount: number;
  averageOrderValue: NTAmount;
  lifetimeValue: NTAmount;
}

export interface CreateCustomerData {
  type: CustomerType;
  name: string;
  englishName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  tier: CustomerTier;
  tags: string[];
  contacts: Array<Omit<Contact, 'id'>>;
  companyName: string | null;
  taxId: string | null;
  preferredLanguage: string | null;
  preferredContact: InteractionType | null;
  notes: string | null;
}

export interface UpdateCustomerData {
  type: CustomerType | null;
  name: string | null;
  englishName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  tier: CustomerTier | null;
  status: CustomerStatus | null;
  tags: string[] | null;
  companyName: string | null;
  taxId: string | null;
  preferredLanguage: string | null;
  preferredContact: InteractionType | null;
  notes: string | null;
}

export interface CustomerQuery {
  type?: CustomerType | null;
  tier?: CustomerTier | CustomerTier[] | null;
  status?: CustomerStatus | null;
  tags?: string[] | null;
  search?: string | null;
  page?: number;
  limit?: number;
}

const TIER_THRESHOLDS: Record<CustomerTier, NTAmount> = {
  [CustomerTier.STANDARD]: 0 as NTAmount,
  [CustomerTier.SILVER]: 50000 as NTAmount,
  [CustomerTier.GOLD]: 150000 as NTAmount,
  [CustomerTier.PLATINUM]: 500000 as NTAmount,
  [CustomerTier.VIP]: 1000000 as NTAmount
};

export function calculateCustomerTier(totalSpend: NTAmount): CustomerTier {
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.VIP]) return CustomerTier.VIP;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.PLATINUM]) return CustomerTier.PLATINUM;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.GOLD]) return CustomerTier.GOLD;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.SILVER]) return CustomerTier.SILVER;
  return CustomerTier.STANDARD;
}