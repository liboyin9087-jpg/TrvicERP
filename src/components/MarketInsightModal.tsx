// =====================================================
// TravelCanvas - MarketInsightModal Component
// 競品分析比較模態框
// =====================================================

import React from 'react';
import { Option } from '../types';
import { 
  AlertTriangle, 
  X, 
  Zap, 
  ArrowRight, 
  Building, 
  MapPin, 
  Ruler, 
  Coins 
} from './Icons';

interface MarketInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  killerCopy: string | null;
  selectedOption: Option;
}

const MarketInsightModal: React.FC<MarketInsightModalProps> = ({ 
  isOpen, 
  onClose, 
  isLoading, 
  killerCopy,
  selectedOption 
}) => {
  if (!isOpen) return null;

  const competitor = selectedOption.competitorBenchmark;
  const spec = selectedOption.specData;

  // Loading 或資料不足時顯示骨架
  if (isLoading || !competitor || !spec) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        
        {/* 手機版 Header */}
        <div className="md:hidden sticky top-0 bg-slate-900 text-white p-4 z-10 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            規格健檢表
          </h3>
          <button onClick={onClose} aria-label="關閉">
            <X size={20} />
          </button>
        </div>

        {/* 左欄: 競品 (警告區) */}
        <div className="w-full md:w-1/2 bg-slate-100 p-6 md:p-8 border-r border-slate-200 relative overflow-hidden">
          {/* 浮水印 */}
          <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
            <AlertTriangle size={200} />
          </div>

          <div className="relative z-10">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                他社方案 (Competitor)
              </span>
              <h2 className="text-2xl font-bold text-slate-500 line-through decoration-slate-400 decoration-2">
                {competitor.name}
              </h2>
            </div>

            <div className="space-y-6">
              {/* 指標 1: 年份 */}
              <div className="flex items-start gap-4 opacity-70 grayscale">
                <Building size={24} className="mt-1 text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    {competitor.buildYear} 年建 
                    <span className="ml-2 text-rose-500 text-xs">
                      ({new Date().getFullYear() - competitor.buildYear} 年屋齡)
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">設施可能老舊，維護狀況不明</p>
                </div>
              </div>

              {/* 指標 2: 距離 */}
              <div className="flex items-start gap-4 opacity-70 grayscale">
                <MapPin size={24} className="mt-1 text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    {competitor.distanceToStation > 0 ? `步行 ${competitor.distanceToStation} 分鐘` : '需接駁車'}
                  </p>
                  <p className="text-xs text-slate-500">每日來回耗時，體力消耗大</p>
                </div>
              </div>

              {/* 指標 3: 空間 */}
              {spec.roomSize > 0 && (
                <div className="flex items-start gap-4 opacity-70 grayscale">
                  <Ruler size={24} className="mt-1 text-slate-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      {competitor.roomSize} 平方米
                    </p>
                    <p className="text-xs text-slate-500">空間狹窄，行李箱可能無法全開</p>
                  </div>
                </div>
              )}

              {/* 風險標籤 */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">風險標籤</p>
                <div className="flex flex-wrap gap-2">
                  {competitor.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white border border-slate-300 text-slate-500 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 隱形成本 */}
              {competitor.hiddenCost > 0 && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-1">
                    <Coins size={16} />
                    預估隱形成本
                  </div>
                  <div className="text-2xl font-mono font-bold text-rose-700">
                    + ${competitor.hiddenCost.toLocaleString()}
                  </div>
                  <p className="text-xs text-rose-400 mt-1">包含交通費、誤餐費或購物壓力</p>
                </div>
              )}

              {/* AI 生成攻擊話術 */}
              <div className="mt-6 p-4 bg-slate-200/50 rounded-lg italic text-slate-600 text-sm border-l-4 border-slate-400">
                "{killerCopy || competitor.description}"
              </div>
            </div>
          </div>
        </div>

        {/* 右欄: 我方方案 (榮耀區) */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-8 relative">
          <button 
            onClick={onClose} 
            className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            aria-label="關閉"
          >
            <X size={24} />
          </button>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              您的選擇 (Proposal)
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedOption.title}
            </h2>
          </div>

          <div className="space-y-6">
            {/* 指標 1: 年份 */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {spec.buildYear} 年全新/翻新
                </p>
                <p className="text-xs text-slate-500">
                  {spec.buildYear > 2020 ? '現代化智能設施，設計感極佳' : '維護狀況優良，經典舒適'}
                </p>
              </div>
            </div>

            {/* 指標 2: 距離 */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {spec.distanceToStation === 0 ? '地鐵站直結 / 專車接送' : `步行僅 ${spec.distanceToStation} 分鐘`}
                </p>
                <p className="text-xs text-slate-500">
                  黃金地段，將交通時間轉化為旅遊時間
                </p>
              </div>
            </div>

            {/* 指標 3: 空間 */}
            {spec.roomSize > 0 && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Ruler size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {spec.roomSize} 平方米 ({Math.floor(spec.roomSize / 3.3)} 坪)
                  </p>
                  <p className="text-xs text-slate-500">
                    寬敞舒適，能輕鬆整理戰利品
                  </p>
                </div>
              </div>
            )}

            {/* 優勢標籤 */}
            <div className="pt-2">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-2">尊榮優勢</p>
              <div className="flex flex-wrap gap-2">
                {spec.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 價值陳述 */}
            <div className="mt-8 p-6 bg-slate-900 rounded-xl text-center shadow-xl">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">總結</p>
              <p className="text-white font-bold text-lg">
                "適合慰勞員工的尊榮體驗"
              </p>
              <button 
                onClick={onClose}
                className="mt-4 w-full bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                確認此方案 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsightModal;
