import { CustomerId } from './customer';
import { QuotationId, SessionId, OrderId, UserId, NTAmount, Percentage } from './branded';
import type { ApiError as ApiErrorType } from './api';
export type { ApiResponse } from './api';
export type { ApiError } from './api';
export type { NTAmount, Percentage } from './branded';

export interface QuotationServiceResult<T = unknown> {
  data: T | null;
  error: ApiErrorType | null;
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
  unitCost: NTAmount;
  quantity: number;
  currency: Currency;
  description: string;
}

export interface CostBreakdown {
  fixed: NTAmount;
  variable: NTAmount;
  total: NTAmount;
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
  sellingPrice: NTAmount;
  paxCount: number;
  totalNTAmount: NTAmount;
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
  sellingPrice: NTAmount;
  totalNTAmount: NTAmount;
}

export interface ConvertQuotationToOrderData {
  orderNumber: string;
  notes?: string;
}

export interface QuotationPreviewResult {
  costBreakdown: CostBreakdown;
  sellingPrice: NTAmount;
  totalNTAmount: NTAmount;
}

export function calculateQuotationCost(
  items: QuotationItem[],
  paxCount: number
): CostBreakdown {
  let fixed = 0 as NTAmount;
  let variable = 0 as NTAmount;

  items.forEach(item => {
    if (item.costType === CostType.FIXED) {
      fixed = (fixed + (item.unitCost * item.quantity)) as NTAmount;
    } else {
      variable = (variable + item.unitCost) as NTAmount;
    }
  });

  const total = (fixed + (variable * paxCount)) as NTAmount;

  return {
    fixed,
    variable,
    total,
    currency: items[0]?.currency || Currency.TWD,
  };
}

export function calculateSellingPrice(
  totalCost: NTAmount,
  profitMargin: Percentage
): NTAmount {
  return Math.round(totalCost * (1 + profitMargin / 100)) as NTAmount;
}

export function isQuotationExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}