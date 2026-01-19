type CustomerId = string & { readonly __brand: 'CustomerId' };
type AgentId = string & { readonly __brand: 'AgentId' };
type ContactId = string & { readonly __brand: 'ContactId' };
type TagId = string & { readonly __brand: 'TagId' };
type NTAmount = number & { readonly __brand: 'NTAmount' };

enum CustomerType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  AGENT = 'agent'
}

enum CustomerTier {
  STANDARD = 'standard',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  VIP = 'vip'
}

enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

enum InteractionType {
  LINE = 'line',
  CALL = 'call',
  EMAIL = 'email',
  COUNTER = 'counter',
  WHATSAPP = 'whatsapp'
}

enum InteractionSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

interface CustomerInteraction {
  id: string;
  customerId: CustomerId;
  type: InteractionType;
  content: string;
  agentId: AgentId | null;
  agentName: string;
  sentiment: InteractionSentiment | null;
  createdAt: string;
}

interface CustomerTag {
  id: TagId;
  name: string;
  color: string;
  category: string | null;
}

interface Contact {
  id: ContactId;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

interface Customer {
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

interface CustomerProfile extends Customer {
  interactions: CustomerInteraction[];
  visitedCountries: string[];
  tripCount: number;
  averageOrderValue: NTAmount;
  lifetimeValue: NTAmount;
}

interface CreateCustomerData {
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

interface UpdateCustomerData {
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

interface CustomerQuery {
  type: CustomerType | null;
  tier: CustomerTier | CustomerTier[] | null;
  status: CustomerStatus | null;
  tags: string[] | null;
  search: string | null;
  page: number;
  limit: number;
}

const TIER_THRESHOLDS: Record<CustomerTier, NTAmount> = {
  [CustomerTier.STANDARD]: 0 as NTAmount,
  [CustomerTier.SILVER]: 50000 as NTAmount,
  [CustomerTier.GOLD]: 150000 as NTAmount,
  [CustomerTier.PLATINUM]: 500000 as NTAmount,
  [CustomerTier.VIP]: 1000000 as NTAmount
};

function calculateCustomerTier(totalSpend: NTAmount): CustomerTier {
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.VIP]) return CustomerTier.VIP;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.PLATINUM]) return CustomerTier.PLATINUM;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.GOLD]) return CustomerTier.GOLD;
  if (totalSpend >= TIER_THRESHOLDS[CustomerTier.SILVER]) return CustomerTier.SILVER;
  return CustomerTier.STANDARD;
}