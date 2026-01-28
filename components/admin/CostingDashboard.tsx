import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';

export default function CostingDashboard() {
  const costItems = [
    { category: '機票', amount: 1250000, percent: 35 },
    { category: '住宿', amount: 850000, percent: 24 },
    { category: '餐飲', amount: 420000, percent: 12 },
    { category: '交通', amount: 280000, percent: 8 },
    { category: '門票', amount: 350000, percent: 10 },
    { category: '導遊', amount: 180000, percent: 5 },
    { category: '其他', amount: 220000, percent: 6 },
  ];
  const totalCost = costItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div><h2 className="text-2xl font-bold text-gray-900">成本分析</h2><p className="text-gray-500 mt-1">團次成本結構與利潤分析</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><DollarSign className="w-5 h-5 text-gray-600" /></div><p className="text-sm text-gray-500">總成本</p><p className="text-2xl font-bold text-gray-900 mt-1">NT$ {(totalCost / 10000).toFixed(0)}萬</p></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><TrendingUp className="w-5 h-5 text-brand-600" /></div><p className="text-sm text-gray-500">預估營收</p><p className="text-2xl font-bold text-brand-600 mt-1">NT$ 520萬</p></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><BarChart3 className="w-5 h-5 text-brand-600" /></div><p className="text-sm text-gray-500">毛利率</p><p className="text-2xl font-bold text-brand-600 mt-1">32.5%</p></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><PieChart className="w-5 h-5 text-gray-600" /></div><p className="text-sm text-gray-500">人均成本</p><p className="text-2xl font-bold text-gray-900 mt-1">NT$ 28,500</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <h3 className="font-bold text-gray-900 mb-6">成本結構</h3>
          {costItems.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="尚無成本資料"
              description="請先選擇團次或新增成本項目"
              size="sm"
            />
          ) : (
            <div className="space-y-4">
              {costItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-700">{item.category}</span><div className="text-right"><span className="text-sm font-bold text-gray-900">NT$ {item.amount.toLocaleString()}</span><span className="text-sm text-gray-500 ml-2">({item.percent}%)</span></div></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="h-full bg-primary-900 rounded-full focus:ring-2 focus:ring-primary-300 active:bg-primary-800" style={{ width: `${item.percent}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-primary-900 text-white p-6 rounded-2xl focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <h3 className="font-bold mb-6">成本優化建議</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-lg focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-brand-400" /><span className="text-sm font-semibold">機票成本偏高</span></div><p className="text-sm text-gray-400">建議提前 60 天預訂可節省約 15%</p></div>
            <div className="p-4 bg-white/10 rounded-lg focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-brand-400" /><span className="text-sm font-semibold">住宿議價空間</span></div><p className="text-sm text-gray-400">與合作飯店談判團體價，預估可省 8%</p></div>
            <div className="p-4 bg-white/10 rounded-lg focus:ring-2 focus:ring-primary-300 active:bg-primary-800"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-brand-400" /><span className="text-sm font-semibold">潛在節省金額</span></div><p className="text-2xl font-bold text-brand-400 mt-1">NT$ 385,000</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
