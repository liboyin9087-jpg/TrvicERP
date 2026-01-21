import type { CustomerId } from './customer';
export { ApiError } from './api';
export type { ApiResponse } from './api';

export type QuotationId = string & { readonly __brand: 'QuotationId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type OrderId = string & { readonly __brand: 'OrderId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type Amount = number & { readonly __brand: 'Amount' };
export type Percentage = number & { readonly __brand: 'Percentage' };

export interface QuotationServiceResult<T = unknown> {
  data: T | null;
  error: import('./api').ApiError | null;
}

export enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum CostType {
  FIXED = 'fixed',
  PER_PAX = 'per_pax'
}

export enum ItemCategory {
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  TRANSPORT = 'transport',
  MEAL = 'meal',
  TICKET = 'ticket',
  OTHER = 'other'
}

export enum Currency {
  TWD = 'TWD',
  USD = 'USD',
  JPY = 'JPY',
  CNY = 'CNY',
  EUR = 'EUR'
}

export interface QuotationItem {
  id: string;
  category: ItemCategory;
  name: string;
  costType: CostType;
  unitCost: Amount;
  quantity: number;
  currency: Currency;
  description: string;
}

export interface CostBreakdown {
  fixed: Amount;
  variable: Amount;
  total: Amount;
  currency: Currency;
}

export interface Quotation {
  id: QuotationId;
  quotationNumber: string;
  version: number;
  customerId: CustomerId;
  customerName: string;
  sessionId: SessionId | null;
  items: QuotationItem[];
  costBreakdown: CostBreakdown;
  profitMargin: Percentage;
  sellingPrice: Amount;
  paxCount: number;
  totalAmount: Amount;
  currency: Currency;
  validUntil: string;
  status: QuotationStatus;
  convertedToOrderId: OrderId | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserId;
}

export interface CreateQuotationData {
  customerId: CustomerId;
  customerName: string;
  sessionId: SessionId | null;
  items: QuotationItem[];
  profitMargin: Percentage;
  paxCount: number;
  validDays: number;
  currency: Currency;
  notes: string;
}

export interface UpdateQuotationData {
  items: QuotationItem[];
  profitMargin: Percentage;
  paxCount: number;
  validUntil: string;
  notes: string;
  costBreakdown: CostBreakdown;
  sellingPrice: Amount;
  totalAmount: Amount;
}

export interface ConvertQuotationToOrderData {
  orderNumber: string;
  notes?: string;
}

export interface QuotationPreviewResult {
  costBreakdown: CostBreakdown;
  sellingPrice: Amount;
  totalAmount: Amount;
}

export function calculateQuotationCost(
  items: QuotationItem[],
  paxCount: number
): CostBreakdown {
  let fixed = 0 as Amount;
  let variable = 0 as Amount;

  items.forEach(item => {
    if (item.costType === CostType.FIXED) {
      fixed = (fixed + (item.unitCost * item.quantity)) as Amount;
    } else {
      variable = (variable + item.unitCost) as Amount;
    }
  });

  const total = (fixed + (variable * paxCount)) as Amount;

  return {
    fixed,
    variable,
    total,
    currency: items[0]?.currency || Currency.TWD,
  };
}

export function calculateSellingPrice(
  totalCost: Amount,
  profitMargin: Percentage
): Amount {
  return Math.round(totalCost * (1 + profitMargin / 100)) as Amount;
}

export function isQuotationExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}