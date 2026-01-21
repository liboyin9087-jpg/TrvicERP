import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, DollarSign, Clock, CheckCircle, XCircle, RefreshCw,
  Download, Building2, Smartphone, TrendingUp, Search, Filter, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrders } from '@/modules/orders/hooks/useOrders';
import type { Order, OrderStatus } from '@/core/types/order';
import { OrderStatus as CoreOrderStatus } from '@/core/types/order';
import { Loading } from '@/components/shared/Loading';
import { formatCurrency } from '@/lib/utils/formatting';

interface Payment {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}

/**
 * Convert Order to Payment display format
 * 將 Order 類型轉換為 Payment 顯示格式
 */
function convertOrderToPayment(order: Order): Payment {
  // Map order status to payment status
  const statusMap: Record<OrderStatus, 'pending' | 'processing' | 'completed' | 'failed'> = {
    [CoreOrderStatus.DRAFT]: 'pending',
    [CoreOrderStatus.PENDING]: 'pending',
    [CoreOrderStatus.CONFIRMED]: 'processing',
    [CoreOrderStatus.PAID]: 'completed',
    [CoreOrderStatus.IN_PROGRESS]: 'processing',
    [CoreOrderStatus.COMPLETED]: 'completed',
    [CoreOrderStatus.CANCELLED]: 'failed',
    [CoreOrderStatus.REFUNDED]: 'failed',
  };

  // Determine payment method from order (default to credit_card)
  // TODO: Add payment method to Order type if available
  const paymentMethod = 'credit_card'; // Default, should come from order data

  // Calculate payment status based on paid amount
  let paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' = statusMap[order.status];
  
  if (order.status === CoreOrderStatus.PAID && (order.paidAmount as any) >= (order.totalAmount as any)) {
    paymentStatus = 'completed';
  } else if (order.status === CoreOrderStatus.CANCELLED || order.status === CoreOrderStatus.REFUNDED) {
    paymentStatus = 'failed';
  }

  return {
    id: order.id as any,
    orderId: order.orderNumber,
    customerName: order.customerName,
    amount: order.totalAmount as any,
    status: paymentStatus,
    method: paymentMethod,
    createdAt: new Date(order.createdAt as any).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

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

interface PaymentMonitorProps {
  onExport?: () => void;
}

const PaymentMonitor: React.FC<PaymentMonitorProps> = memo(({ onExport }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Connect to service layer
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders();

  // Convert orders to payments
  const payments: Payment[] = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.map(convertOrderToPayment);
  }, [orders]);

  const filteredPayments = useMemo(() => payments
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.customerName.includes(search) || p.orderId.includes(search)), [payments, filter, search]);

  const stats = useMemo(() => ({
    todayAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) * 0.3,
    pendingAmount: payments.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.amount, 0),
    monthAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalCount: payments.length,
  }), [payments]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (filterId: string) => {
    setFilter(filterId);
  };

  const handleExportClick = () => {
    onExport?.();
  };

  // Show loading state
  if (ordersLoading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading text="載入付款資料中..." />
      </div>
    );
  }

  // Show error state
  if (ordersError && payments.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">載入失敗</p>
          <p className="text-gray-600 mb-4">{ordersError.message || '無法載入付款資料'}</p>
          <button
            onClick={() => refetchOrders()}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
      aria-label="付款管理面板"
    >
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">收款管理</h1>
          <p className="text-slate-500 mt-1">即時監控所有付款狀態</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="trvic-btn trvic-btn-primary gap-2"
          onClick={handleExportClick}
          aria-label="匯出付款報表"
        >
          <Download className="w-4 h-4" />
          匯出報表
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="今日收款"
          value={formatCurrency(stats.todayAmount)}
          aria-label={`今日收款金額：${formatCurrency(stats.todayAmount)}`}
        />
        <StatCard
          icon={Clock}
          label="待收款"
          value={formatCurrency(stats.pendingAmount)}
          aria-label={`待收款金額：${formatCurrency(stats.pendingAmount)}`}
        />
        <StatCard
          icon={TrendingUp}
          label="本月收款"
          value={`NT$ ${stats.monthAmount.toLocaleString()}`}
          aria-label={`本月收款金額：NT$ ${stats.monthAmount.toLocaleString()}`}
        />
        <StatCard
          icon={CreditCard}
          label="交易筆數"
          value={stats.totalCount.toString()}
          aria-label={`總交易筆數：${stats.totalCount}筆`}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="搜尋訂單編號或客戶名稱..."
            className="trvic-input w-full pl-12 pr-4"
            aria-label="搜尋付款記錄"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                filter === f.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
              role="tab"
              aria-selected={filter === f.id}
              aria-controls={`${f.id}-tab`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="trvic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="付款記錄表格">
            <thead>
              <tr className="border-b border-slate-100">
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">訂單編號</th>
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">客戶</th>
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">金額</th>
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">付款方式</th>
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">狀態</th>
                <th scope="col" className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">時間</th>
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
                    aria-labelledby={`payment-${payment.id}-label`}
                  >
                    <td className="px-6 py-5">
                      <span id={`payment-${payment.id}-label`} className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {payment.orderId}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-200 flex items-center justify-center" aria-hidden="true">
                          <span className="text-sm font-bold text-slate-600">
                            {payment.customerName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{payment.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center', method.color)} aria-hidden="true">
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
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">沒有符合條件的交易記錄</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  'aria-label'?: string;
}

const StatCard: React.FC<StatCardProps> = memo(({ icon: Icon, label, value, color, 'aria-label': ariaLabel }) => {
  const colorStyles = {
    emerald: 'bg-brand-600',
    amber: 'bg-brand-500',
    blue: 'bg-brand-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="trvic-card p-4"
      aria-label={ariaLabel}
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
});

export default PaymentMonitor;