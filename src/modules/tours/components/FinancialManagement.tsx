import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, FileText, Bell, RefreshCw, CreditCard, Building2,
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Send,
  Download, Filter, Search, ChevronDown, Plus, Eye, Edit, Trash2,
  ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Receipt, X,
  Mail, Phone, MessageSquare, Printer, Copy, ExternalLink
} from 'lucide-react';

// Types
interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  tourName: string;
  departureDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  payments: Payment[];
  notes: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'credit_card' | 'line_pay' | 'check';
  reference: string;
  paidAt: string;
  receivedBy: string;
  notes: string;
}

interface PaymentReminder {
  id: string;
  invoiceId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  remindersSent: number;
  lastReminderDate?: string;
  status: 'pending' | 'sent' | 'acknowledged';
}

interface RefundRequest {
  id: string;
  orderId: string;
  customerName: string;
  tourName: string;
  originalAmount: number;
  refundAmount: number;
  refundReason: string;
  refundType: 'full' | 'partial';
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  bankAccount?: string;
  notes: string;
}

// Mock Data
const mockInvoices: Invoice[] = [
  {
    id: 'INV001',
    invoiceNumber: 'INV-2024-0001',
    orderId: 'ORD001',
    customerName: '台積電福委會',
    customerEmail: 'welfare@tsmc.com',
    tourName: '日本東京五日遊',
    departureDate: '2024-04-15',
    items: [
      { id: 'i1', description: '團費 x 50人', quantity: 50, unitPrice: 32900, amount: 1645000 },
      { id: 'i2', description: '單人房差 x 5間', quantity: 5, unitPrice: 8000, amount: 40000 },
      { id: 'i3', description: '旅遊保險 x 50人', quantity: 50, unitPrice: 500, amount: 25000 },
    ],
    subtotal: 1710000,
    tax: 85500,
    discount: 100000,
    total: 1695500,
    paidAmount: 508650,
    balance: 1186850,
    status: 'partial',
    dueDate: '2024-03-15',
    createdAt: '2024-02-01',
    sentAt: '2024-02-02',
    payments: [
      { id: 'p1', invoiceId: 'INV001', amount: 508650, method: 'bank_transfer', reference: 'TRF-20240210', paidAt: '2024-02-10', receivedBy: '王會計', notes: '訂金30%' },
    ],
    notes: '大型企業團，分三期付款',
  },
  {
    id: 'INV002',
    invoiceNumber: 'INV-2024-0002',
    orderId: 'ORD002',
    customerName: '陳先生',
    customerEmail: 'chen@email.com',
    tourName: '韓國首爾四日遊',
    departureDate: '2024-03-22',
    items: [
      { id: 'i4', description: '團費 x 2人', quantity: 2, unitPrice: 18900, amount: 37800 },
    ],
    subtotal: 37800,
    tax: 1890,
    discount: 0,
    total: 39690,
    paidAmount: 39690,
    balance: 0,
    status: 'paid',
    dueDate: '2024-03-01',
    createdAt: '2024-02-15',
    sentAt: '2024-02-15',
    paidAt: '2024-02-20',
    payments: [
      { id: 'p2', invoiceId: 'INV002', amount: 39690, method: 'credit_card', reference: 'CC-20240220', paidAt: '2024-02-20', receivedBy: '李出納', notes: '' },
    ],
    notes: '',
  },
  {
    id: 'INV003',
    invoiceNumber: 'INV-2024-0003',
    orderId: 'ORD003',
    customerName: '林小姐',
    customerEmail: 'lin@email.com',
    tourName: '泰國曼谷五日遊',
    departureDate: '2024-04-01',
    items: [
      { id: 'i5', description: '團費 x 4人', quantity: 4, unitPrice: 22900, amount: 91600 },
    ],
    subtotal: 91600,
    tax: 4580,
    discount: 2000,
    total: 94180,
    paidAmount: 0,
    balance: 94180,
    status: 'overdue',
    dueDate: '2024-02-25',
    createdAt: '2024-02-10',
    sentAt: '2024-02-10',
    payments: [],
    notes: '已催款兩次',
  },
];

const mockReminders: PaymentReminder[] = [
  { id: 'R001', invoiceId: 'INV001', customerName: '台積電福委會', amount: 1186850, dueDate: '2024-03-15', daysOverdue: 0, remindersSent: 1, lastReminderDate: '2024-03-01', status: 'sent' },
  { id: 'R002', invoiceId: 'INV003', customerName: '林小姐', amount: 94180, dueDate: '2024-02-25', daysOverdue: 5, remindersSent: 2, lastReminderDate: '2024-02-28', status: 'pending' },
];

