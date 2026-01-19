import React, { memo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';

interface CostItem {
  category: string;
  amount: number;
  percent: number;
}

interface Props {
  title?: string;
}

const CostingDashboard: React.FC<Props> = memo(({ title = '成本分析' }) => {
  const costItems: CostItem[] = [
    { category: '機票', amount: 1250000, percent: 35 },
    { category: '住宿', amount: 850000, percent: 24 },
    { category: '餐飲', amount: 420000, percent: 12 },
    { category: '交通', amount: 280000, percent: 8 },
    { category: '門票', amount: 350000, percent: 10 },
    { category: '導遊', amount: 180000, percent: 5 },
    { category: '其他', amount: 220000, percent: 6 },
  ];

  const totalCost = React.useMemo(() => costItems.reduce((sum, item) => sum + item.amount, 0), [costItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(value).replace('NT$', 'NT$ ');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in" role="region" aria-label="成本分析儀表板">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" aria-label="儀表板標題">{title}</h2>
        <p className="text-gray-500 mt-1" aria-label="儀表板描述">團次成本結構與利潤分析</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="list">
        <div className="bg-white p-6 rounded-2xl border border-gray-100" role="listitem">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4" aria-hidden="true">
            <DollarSign className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">總成本</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCost)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100" role="listitem">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4" aria-hidden="true">
            <TrendingUp className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-sm text-gray-500">預估營收</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">NT$ 520萬</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100" role="listitem">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mb-4" aria-hidden="true">
            <BarChart3 className="w-5 h-5 text-brand-600" />
          </div>
          <p className="text-sm text-gray-500">毛利率</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">32.5%</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100" role="listitem">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4" aria-hidden="true">
            <PieChart className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">人均成本</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">NT$ 28,500</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100" role="region" aria-label="成本結構">
          <h3 className="font-bold text-gray-900 mb-6">成本結構</h3>
          {costItems.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="尚無成本資料"
              description="請先選擇團次或新增成本項目"
              size="sm"
            />
          ) : (
            <div className="space-y-4" role="list">
              {costItems.map((item, idx) => (
                <div key={`${item.category}-${idx}`} role="listitem">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.percent}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black rounded-full" 
                      style={{ width: `${item.percent}%` }}
                      aria-valuenow={item.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-black text-white p-6 rounded-2xl" role="region" aria-label="成本優化建議">
          <h3 className="font-bold mb-6">成本優化建議</h3>
          <div className="space-y-4" role="list">
            <div className="p-4 bg-white/10 rounded-xl" role="listitem">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold">機票成本偏高</span>
              </div>
              <p className="text-sm text-gray-400">建議提前 60 天預訂可節省約 15%</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl" role="listitem">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold">住宿議價空間</span>
              </div>
              <p className="text-sm text-gray-400">與合作飯店談判團體價，預估可省 8%</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl" role="listitem">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-semibold">潛在節省金額</span>
              </div>
              <p className="text-2xl font-bold text-brand-400 mt-1">NT$ 385,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CostingDashboard;