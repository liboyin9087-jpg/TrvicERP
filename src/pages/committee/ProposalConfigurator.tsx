// =====================================================
// TravelCanvas - Proposal Configurator (Committee/HR)
// 來源：Bolt 整合版原「CLIENT/HR 提案配置器」區塊，抽成獨立頁
// =====================================================

import React, { useMemo, useState } from 'react';
import { CATEGORIES, TRIP_CONFIG, TRANSLATIONS } from '../../constants';
import type { AudienceType, Option, SelectionState } from '../../types';

import VisualCard from '../../components/VisualCard';
import RollingPrice from '../../components/RollingPrice';
import SummaryStack from '../../components/SummaryStack';
import MarketInsightModal from '../../components/MarketInsightModal';
import { generateKillerCopy, generateProposalPitch } from '../../services/llmService';
import { Loader2, ShieldAlert, Wand2, Zap } from '../../components/Icons';

const ProposalConfigurator: React.FC = () => {
  const t = TRANSLATIONS.zh;

  const [audienceType, setAudienceType] = useState<AudienceType>('SALES');
  const [groupSize] = useState<number>(20);
  const [selections, setSelections] = useState<SelectionState>(() => {
    const initial: SelectionState = {};
    CATEGORIES.forEach(cat => (initial[cat.id] = cat.options[0]));
    return initial;
  });

  const [activeImage, setActiveImage] = useState<string>(CATEGORIES[0].options[0].imageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState<string | null>(null);
  const [isPriceSyncing, setIsPriceSyncing] = useState(false);

  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [killerCopy, setKillerCopy] = useState<string | null>(null);
  const [insightTarget, setInsightTarget] = useState<Option>(CATEGORIES[0].options[0]);

  const totalPrice = useMemo(() => {
    let total = TRIP_CONFIG.basePrice;
    Object.values(selections).forEach((opt) => (total += (opt as Option).priceModifier));
    if (groupSize < TRIP_CONFIG.minGroupSize) total += 2500;
    return total;
  }, [selections, groupSize]);

  const handleSelect = (categoryId: string, optionId: string) => {
    setIsPriceSyncing(true);
    setTimeout(() => {
      const category = CATEGORIES.find(c => c.id === categoryId);
      const option = category?.options.find(o => o.id === optionId);
      if (category && option) {
        setSelections(prev => ({ ...prev, [categoryId]: option }));
        setActiveImage(option.imageUrl);
      }
      setIsPriceSyncing(false);
    }, 400);
  };

  const handleGenerateProposal = async () => {
    setIsGenerating(true);
    const pitch = await generateProposalPitch(selections, CATEGORIES, TRIP_CONFIG, totalPrice, audienceType);
    setGeneratedPitch(pitch);
    setIsGenerating(false);
  };

  const handleOpenMarketInsight = async () => {
    const targetOption = selections['accommodation'] || Object.values(selections)[0];
    if (!targetOption) return;
    setInsightTarget(targetOption);
    setIsInsightOpen(true);
    setInsightLoading(true);
    setKillerCopy(null);
    const copy = await generateKillerCopy(targetOption);
    setKillerCopy(copy);
    setInsightLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[70vh]">
      {/* 左側視覺區 */}
      <div className="hidden lg:block lg:w-1/2 relative h-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={activeImage}
            alt="Preview"
            className="w-full h-full object-cover opacity-90 transition-transform duration-[20s] ease-linear hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-12 max-w-2xl">
          <h1 className="text-5xl font-bold text-white mb-6 leading-none tracking-tight shadow-black drop-shadow-lg">
            {TRIP_CONFIG.tripName}
          </h1>
          {generatedPitch && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-2xl">
              <p className="text-white text-base leading-relaxed italic opacity-90">"{generatedPitch}"</p>
            </div>
          )}
        </div>
      </div>

      {/* 右側配置器 */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 lg:p-12 pb-24 w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.estimatedBudget}</h2>
              <div className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400 mt-2">TWD</span>
                <div className="tracking-tight">
                  {isPriceSyncing ? <span className="animate-pulse text-slate-300">...</span> : <RollingPrice value={totalPrice} />}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setAudienceType('TECH');
                setTimeout(() => handleGenerateProposal(), 500);
              }}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 transition-colors"
            >
              <Wand2 size={14} /> {t.autoMatch}
            </button>
          </div>

          <SummaryStack selections={selections} categories={CATEGORIES} />

          <div className="space-y-10">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <div className="mb-4 pl-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{cat.title}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {cat.options.map((option) => (
                    <VisualCard
                      key={option.id}
                      option={option}
                      isSelected={selections[cat.id]?.id === option.id}
                      onSelect={() => handleSelect(cat.id, option.id)}
                      onHover={() => setActiveImage(option.imageUrl)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
            <button
              onClick={handleOpenMarketInsight}
              className="flex items-center justify-center gap-2 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
            >
              <ShieldAlert size={18} /> {t.competitorAnalysis}
            </button>
            <button
              onClick={handleGenerateProposal}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              {isGenerating ? <Loader2 spinning size={18} /> : <Zap size={18} />}
              {t.generatePitch}
            </button>
          </div>
        </div>
      </div>

      {/* 競品分析模態框 */}
      <MarketInsightModal
        isOpen={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
        isLoading={insightLoading}
        killerCopy={killerCopy}
        selectedOption={insightTarget}
      />
    </div>
  );
};

export default ProposalConfigurator;