const mockRefunds: RefundRequest[] = [
  {
    id: 'REF001',
    orderId: 'ORD004',
    customerName: '張先生',
    tourName: '日本大阪五日遊',
    originalAmount: 65800,
    refundAmount: 45060,
    refundReason: '因故取消，扣除30%手續費',
    refundType: 'partial',
    status: 'processing',
    requestedAt: '2024-02-20',
    bankAccount: '012-xxx-xxx-xxx',
    notes: '客戶要求退款至指定帳戶',
  },
  {
    id: 'REF002',
    orderId: 'ORD005',
    customerName: '黃小姐',
    tourName: '韓國首爾四日遊',
    originalAmount: 37800,
    refundAmount: 37800,
    refundReason: '行程取消（成團人數不足）',
    refundType: 'full',
    status: 'completed',
    requestedAt: '2024-02-15',
    processedAt: '2024-02-18',
    processedBy: '王會計',
    notes: '',
  },
];

// Components
const StatusBadge = ({ status, type = 'invoice' }: { status: string; type?: 'invoice' | 'refund' | 'reminder' }) => {
  const invoiceStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    partial: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  const refundStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    draft: '草稿',
    sent: '已發送',
    viewed: '已讀取',
    partial: '部分付款',
    paid: '已付清',
    overdue: '已逾期',
    cancelled: '已取消',
    pending: '待處理',
    approved: '已核准',
    processing: '處理中',
    completed: '已完成',
    rejected: '已拒絕',
    acknowledged: '已確認',
  };

  const styles = type === 'refund' ? refundStyles : invoiceStyles;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
};

