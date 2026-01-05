// =====================================================
// TravelCanvas - Smart Pricing Engine
// 智慧報價引擎：歷史價格分析 + 利潤模擬器
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  RefreshCw,
  X
} from './Icons';
import { getHistoricalPricing, calculateProfitMargin } from '../services/mockDataService';

interface SmartPricingEngineProps {
  initialData?: {
    destination: string;
    duration: number;
    baseCost: number;
    sellingPrice: number;
    paxCount: number;
    fixedCosts: number;
  };
  onClose?: () => void;
  onApply?: (price: number) => void;
}

const SmartPricingEngine: React.FC<SmartPricingEngineProps> = ({
  initialData,
  onClose,
  onApply
}) => {
  // 表單狀態
  const [destination, setDestination] = useState(initialData?.destination || '日本東京');
  const [duration, setDuration] = useState(initialData?.duration || 5);
  const [baseCost, setBaseCost] = useState(initialData?.baseCost || 28000);
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice || 42900);
  const [paxCount, setPaxCount] = useState(initialData?.paxCount || 30);
  const [fixedCosts, setFixedCosts] = useState(initialData?.fixedCosts || 50000);

  // 分析結果
  const [historicalData, setHistoricalData] = useState<{
    avg_price: number;
    min_price: number;
    max_price: number;
    trend: 'up' | 'down' | 'stable';
    sample_count: number;
  } | null>(null);

  const [profitAnalysis, setProfitAnalysis] = useState<{
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    margin_percent: number;
    break_even_pax: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // 載入歷史資料
  useEffect(() => {
    loadHistoricalData();
  }, [destination, duration]);

  // 計算利潤
  useEffect(() => {
    calculateProfit();
  }, [baseCost, sellingPrice, paxCount, fixedCosts]);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const month = new Date().getMonth() + 1;
      const data = await getHistoricalPricing({ destination, duration, month });
      setHistoricalData(data);
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = async () => {
    try {
      const result = await calculateProfitMargin({
        base_cost: baseCost,
        selling_price: sellingPrice,
        pax_count: paxCount,
        fixed_costs: fixedCosts
      });
      setProfitAnalysis(result);
    } catch (error) {
      console.error('Error calculating profit:', error);
    }
  };

  // 價格建議
  const priceRecommendation = useMemo(() => {
    if (!historicalData) return null;

    const { avg_price, min_price, max_price, trend } = historicalData;
    
    let recommendedPrice = avg_price;
    let strategy = 'market';
    let reasoning = '';

    if (trend === 'up') {
      recommendedPrice = Math.round(avg_price * 1.05);
      strategy = 'premium';
      reasoning = '市場需求上升，建議採用溢價策略';
    } else if (trend === 'down') {
      recommendedPrice = Math.round(avg_price * 0.95);
      strategy = 'competitive';
      reasoning = '市場需求下降，建議採用競爭定價';
    } else {
      reasoning = '市場穩定，建議採用市場均價';
    }

    return {
      price: recommendedPrice,
      strategy,
      reasoning,
      competitiveRange: { min: min_price, max: max_price }
    };
  }, [historicalData]);

  // 利潤等級
  const profitGrade = useMemo(() => {
    if (!profitAnalysis) return null;
    
    const { margin_percent } = profitAnalysis;
    
    if (margin_percent >= 25) return { grade: 'A', label: '優秀', color: 'green' };
    if (margin_percent >= 18) return { grade: 'B', label: '良好', color: 'blue' };
    if (margin_percent >= 12) return { grade: 'C', label: '普通', color: 'amber' };
    if (margin_percent >= 5) return { grade: 'D', label: '偏低', color: 'orange' };
    return { grade: 'F', label: '虧損風險', color: 'red' };
  }, [profitAnalysis]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Coins className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">智慧報價引擎</h2>
              <p className="text-sm text-slate-500">歷史價格分析 + 利潤模擬</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X size={20} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 grid lg:grid-cols-2 gap-6">
          {/* 左欄：輸入參數 */}
          <div className="space-y-6">
            {/* 行程資訊 */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-bold text-slate-900 mb-4">行程資訊</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">目的地</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="日本東京">日本東京</option>
                    <option value="日本大阪">日本大阪</option>
                    <option value="日本沖繩">日本沖繩</option>
                    <option value="韓國首爾">韓國首爾</option>
                    <option value="泰國曼谷">泰國曼谷</option>
                    <option value="越南">越南</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">天數</label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6, 7].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          duration === d
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {d} 天
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 成本結構 */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="font-bold text-slate-900 mb-4">成本結構</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    每人成本（不含固定成本）
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">NT$</span>
                    <input
                      type="number"
                      value={baseCost}
                      onChange={(e) => setBaseCost(parseInt(e.target.value) || 0)}
                      className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    固定成本（導遊費、車資等）
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">NT$</span>
                    <input
                      type="number"
                      value={fixedCosts}
                      onChange={(e) => setFixedCosts(parseInt(e.target.value) || 0)}
                      className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    預估人數
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPaxCount(Math.max(10, paxCount - 5))}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-slate-900">{paxCount}</span>
                      <span className="text-slate-500 ml-1">人</span>
                    </div>
                    <button
                      onClick={() => setPaxCount(paxCount + 5)}
                      className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 定價 */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h3 className="font-bold text-slate-900 mb-4">售價設定</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  每人售價
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">NT$</span>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                    className="w-full pl-14 pr-4 py-4 border-2 border-emerald-300 rounded-xl text-xl font-bold focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              {priceRecommendation && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">建議售價</span>
                    <button
                      onClick={() => setSellingPrice(priceRecommendation.price)}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      套用
                    </button>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    NT${priceRecommendation.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{priceRecommendation.reasoning}</p>
                </div>
              )}
            </div>
          </div>

          {/* 右欄：分析結果 */}
          <div className="space-y-6">
            {/* 歷史價格分析 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-600" />
                  歷史價格分析
                </h3>
                <button
                  onClick={loadHistoricalData}
                  disabled={loading}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {historicalData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">最低價</p>
                      <p className="text-lg font-bold text-slate-700">
                        ${historicalData.min_price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">平均價</p>
                      <p className="text-lg font-bold text-blue-700">
                        ${historicalData.avg_price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">最高價</p>
                      <p className="text-lg font-bold text-slate-700">
                        ${historicalData.max_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">市場趨勢</span>
                    <span className={`flex items-center gap-1 font-medium ${
                      historicalData.trend === 'up' ? 'text-rose-600' :
                      historicalData.trend === 'down' ? 'text-green-600' :
                      'text-slate-600'
                    }`}>
                      <TrendingUp size={16} className={
                        historicalData.trend === 'down' ? 'rotate-180' : ''
                      } />
                      {historicalData.trend === 'up' ? '上漲中' :
                       historicalData.trend === 'down' ? '下跌中' : '穩定'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    基於 {historicalData.sample_count} 筆歷史成交資料
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  載入中...
                </div>
              )}
            </div>

            {/* 利潤分析 */}
            {profitAnalysis && profitGrade && (
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-600" />
                  利潤分析
                </h3>

                {/* 利潤等級 */}
                <div className={`p-4 rounded-xl mb-4 ${
                  profitGrade.color === 'green' ? 'bg-green-50 border border-green-200' :
                  profitGrade.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                  profitGrade.color === 'amber' ? 'bg-amber-50 border border-amber-200' :
                  profitGrade.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">利潤評級</p>
                      <p className="text-3xl font-bold">{profitGrade.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">毛利率</p>
                      <p className={`text-2xl font-bold ${
                        profitGrade.color === 'green' ? 'text-green-600' :
                        profitGrade.color === 'blue' ? 'text-blue-600' :
                        profitGrade.color === 'amber' ? 'text-amber-600' :
                        profitGrade.color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {profitAnalysis.margin_percent}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* 詳細數據 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">總營收</span>
                    <span className="font-bold text-slate-900">
                      NT${profitAnalysis.total_revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">總成本</span>
                    <span className="font-bold text-slate-900">
                      NT${profitAnalysis.total_cost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">毛利</span>
                    <span className={`font-bold ${
                      profitAnalysis.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      NT${profitAnalysis.gross_profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">損益平衡人數</span>
                    <span className="font-bold text-slate-900">
                      {profitAnalysis.break_even_pax} 人
                    </span>
                  </div>
                </div>

                {/* 警告提示 */}
                {paxCount < profitAnalysis.break_even_pax && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      目前人數 ({paxCount} 人) 低於損益平衡點，建議調整售價或增加人數。
                    </p>
                  </div>
                )}

                {paxCount >= profitAnalysis.break_even_pax && profitAnalysis.margin_percent >= 15 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
                    <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">
                      利潤結構健康，可以開始接受報名。
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 人數敏感度分析 */}
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">人數敏感度分析</h3>
              <div className="space-y-2">
                {[paxCount - 10, paxCount - 5, paxCount, paxCount + 5, paxCount + 10]
                  .filter(p => p >= 10)
                  .map((p) => {
                    const revenue = sellingPrice * p;
                    const cost = (baseCost * p) + fixedCosts;
                    const profit = revenue - cost;
                    const margin = (profit / revenue) * 100;

                    return (
                      <div
                        key={p}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          p === paxCount ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                        }`}
                      >
                        <span className={`text-sm ${p === paxCount ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>
                          {p} 人
                        </span>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${
                            profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${profit.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            ({margin.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-100 font-medium"
            >
              取消
            </button>
          )}
          {onApply && (
            <button
              onClick={() => onApply(sellingPrice)}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
            >
              套用此報價 (NT${sellingPrice.toLocaleString()}/人)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartPricingEngine;
