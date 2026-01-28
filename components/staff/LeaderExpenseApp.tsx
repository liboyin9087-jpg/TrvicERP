import React, { useState } from 'react';
import { Receipt, Plus, Camera, DollarSign, Calendar, Check, Clock } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const MOCK_EXPENSES: Expense[] = [
  { id: '1', category: '餐飲', description: '團體午餐 - 淺草燒肉', amount: 48000, date: '2025-01-10', status: 'approved' },
  { id: '2', category: '交通', description: '包車費用', amount: 25000, date: '2025-01-10', status: 'pending' },
  { id: '3', category: '門票', description: '晴空塔入場券', amount: 12000, date: '2025-01-09', status: 'approved' },
  { id: '4', category: '其他', description: '急用醫療用品', amount: 1500, date: '2025-01-09', status: 'pending' },
];

export default function LeaderExpenseApp() {
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待審核' },
      approved: { bg: 'bg-brand-100', text: 'text-brand-700', label: '已核准' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已拒絕' },
    };
    return styles[status] || styles.pending;
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">領隊報帳</h2>
          <p className="text-gray-500 mt-1">管理出團費用申報</p>
        </div>
        <button className="bg-primary-900 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <Plus className="w-5 h-5" /> 新增支出
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <p className="text-sm text-gray-500">總支出</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NT$ {totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <p className="text-sm text-gray-500">已核准</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">NT$ {approvedAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <p className="text-sm text-gray-500">待審核</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{expenses.filter(e => e.status === 'pending').length} 筆</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
        {expenses.map((expense) => {
          const status = getStatusStyle(expense.status);
          return (
            <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
                    <Receipt className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{expense.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded focus:ring-2 focus:ring-primary-300 active:bg-primary-800">{expense.category}</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {expense.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">NT$ {expense.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
