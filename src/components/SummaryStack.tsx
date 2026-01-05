// =====================================================
// TravelCanvas - SummaryStack Component
// 選擇摘要顯示列
// =====================================================

import React from 'react';
import { SelectionState, Category } from '../types';

interface SummaryStackProps {
  selections: SelectionState;
  categories: Category[];
}

const SummaryStack: React.FC<SummaryStackProps> = ({ selections, categories }) => {
  const selectedOptions = categories.map(cat => ({
    categoryTitle: cat.title,
    option: selections[cat.id]
  })).filter(item => item.option);

  if (selectedOptions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        已選配置
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedOptions.map((item, index) => (
          <div 
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm"
          >
            <span className="text-xs text-slate-500">{item.categoryTitle}:</span>
            <span className="text-xs font-bold text-slate-900">{item.option.title}</span>
            {item.option.priceModifier > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                +${item.option.priceModifier.toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryStack;
