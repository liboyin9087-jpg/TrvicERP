/**
 * Financial Management Module Types
 * Core types for accounts receivable, payable, invoicing, and multi-currency support
 */

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: Currency;
  exchangeRate?: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type InvoiceStatus = 
  | 'draft'
  | 'pending'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'void';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
  category?: string;
}

export interface AccountsReceivable {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: Currency;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  payments: Payment[];
}

export interface AccountsPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currency: Currency;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  description: string;
  category: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: Currency;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  processedBy: string;
}

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'paypal'
  | 'other';

export type Currency = 'TWD' | 'USD' | 'EUR' | 'JPY' | 'CNY' | 'HKD' | 'SGD';

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  date: Date;
  source: string;
}

export interface FinancialReport {
  id: string;
  type: FinancialReportType;
  period: {
    startDate: Date;
    endDate: Date;
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

export type FinancialReportType =
  | 'income_statement'
  | 'balance_sheet'
  | 'cash_flow'
  | 'accounts_aging'
  | 'tax_report';

export interface ChartOfAccounts {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  balance: number;
  currency: Currency;
  isActive: boolean;
}

export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';
