type QuotationId = string & { readonly __brand: 'QuotationId' };
type CustomerId = string & { readonly __brand: 'CustomerId' };
type SessionId = string & { readonly __brand: 'SessionId' };
type OrderId = string & { readonly __brand: 'OrderId' };
type UserId = string & { readonly __brand: 'UserId' };
type Amount = number & { readonly __brand: 'Amount' };
type Percentage = number & { readonly __brand: 'Percentage' };

enum QuotationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

enum CostType {
  FIXED = 'fixed',
  PER_PAX = 'per_pax'
}

enum ItemCategory {
  FLIGHT = 'flight',
  HOTEL = 'hotel',
  TRANSPORT = 'transport',
  MEAL = 'meal',
  TICKET = 'ticket',
  OTHER = 'other'
}

enum Currency {
  TWD = 'TWD',
  USD = 'USD',
  JPY = 'JPY',
  CNY = 'CNY',
  EUR = 'EUR'
}

interface QuotationItem {
  id: string;
  category: ItemCategory;
  name: string;
  costType: CostType;
  unitCost: Amount;
  quantity: number;
  currency: Currency;
  description: string;
}

interface CostBreakdown {
  fixed: Amount;
  variable: Amount;
  total: Amount;
  currency: Currency;
}

interface Quotation {
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

interface CreateQuotationData {
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

interface UpdateQuotationData {
  items: QuotationItem[];
  profitMargin: Percentage;
  paxCount: number;
  validUntil: string;
  notes: string;
  costBreakdown: CostBreakdown;
  sellingPrice: Amount;
  totalAmount: Amount;
}

interface ConvertQuotationToOrderData {
  orderNumber: string;
  notes: string;
}

function calculateQuotationCost(
  items: QuotationItem[],
  paxCount: number
): CostBreakdown {
  let fixed = 0 as Amount;
  let variable = 0 as Amount;

  items.forEach(item => {
    if (item.costType === CostType.FIXED) {
      fixed += item.unitCost * item.quantity as Amount;
    } else {
      variable += item.unitCost as Amount;
    }
  });

  const total = fixed + variable * paxCount as Amount;

  return {
    fixed,
    variable,
    total,
    currency: items[0]?.currency || Currency.TWD,
  };
}

function calculateSellingPrice(
  totalCost: Amount,
  profitMargin: Percentage
): Amount {
  return Math.round(totalCost * (1 + profitMargin / 100)) as Amount;
}

function isQuotationExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}