const PaymentMethodBadge = ({ method }: { method: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    cash: { label: '現金', color: 'bg-green-100 text-green-700' },
    bank_transfer: { label: '匯款', color: 'bg-blue-100 text-blue-700' },
    credit_card: { label: '信用卡', color: 'bg-purple-100 text-purple-700' },
    line_pay: { label: 'LINE Pay', color: 'bg-emerald-100 text-emerald-700' },
    check: { label: '支票', color: 'bg-amber-100 text-amber-700' },
  };

  const { label, color } = config[method] || { label: method, color: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

// Invoice Detail Modal
const InvoiceDetailModal = ({
  invoice,
  onClose,
  onSendReminder,
  onRecordPayment
}: {
  invoice: Invoice;
  onClose: () => void;
  onSendReminder: () => void;
  onRecordPayment: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">{invoice.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <Printer className="w-5 h-5 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <Download className="w-5 h-5 text-slate-500" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Invoice Info */}
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase mb-1">客戶</div>
                <div className="font-medium text-slate-900">{invoice.customerName}</div>
                <div className="text-sm text-slate-600">{invoice.customerEmail}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase mb-1">行程</div>
                <div className="font-medium text-slate-900">{invoice.tourName}</div>
                <div className="text-sm text-slate-600">出發日期: {invoice.departureDate}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">開立日期</div>
                  <div className="font-medium text-slate-900">{invoice.createdAt}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">到期日</div>
                  <div className={`font-medium ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-900'}`}>
                    {invoice.dueDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">項目</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">數量</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">單價</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">金額</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-900">{item.description}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600">NT$ {item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">NT$ {item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-4 py-2 text-right text-sm text-slate-600">小計</td>
                  <td className="px-4 py-2 text-right font-medium">NT$ {invoice.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-sm text-slate-600">稅金 (5%)</td>
                  <td className="px-4 py-2 text-right font-medium">NT$ {invoice.tax.toLocaleString()}</td>
                </tr>
                {invoice.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-green-600">折扣</td>
                    <td className="px-4 py-2 text-right font-medium text-green-600">-NT$ {invoice.discount.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-900">總計</td>
                  <td className="px-4 py-3 text-right text-xl font-bold text-indigo-600">NT$ {invoice.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600 mb-1">已收款</div>
              <div className="text-xl font-bold text-green-700">NT$ {invoice.paidAmount.toLocaleString()}</div>
            </div>
            <div className={`rounded-xl p-4 ${invoice.balance > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <div className={`text-sm mb-1 ${invoice.balance > 0 ? 'text-amber-600' : 'text-slate-600'}`}>未收餘額</div>
              <div className={`text-xl font-bold ${invoice.balance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                NT$ {invoice.balance.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-sm text-slate-600 mb-1">付款進度</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(invoice.paidAmount / invoice.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round((invoice.paidAmount / invoice.total) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">付款記錄</h3>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">NT$ {payment.amount.toLocaleString()}</div>
                        <div className="text-sm text-slate-500">{payment.paidAt} · {payment.receivedBy}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentMethodBadge method={payment.method} />
                      <span className="text-sm text-slate-500">{payment.reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">備註</h4>
                  <p className="text-sm text-amber-700 mt-1">{invoice.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <div className="flex gap-2">
            {invoice.status !== 'paid' && (
              <button
                onClick={onSendReminder}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
              >
                <Bell className="w-4 h-4" />
                發送催款通知
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {invoice.balance > 0 && (
              <button
                onClick={onRecordPayment}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <CreditCard className="w-4 h-4" />
                記錄收款
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Record Payment Modal
const RecordPaymentModal = ({
  invoice,
  onClose,
  onSubmit
}: {
  invoice: Invoice;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [amount, setAmount] = useState(invoice.balance);
  const [method, setMethod] = useState<Payment['method']>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">記錄收款</h2>
          <p className="text-sm text-slate-500 mt-1">{invoice.invoiceNumber} - {invoice.customerName}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">收款金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">NT$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={invoice.balance}
                className="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">未收餘額: NT$ {invoice.balance.toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">付款方式</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bank_transfer', label: '銀行匯款' },
                { id: 'credit_card', label: '信用卡' },
                { id: 'cash', label: '現金' },
                { id: 'line_pay', label: 'LINE Pay' },
                { id: 'check', label: '支票' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    method === m.id
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">交易參考編號</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="例: TRF-20240301"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">備註</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit({ amount, method, reference, notes })}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            確認收款
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Component
export default function FinancialManagement() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [reminders] = useState<PaymentReminder[]>(mockReminders);
  const [refunds] = useState<RefundRequest[]>(mockRefunds);
  const [activeTab, setActiveTab] = useState<'invoices' | 'reminders' | 'refunds'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalReceivable = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.balance, 0);
  const paidThisMonth = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">財務管理</h1>
          <p className="text-slate-500">發票、收款與退款管理</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          新增發票
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Wallet className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">應收帳款</div>
              <div className="text-xl font-bold text-slate-900">NT$ {(totalReceivable / 10000).toFixed(0)}萬</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">逾期金額</div>
              <div className="text-xl font-bold text-red-600">NT$ {(overdueAmount / 10000).toFixed(0)}萬</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">本月已收</div>
              <div className="text-xl font-bold text-green-600">NT$ {(paidThisMonth / 10000).toFixed(0)}萬</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">待催款</div>
              <div className="text-xl font-bold text-amber-600">{reminders.length} 筆</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        {[
          { id: 'invoices', label: '發票管理', icon: FileText },
          { id: 'reminders', label: '催款通知', icon: Bell },
          { id: 'refunds', label: '退款處理', icon: RefreshCw },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋發票編號或客戶..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Filter className="w-4 h-4" />
                篩選
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">發票編號</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">客戶</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">行程</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">總金額</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">已付</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">餘額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">狀態</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">到期日</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-indigo-600">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{invoice.customerName}</div>
                    <div className="text-xs text-slate-500">{invoice.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{invoice.tourName}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    NT$ {invoice.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    NT$ {invoice.paidAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600">
                    NT$ {invoice.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className={`px-4 py-3 text-sm ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-600'}`}>
                    {invoice.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">待催款清單</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              <Send className="w-4 h-4" />
              批次發送催款
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    reminder.daysOverdue > 0 ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {reminder.daysOverdue > 0 ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{reminder.customerName}</div>
                    <div className="text-sm text-slate-500">
                      未付金額: NT$ {reminder.amount.toLocaleString()} · 到期日: {reminder.dueDate}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      已發送 {reminder.remindersSent} 次催款
                      {reminder.lastReminderDate && ` · 最後催款: ${reminder.lastReminderDate}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {reminder.daysOverdue > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      逾期 {reminder.daysOverdue} 天
                    </span>
                  )}
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white">
                    <Phone className="w-4 h-4" />
                    電話
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-white">
                    <Mail className="w-4 h-4" />
                    郵件
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                    <MessageSquare className="w-4 h-4" />
                    LINE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">退款申請</h3>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <Plus className="w-4 h-4" />
              新增退款
            </button>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">申請編號</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">客戶</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">行程</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">原始金額</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">退款金額</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">退款原因</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">狀態</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{refund.id}</td>
                  <td className="px-4 py-3 text-slate-900">{refund.customerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{refund.tourName}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    NT$ {refund.originalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    NT$ {refund.refundAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                    {refund.refundReason}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={refund.status} type="refund" />
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && !showPaymentModal && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onSendReminder={() => console.log('Send reminder')}
            onRecordPayment={() => setShowPaymentModal(true)}
          />
        )}
        {selectedInvoice && showPaymentModal && (
          <RecordPaymentModal
            invoice={selectedInvoice}
            onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null); }}
            onSubmit={(data) => {
              console.log('Payment recorded:', data);
              setShowPaymentModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
