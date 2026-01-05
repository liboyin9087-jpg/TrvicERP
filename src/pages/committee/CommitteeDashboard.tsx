// =====================================================
// TravelCanvas - 福委會工作台 (Committee)
// 功能：
// - 需求(RFP)：沿用 RFPGeneratorPanel（可產生 PDF）
// - 比價：展示報價清單 + 快速用「智慧報價」做成本/毛利推演
// - 投票：VotingCenter (localStorage demo)
// - 提案配置器：Tesla 式配置器（原 Bolt 版本）
// =====================================================

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  LogOut,
  Vote as VoteIcon,
  Wand2
} from '../../components/Icons';
import RFPGeneratorPanel from '../../components/RFPGeneratorPanel';
import SmartPricingEngine from '../../components/SmartPricingEngine';
import VotingCenter from '../../components/voting/VotingCenter';
import ProposalConfigurator from './ProposalConfigurator';

type ActiveTab = 'rfp' | 'quotes' | 'voting' | 'configurator' | 'history';

interface CommitteeDashboardProps {
  onLogout: () => void;
}

// Mock：收到的報價（展示）
const RECEIVED_QUOTES = [
  { id: 1, agency: '陽光旅行社', price: 32900, rating: 4.8, features: ['五星飯店', '專車接送', '含小費'], recommended: true },
  { id: 2, agency: '雄獅旅遊', price: 35500, rating: 4.6, features: ['四星飯店', '環球門票', '米其林餐'] },
  { id: 3, agency: '可樂旅遊', price: 29900, rating: 4.3, features: ['商務飯店', '自由行程多'] },
  { id: 4, agency: '東南旅行社', price: 33200, rating: 4.5, features: ['五星飯店', '購物優惠'] }
];

const CommitteeDashboard: React.FC<CommitteeDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rfp');
  const [showPricing, setShowPricing] = useState(false);

  const stats = useMemo(() => {
    return {
      quotes: RECEIVED_QUOTES.length,
      voting: 1,
      budget: '$1.75M'
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">福委會管理平台</h1>
              <p className="text-sm text-slate-500">企業需求 → 比價 → 投票 → 決標</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <LogOut size={18} /> 登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<FileText size={20} />} label="需求 / RFP" value="進行中" color="blue" />
          <StatCard icon={<BarChart3 size={20} />} label="收到報價" value={stats.quotes} color="emerald" />
          <StatCard icon={<VoteIcon size={20} />} label="投票中" value={stats.voting} color="amber" />
          <StatCard icon={<DollarSign size={20} />} label="年度預算" value={stats.budget} color="violet" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          <TabButton active={activeTab === 'rfp'} onClick={() => setActiveTab('rfp')} icon={<FileText size={16} />} label="需求(RFP)" />
          <TabButton active={activeTab === 'quotes'} onClick={() => setActiveTab('quotes')} icon={<BarChart3 size={16} />} label="比價中心" badge={stats.quotes} />
          <TabButton active={activeTab === 'voting'} onClick={() => setActiveTab('voting')} icon={<VoteIcon size={16} />} label="投票" />
          <TabButton active={activeTab === 'configurator'} onClick={() => setActiveTab('configurator')} icon={<Wand2 size={16} />} label="提案配置器" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<Calendar size={16} />} label="歷年紀錄" />
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[70vh]">
          {activeTab === 'rfp' && (
            <div className="h-[70vh]">
              <RFPGeneratorPanel userRole="welfare_committee" />
            </div>
          )}

          {activeTab === 'quotes' && (
            <QuotesComparison onOpenPricing={() => setShowPricing(true)} />
          )}

          {activeTab === 'voting' && (
            <div className="h-[70vh]">
              <VotingCenter mode="committee" voterId="COMMITTEE_DEMO" />
            </div>
          )}

          {activeTab === 'configurator' && (
            <ProposalConfigurator />
          )}

          {activeTab === 'history' && (
            <HistoryPanel />
          )}
        </div>
      </div>

      {showPricing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-6xl h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <SmartPricingEngine
              onClose={() => setShowPricing(false)}
              initialData={{
                destination: '日本東京',
                duration: 5,
                baseCost: 28000,
                sellingPrice: 32900,
                paxCount: 50,
                fixedCosts: 80000
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// =========================
// Subcomponents
// =========================

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: 'blue' | 'emerald' | 'amber' | 'violet' }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600'
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    {icon}
    {label}
    {badge !== undefined && (
      <span className={`px-1.5 py-0.5 rounded text-xs ${active ? 'bg-blue-200' : 'bg-slate-200'}`}>{badge}</span>
    )}
  </button>
);

const QuotesComparison: React.FC<{ onOpenPricing: () => void }> = ({ onOpenPricing }) => (
  <div>
    <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-slate-900">報價比較 - 2025 員工旅遊（日本 5 日）</h3>
        <p className="text-sm text-slate-500 mt-1">展示版資料；可用「智慧報價」快速推演成本/毛利</p>
      </div>
      <button
        onClick={onOpenPricing}
        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
      >
        開啟智慧報價
      </button>
    </div>

    <div className="divide-y divide-slate-100">
      {RECEIVED_QUOTES.slice().sort((a, b) => a.price - b.price).map((quote, idx) => (
        <div key={quote.id} className={`p-4 ${quote.recommended ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                {idx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900">{quote.agency}</h4>
                  {quote.recommended && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">推薦</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{quote.features.join(' · ')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">${quote.price.toLocaleString()}</p>
              <p className="text-sm text-slate-500">/人</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="p-4 bg-slate-50 border-t border-slate-200">
      <p className="text-xs text-slate-500">下一步：在「投票」分頁建立投票，把 2~3 個方案丟給員工表決（可隱藏價格，僅呈現亮點）。</p>
    </div>
  </div>
);

const HistoryPanel: React.FC = () => (
  <div className="p-6">
    <h3 className="font-bold text-slate-900 mb-2">歷年紀錄（展示）</h3>
    <p className="text-sm text-slate-500">這裡通常會放：歷年旅遊的滿意度、實際花費 vs 預算、供應商評分、事故/客訴回顧。</p>
    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
      TODO：接上真實資料來源（Supabase / Bolt 後端），並加入匯出 CSV / PDF 報表。
    </div>
  </div>
);

export default CommitteeDashboard;
