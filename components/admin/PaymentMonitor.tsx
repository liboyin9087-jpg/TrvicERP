import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, DollarSign, Clock, CheckCircle, XCircle, RefreshCw,
  Download, Building2, Smartphone, TrendingUp, Search, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}

const MOCK_PAYMENTS: Payment[] = [
  { id: 'P001', orderId: 'ORD-2025-001', customerName: '王大明', amount: 91600, status: 'completed', method: 'credit_card', createdAt: '2025-01-08 10:30' },
  { id: 'P002', orderId: 'ORD-2025-002', customerName: '李小華', amount: 117800, status: 'completed', method: 'bank_transfer', createdAt: '2025-01-07 14:20' },
  { id: 'P003', orderId: 'ORD-2025-003', customerName: '張美玲', amount: 65600, status: 'pending', method: 'line_pay', createdAt: '2025-01-10 09:15' },
  { id: 'P004', orderId: 'ORD-2025-004', customerName: '陳志明', amount: 45800, status: 'processing', method: 'credit_card', createdAt: '2025-01-10 11:00' },
  { id: 'P005', orderId: 'ORD-2025-005', customerName: '林雅婷', amount: 38500, status: 'failed', method: 'credit_card', createdAt: '2025-01-09 16:45' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: '待付款', icon: Clock },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: '處理中', icon: RefreshCw },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '已完成', icon: CheckCircle },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: '失敗', icon: XCircle },
};

const METHOD_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  credit_card: { icon: CreditCard, label: '信用卡', color: 'text-slate-600' },
  bank_transfer: { icon: Building2, label: '銀行轉帳', color: 'text-blue-600' },
  line_pay: { icon: Smartphone, label: 'LINE Pay', color: 'text-green-600' },
};

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待付款' },
  { id: 'completed', label: '已完成' },
  { id: 'failed', label: '失敗' },
];

export default function PaymentMonitor() {
  const [payments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredPayments = payments
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.customerName.includes(search) || p.orderId.includes(search));

  const stats = {
    todayAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) * 0.3,
    pendingAmount: payments.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.amount, 0),
    monthAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalCount: payments.length,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Payments
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">收款管理</h2>
          <p className="text-slate-500 mt-1">即時監控所有付款狀態</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="trvic-btn trvic-btn-primary gap-2"
        >
          <Download className="w-4 h-4" />
          匯出報表
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="今日收款"
          value={`NT$ ${stats.todayAmount.toLocaleString()}`}
        />
        <StatCard
          icon={Clock}
          label="待收款"
          value={`NT$ ${stats.pendingAmount.toLocaleString()}`}
        />
        <StatCard
          icon={TrendingUp}
          label="本月收款"
          value={`NT$ ${stats.monthAmount.toLocaleString()}`}
        />
        <StatCard
          icon={CreditCard}
          label="交易筆數"
          value={stats.totalCount.toString()}
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋訂單編號或客戶名稱..."
            className="trvic-input w-full pl-12 pr-4"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
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
      <motion.div variants={itemVariants} className="trvic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">訂單編號</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">客戶</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">金額</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">付款方式</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">狀態</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment, index) => {
                const status = STATUS_CONFIG[payment.status];
                const method = METHOD_CONFIG[payment.method] || METHOD_CONFIG.credit_card;
                const StatusIcon = status.icon;
                const MethodIcon = method.icon;

                return (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {payment.orderId}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-600">
                            {payment.customerName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{payment.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-base font-bold text-slate-900">
                        NT$ {payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center', method.color)}>
                          <MethodIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-slate-600">{method.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                        status.bg, status.text
                      )}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
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
            <p className="text-slate-500">沒有符合條件的交易記錄</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorStyles = {
    emerald: 'bg-brand-600',
    amber: 'bg-brand-500',
    blue: 'bg-brand-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="trvic-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          color ? colorStyles[color] : 'bg-neutral-100'
        )}>
          <Icon className={cn('w-5 h-5', color ? 'text-white' : 'text-neutral-600')} />
        </div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-lg font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
