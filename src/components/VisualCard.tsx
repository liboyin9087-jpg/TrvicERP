// =====================================================
// TravelCanvas - VisualCard Component
// Tesla-style 選項卡片
// =====================================================

import React from 'react';
import { Option, BadgeType } from '../types';
import { Check, Plus, Star } from './Icons';

interface VisualCardProps {
  option: Option;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: () => void;
}

const VisualCard: React.FC<VisualCardProps> = ({ 
  option, 
  isSelected, 
  onSelect, 
  onHover 
}) => {
  return (
    <div 
      className={`
        group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ease-out
        ${isSelected 
          ? 'ring-2 ring-blue-600 ring-offset-2 shadow-xl shadow-blue-100 scale-[1.01]' 
          : 'hover:shadow-lg hover:-translate-y-1 border border-slate-200 hover:border-blue-300'}
        bg-white
      `}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      {/* 背景圖片區域 */}
      <div className="h-44 w-full overflow-hidden relative">
        <img 
          src={option.imageUrl} 
          alt={option.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          loading="lazy"
        />
        {/* 漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80" />
        
        {/* 徽章區域 */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
          {option.badgeType !== BadgeType.NONE && option.badgeText && (
            <span className={`
              px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md
              ${option.badgeType === BadgeType.URGENCY ? 'bg-rose-500/90' : 'bg-amber-500/90'}
              animate-in fade-in slide-in-from-right-2 duration-500
            `}>
              {option.badgeText}
            </span>
          )}
          {option.badgeType === BadgeType.GLORY && (
            <span className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-amber-300 border border-white/20">
              <Star size={12} filled />
            </span>
          )}
        </div>

        {/* 選中指示遮罩 */}
        <div className={`absolute inset-0 bg-blue-600/10 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* 內容區域 */}
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          
          {/* 文字內容 */}
          <div className="flex-1 space-y-2">
            <h3 className={`font-bold text-lg leading-tight group-hover:text-blue-700 transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
              {option.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 group-hover:text-slate-600">
              {option.description}
            </p>
          </div>

          {/* 價格與按鈕區域 */}
          <div className="flex flex-col items-end gap-3 min-w-[80px]">
            {/* 價格標籤 */}
            <div className={`text-xs font-bold whitespace-nowrap px-2 py-1 rounded bg-slate-50 ${option.priceModifier > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
              {option.priceModifier > 0 ? `+ $${option.priceModifier.toLocaleString()}` : '標準配置'}
            </div>
            
            {/* 選擇按鈕 */}
            <button 
              className={`
                w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm
                ${isSelected 
                  ? 'bg-blue-600 text-white rotate-0 shadow-blue-300 shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-300 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:scale-110'}
              `}
              type="button"
              aria-label={isSelected ? '已選擇' : '選擇此選項'}
            >
              {isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default VisualCard;
