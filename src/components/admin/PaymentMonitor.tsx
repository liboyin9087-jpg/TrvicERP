import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, DollarSign, Clock, CheckCircle, XCircle, RefreshCw,
  Download, Building2, Smartphone, TrendingUp, Search, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility is available and functions correctly

// --- Types ---
export interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}

// --- Configuration & Constants (Moved out of component) ---
export const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: '待付款', icon: Clock },
  processing: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500', label: '處理中', icon: RefreshCw }, // Changed to primary
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '已完成', icon: CheckCircle },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: '失敗', icon: XCircle },
};

export const METHOD_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  credit_card: { icon: CreditCard, label: '信用卡', color: 'text-slate-600' },
  bank_transfer: { icon: Building2, label: '銀行轉帳', color: 'text-primary-600' }, // Changed to primary
  line_pay: { icon: Smartphone, label: 'LINE Pay', color: 'text-green-600' },
};

export const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待付款' },
  { id: 'completed', label: '已完成' },
  { id: 'failed', label: '失敗' },
];

// --- Animation Variants (Moved out of component) ---
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- Sub-component: StatCard ---
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: 'emerald' | 'amber' | 'primary'; // Changed 'blue' to 'primary' for consistency with Dashtail
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorStyles = {
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    primary: 'from-primary-500 to-primary-700', // Changed 'blue' to 'primary'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4 flex items-center gap-3" // Added flex for better layout on smaller cards
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', // flex-shrink-0 to prevent icon shrinking
        color ? `bg-gradient-to-br ${colorStyles[color]}` : 'bg-slate-100'
      )}>
        <Icon className={cn('w-5 h-5', color ? 'text-white' : 'text-slate-600')} />
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-0.5">{label}</p> {/* Added mb-0.5 for consistent spacing */}
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </motion.div>
  );
}

// --- Main Component Props Interface ---
// Adhering to Kintone independence: component receives data via props.
export interface PaymentMonitorConfig {
  payments: Payment[]; // The actual payment data
  // Potentially add other configuration options here if needed,
  // e.g., defaultFilter, enableExport, etc.
}

// --- Main Component: PaymentMonitor ---
export default function PaymentMonitor({ payments: initialPayments = [] }: Partial<PaymentMonitorConfig>) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Memoize filtered payments to avoid re-calculation on every render
  const filteredPayments = useMemo(() => {
    return initialPayments
      .filter(p => filter === 'all' || p.status === filter)
      .filter(p => p.customerName.includes(search) || p.orderId.includes(search));
  }, [initialPayments, filter, search]);

  // Memoize statistics
  const stats = useMemo(() => {
    const completedPayments = initialPayments.filter(p => p.status === 'completed');
    const pendingProcessingPayments = initialPayments.filter(p => p.status === 'pending' || p.status === 'processing');

    return {
      todayAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0) * 0.3, // Example calculation
      pendingAmount: pendingProcessingPayments.reduce((sum, p) => sum + p.amount, 0),
      monthAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0),
      totalCount: initialPayments.length,
    };
  }, [initialPayments]);

  return (
    // Dashtail UI: Standard Card Structure with drag-handle
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8" // Adjusted padding and spacing
    >
      {/* Header with drag-handle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 mb-4 md:mb-6">
        <motion.div variants={itemVariants} className="flex-grow">
          <div className="flex items-center gap-3 mb-2 drag-handle"> {/* drag-handle added here */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Payments
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">收款管理</h2> {/* leading-tight for better typography */}
          <p className="text-slate-500 mt-1 text-base">即時監控所有付款狀態</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-pill btn-pill-primary gap-2 flex-shrink-0" // flex-shrink-0 to prevent button from shrinking
        >
          <Download className="w-4 h-4" />
          匯出報表
        </motion.button>
      </div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"> {/* Responsive grid */}
        <StatCard
          icon={DollarSign}
          label="今日收款"
          value={`NT$ ${stats.todayAmount.toLocaleString()}`}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="待收款"
          value={`NT$ ${stats.pendingAmount.toLocaleString()}`}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="本月收款"
          value={`NT$ ${stats.monthAmount.toLocaleString()}`}
          color="primary" // Changed to primary
        />
        <StatCard
          icon={CreditCard}
          label="交易筆數"
          value={stats.totalCount.toLocaleString()} // Ensure value is a string
        />
      </motion.div>

      {/* Filters and Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 md:gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋訂單編號或客戶名稱..."
            className="input-modern w-full pl-12 pr-4 text-base py-2.5" // Adjusted padding for better typography
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg flex-shrink-0 overflow-x-auto"> {/* flex-shrink-0 and overflow for responsiveness */}
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap', // rounded-md for consistency, whitespace-nowrap for filter labels
                filter === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden p-0"> {/* Remove default padding, table handles it */}
        <div className="overflow-x-auto min-w-full"> {/* min-w-full for table scrolling on small screens */}
          <table className="w-full text-left table-auto"> {/* table-auto for better column sizing */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">訂單編號</th> {/* min-width for columns */}
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[150px]">客戶</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[100px]">金額</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">付款方式</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[100px]">狀態</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 uppercase tracking-wider min-w-[150px]">時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment, index) => {
                const status = STATUS_CONFIG[payment.status];
                const method = METHOD_CONFIG[payment.method] || METHOD_CONFIG.credit_card; // Fallback to credit_card
                const StatusIcon = status.icon;
                const MethodIcon = method.icon;

                return (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50 transition-colors" // Removed focus/active styles for row for cleaner interaction
                  >
                    <td className="px-6 py-4 text-sm"> {/* py-4 for more compact rows */}
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {payment.orderId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"> {/* Rounded-full for avatar */}
                          <span className="text-sm font-bold text-slate-600">
                            {payment.customerName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{payment.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-bold text-slate-900">
                        NT$ {payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0', method.color)}>
                          <MethodIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-slate-600">{method.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', // text-xs for smaller badge
                        status.bg, status.text
                      )}>
                        <StatusIcon className="w-3 h-3" /> {/* Smaller icon */}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{payment.createdAt}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-base">沒有符合條件的交易記錄</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}