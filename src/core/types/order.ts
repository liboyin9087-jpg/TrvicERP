import { Branded } from './branded';

type OrderId = string & Branded<'OrderId'>;
type SessionId = string & Branded<'SessionId'>;
type QuotationId = string & Branded<'QuotationId'>;
type CustomerId = string & Branded<'CustomerId'>;
type NTAmount = number & Branded<'NTAmount'>;
type DateTimeString = string & Branded<'DateTimeString'>;

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderCurrency {
  TWD = 'TWD',
  USD = 'USD',
  JPY = 'JPY',
  CNY = 'CNY'
}

export interface OrderStateTransition {
  from: OrderStatus;
  to: OrderStatus;
  condition: () => boolean;
  action: () => void | Promise<void>;
}

export const ORDER_STATE_MACHINE: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.IN_PROGRESS, OrderStatus.REFUNDED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: []
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowedTransitions = ORDER_STATE_MACHINE[from];
  return allowedTransitions.includes(to);
}

export interface Order {
  id: OrderId;
  orderNumber: string;
  sessionId: SessionId;
  quotationId: QuotationId | null;
  customerId: CustomerId;
  customerName: string;
  status: OrderStatus;
  totalAmount: NTAmount;
  paidAmount: NTAmount;
  currency: OrderCurrency;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  cancelledAt: DateTimeString | null;
  cancelledReason: string | null;
  notes: string | null;
}

export interface CreateOrderData {
  sessionId: SessionId;
  quotationId: QuotationId | null;
  customerId: CustomerId;
  customerName: string;
  totalAmount: NTAmount;
  currency: OrderCurrency;
  notes: string | null;
}

export interface UpdateOrderData {
  status: OrderStatus;
  totalAmount: NTAmount;
  paidAmount: NTAmount;
  notes: string | null;
}

export interface CancelOrderData {
  reason: string;
  refundAmount: NTAmount | null;
}

export interface OrderQuery {
  status: OrderStatus | OrderStatus[];
  customerId: CustomerId | null;
  sessionId: SessionId | null;
  dateFrom: DateTimeString | null;
  dateTo: DateTimeString | null;
  minAmount: NTAmount | null;
  maxAmount: NTAmount | null;
  page: number;
  limit: number;
}