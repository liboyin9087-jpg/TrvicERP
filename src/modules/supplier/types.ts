/**
 * Supplier Management System Types
 * Core types for supplier database, contracts, ratings, and procurement
 */

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  type: SupplierType;
  category: SupplierCategory[];
  status: SupplierStatus;
  
  // Contact Information
  contactPerson: string;
  email: string;
  phone: string;
  mobile?: string;
  fax?: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  
  // Business Information
  taxId?: string;
  businessLicense?: string;
  paymentTerms: string;
  currency: string;
  
  // Ratings & Performance
  rating: number; // 1-5 stars
  totalOrders: number;
  totalSpent: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  
  // Relationships
  accountManagerId?: string;
  contracts: SupplierContract[];
  
  // Metadata
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type SupplierType = 
  | 'hotel'
  | 'airline'
  | 'restaurant'
  | 'transportation'
  | 'attraction'
  | 'insurance'
  | 'visa_service'
  | 'other';

export type SupplierCategory = 
  | 'accommodation'
  | 'transportation'
  | 'food_beverage'
  | 'activities'
  | 'services'
  | 'equipment';

export type SupplierStatus = 
  | 'active'
  | 'inactive'
  | 'pending_approval'
  | 'suspended'
  | 'blacklisted';

export interface SupplierContract {
  id: string;
  supplierId: string;
  contractNumber: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  
  // Terms
  startDate: Date;
  endDate: Date;
  autoRenewal: boolean;
  renewalTerms?: string;
  
  // Financial
  paymentTerms: string;
  currency: string;
  totalValue?: number;
  
  // Documents
  documentUrl?: string;
  signedBy: string[];
  signedDate?: Date;
  
  // Negotiation
  negotiationHistory: NegotiationRecord[];
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContractType = 
  | 'annual'
  | 'seasonal'
  | 'project_based'
  | 'framework'
  | 'one_time';

export type ContractStatus = 
  | 'draft'
  | 'under_negotiation'
  | 'pending_signature'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'renewed';

export interface NegotiationRecord {
  id: string;
  date: Date;
  negotiator: string;
  terms: string;
  offerPrice?: number;
  counterOfferPrice?: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
}

export interface SupplierRating {
  id: string;
  supplierId: string;
  orderId?: string;
  ratedBy: string;
  ratingDate: Date;
  
  // Criteria (1-5)
  qualityScore: number;
  timelinessScore: number;
  communicationScore: number;
  valueForMoneyScore: number;
  overallRating: number;
  
  // Feedback
  comments?: string;
  wouldRecommend: boolean;
  
  // Issues
  issues?: string[];
  resolved: boolean;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  
  // Items
  items: POItem[];
  
  // Financial
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  currency: string;
  
  // Dates
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  
  // Delivery
  deliveryAddress: string;
  shippingMethod?: string;
  trackingNumber?: string;
  
  // Approvals
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type POStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'acknowledged'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  expectedDate?: Date;
  receivedQuantity?: number;
  receivedDate?: Date;
}

export interface SupplierSettlement {
  id: string;
  supplierId: string;
  settlementNumber: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Financial Summary
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  
  // Payment
  paymentDueDate: Date;
  paymentDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  
  // Orders included
  orderIds: string[];
  
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
