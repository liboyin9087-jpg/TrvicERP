/**
 * Expense Management Module - Based on Odoo Expense Module Design
 * Features: Tour cost tracking, supplier payments, profitability analysis
 * Reference: Odoo Expense Management & Travel Agency Modules
 */

import React, { useState, useMemo } from 'react';

// Types
export interface TourExpense {
  id: string;
  tourId: string;
  tourName: string;
  orderId?: string;
  category: ExpenseCategory;
  supplierId?: string;
  supplierName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  amountInTWD: number;
  expenseDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentDueDate?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'accommodation'
  | 'transportation'
  | 'meals'
  | 'attractions'
  | 'guide_fee'
  | 'insurance'
  | 'visa'
  | 'tips'
  | 'miscellaneous';

export interface ExpenseSummary {
  tourId: string;
  tourName: string;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  byCategory: Record<string, number>;
  byCurrency: Record<string, number>;
  pendingPayments: number;
}

// Expense Category Configuration
export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  accommodation: { label: '住宿', icon: '🏨', color: 'bg-blue-100 text-blue-800' },
  transportation: { label: '交通', icon: '🚌', color: 'bg-green-100 text-green-800' },
  meals: { label: '餐食', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
  attractions: { label: '景點門票', icon: '🎫', color: 'bg-purple-100 text-purple-800' },
  guide_fee: { label: '導遊費用', icon: '👤', color: 'bg-cyan-100 text-cyan-800' },
  insurance: { label: '保險', icon: '🛡️', color: 'bg-indigo-100 text-indigo-800' },
  visa: { label: '簽證', icon: '📋', color: 'bg-pink-100 text-pink-800' },
  tips: { label: '小費', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
  miscellaneous: { label: '其他', icon: '📦', color: 'bg-gray-100 text-gray-800' }
};

// Currency options
export const CURRENCIES = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', rate: 1 },
  { code: 'USD', name: '美元', symbol: '$', rate: 31.5 },
  { code: 'JPY', name: '日圓', symbol: '¥', rate: 0.21 },
  { code: 'KRW', name: '韓圜', symbol: '₩', rate: 0.024 },
  { code: 'EUR', name: '歐元', symbol: '€', rate: 34.2 },
  { code: 'CNY', name: '人民幣', symbol: '¥', rate: 4.4 },
  { code: 'THB', name: '泰銖', symbol: '฿', rate: 0.92 },
  { code: 'VND', name: '越南盾', symbol: '₫', rate: 0.0013 },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$', rate: 23.5 },
  { code: 'MYR', name: '馬幣', symbol: 'RM', rate: 7.1 }
];

// Expense Category Badge Component
export const ExpenseCategoryBadge: React.FC<{ category: ExpenseCategory }> = ({ category }) => {
  const config = EXPENSE_CATEGORIES[category];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Payment Status Badge Component
export const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: '待付款' },
    partial: { color: 'bg-blue-100 text-blue-800', label: '部分付款' },
    paid: { color: 'bg-green-100 text-green-800', label: '已付款' }
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// Expense List Component
interface ExpenseListProps {
  expenses: TourExpense[];
  onEdit: (expense: TourExpense) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
  onMarkPaid
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">類別</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">說明</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">供應商</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">付款狀態</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {expense.expenseDate}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ExpenseCategoryBadge category={expense.category} />
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">{expense.description}</div>
                {expense.invoiceNumber && (
                  <div className="text-xs text-gray-500">發票: {expense.invoiceNumber}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {expense.supplierName || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="text-sm font-medium text-gray-900">
                  NT$ {expense.amountInTWD.toLocaleString()}
                </div>
                {expense.currency !== 'TWD' && (
                  <div className="text-xs text-gray-500">
                    {expense.currency} {expense.totalAmount.toLocaleString()}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <PaymentStatusBadge status={expense.paymentStatus} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                <button
                  onClick={() => onEdit(expense)}
                  className="text-blue-600 hover:text-blue-800 mr-2"
                >
                  編輯
                </button>
                {expense.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => onMarkPaid(expense.id)}
                    className="text-green-600 hover:text-green-800 mr-2"
                  >
                    標記已付
                  </button>
                )}
                <button
                  onClick={() => onDelete(expense.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Expense Form Component
interface ExpenseFormProps {
  initialData?: Partial<TourExpense>;
  tourId?: string;
  tourName?: string;
  onSubmit: (data: Partial<TourExpense>) => void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  tourId,
  tourName,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<TourExpense>>({
    tourId: tourId || '',
    tourName: tourName || '',
    category: 'miscellaneous',
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    currency: 'TWD',
    exchangeRate: 1,
    amountInTWD: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'pending',
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newData = { ...formData, [name]: value };

    // Auto-calculate amounts
    if (['quantity', 'unitPrice', 'currency', 'exchangeRate'].includes(name)) {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : formData.quantity || 0;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : formData.unitPrice || 0;
      const totalAmount = quantity * unitPrice;
      
      let exchangeRate = formData.exchangeRate || 1;
      if (name === 'currency') {
        const currency = CURRENCIES.find(c => c.code === value);
        exchangeRate = currency?.rate || 1;
      } else if (name === 'exchangeRate') {
        exchangeRate = parseFloat(value) || 1;
      }
      
      newData = {
        ...newData,
        quantity,
        unitPrice,
        totalAmount,
        exchangeRate,
        amountInTWD: totalAmount * exchangeRate
      };
    }

    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">費用類別 *</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(EXPENSE_CATEGORIES).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: key as ExpenseCategory }))}
                className={`p-2 rounded-lg border text-center transition-all ${
                  formData.category === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-xl">{config.icon}</span>
                <p className="text-xs mt-1">{config.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">費用說明 *</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="例如：東京帝國飯店3晚住宿"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700">供應商</label>
          <input
            type="text"
            name="supplierName"
            value={formData.supplierName || ''}
            onChange={handleChange}
            placeholder="供應商名稱"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">費用日期 *</label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Quantity & Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">數量</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">單價</label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Currency & Exchange Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700">幣別</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">匯率 (1外幣 = ?台幣)</label>
          <input
            type="number"
            name="exchangeRate"
            value={formData.exchangeRate}
            onChange={handleChange}
            min="0"
            step="0.0001"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Invoice Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">發票號碼</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Payment Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">付款截止日</label>
          <input
            type="date"
            name="paymentDueDate"
            value={formData.paymentDueDate || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Amount Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">小計 ({formData.currency})</p>
            <p className="text-lg font-semibold">
              {(formData.totalAmount || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">折合台幣</p>
            <p className="text-xl font-bold text-blue-600">
              NT$ {(formData.amountInTWD || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">備註</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {initialData?.id ? '更新' : '新增費用'}
        </button>
      </div>
    </form>
  );
};

// Tour Profitability Summary Component
interface TourProfitabilitySummaryProps {
  summary: ExpenseSummary;
}

export const TourProfitabilitySummary: React.FC<TourProfitabilitySummaryProps> = ({ summary }) => {
  const profitColor = summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const marginColor = summary.profitMargin >= 0.15 ? 'text-green-600' : 
                      summary.profitMargin >= 0.1 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">{summary.tourName}</h3>
        <p className="text-sm text-gray-500">團費損益分析</p>
      </div>

      <div className="p-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">營收</p>
            <p className="text-lg font-bold text-blue-600">
              NT$ {summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">成本</p>
            <p className="text-lg font-bold text-red-600">
              NT$ {summary.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">毛利</p>
            <p className={`text-lg font-bold ${profitColor}`}>
              NT$ {summary.grossProfit.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">毛利率</p>
            <p className={`text-lg font-bold ${marginColor}`}>
              {(summary.profitMargin * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Expense Breakdown by Category */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">費用分布</h4>
          <div className="space-y-2">
            {Object.entries(summary.byCategory).map(([category, amount]) => {
              const config = EXPENSE_CATEGORIES[category as ExpenseCategory];
              const percentage = (amount / summary.totalExpenses) * 100;
              return (
                <div key={category} className="flex items-center">
                  <span className="w-24 text-sm text-gray-600 flex items-center">
                    <span className="mr-1">{config?.icon}</span>
                    {config?.label}
                  </span>
                  <div className="flex-1 mx-2">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-28 text-right text-sm font-medium">
                    NT$ {amount.toLocaleString()}
                  </span>
                  <span className="w-12 text-right text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Payments Alert */}
        {summary.pendingPayments > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠️</span>
              <span className="text-sm text-yellow-800">
                待付款金額: <strong>NT$ {summary.pendingPayments.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  ExpenseCategoryBadge,
  PaymentStatusBadge,
  ExpenseList,
  ExpenseForm,
  TourProfitabilitySummary,
  EXPENSE_CATEGORIES,
  CURRENCIES
};
