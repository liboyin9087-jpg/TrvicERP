import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { aiService } from '@/lib/ai/aiService';
import { cn } from '@/lib/utils';
import { useToast } from '@/store/useToastStore';
import type { ProposalComparisonOutput, ProposalTier } from '../../src/types/ai';

const TAGS = ['奢華', '親子', '冒險', '員工旅遊', 'CSR', '美食'];

const defaultProposal: ProposalComparisonOutput = {
  title: '企業東京五日 - 三版本提案',
  summary: '依照預算與需求調整住宿與活動層級，維持安全與體驗。',
  tiers: [],
  inclusions: [],
  exclusions: [],
  safety_commitments: [],
};

export default function ProposalEngine() {
  const toast = useToast();
  const [baseItineraryId, setBaseItineraryId] = useState('TOKYO-5D-2025');
  const [budgetMin, setBudgetMin] = useState(45000);
  const [budgetMax, setBudgetMax] = useState(65000);
  const [paxCount, setPaxCount] = useState(80);
  const [selectedTags, setSelectedTags] = useState<string[]>(['員工旅遊']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<ProposalComparisonOutput>(defaultProposal);

  const tiers = useMemo<ProposalTier[]>(() => proposal.tiers || [], [proposal]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const message = `
請根據以下條件產出三版本企業旅遊提案比較：
- 基礎行程 ID: ${baseItineraryId}
- 預算區間: NT$ ${budgetMin} ~ ${budgetMax}
- 預估人數: ${paxCount}
- 偏好標籤: ${selectedTags.join(', ') || '無'}
請提供經濟版 / 豪華版 / 旗艦版三個方案。
      `.trim();

      const response = await aiService.generateStructured<ProposalComparisonOutput>({
        message,
        mode: 'marketing',
        schema: 'proposal_comparison',
        context: '',
        max_attempts: 2,
      });

      setProposal(response.data);
      toast.success('已產生三版本提案');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'AI 提案生成失敗';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    toast.info('提案 PDF 正在準備中 (Demo)');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI 提案引擎</h1>
          <p className="text-sm text-gray-500">
            生成三版本企業提案，快速對齊預算與體驗落差。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:border-gray-300"
          >
            <FileText className="w-4 h-4" />
            匯出 PDF
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            生成提案
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1.95fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-blue-500" />
            需求輸入
          </div>
          <div className="space-y-4">
            <label className="block text-xs text-gray-500">
              基礎行程 ID
              <input
                value={baseItineraryId}
                onChange={(event) => setBaseItineraryId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-gray-500">
                預算下限
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(event) => setBudgetMin(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-xs text-gray-500">
                預算上限
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(event) => setBudgetMax(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
            <label className="block text-xs text-gray-500">
              估算人數
              <input
                type="number"
                value={paxCount}
                onChange={(event) => setPaxCount(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div>
              <p className="text-xs text-gray-500 mb-2">偏好標籤</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{proposal.title || '提案比較表'}</h2>
              <p className="text-sm text-gray-500 mt-1">{proposal.summary || '請先生成提案。'}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              毛利差異可視化
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <div key={tier.name} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                    <span className="text-xs text-blue-600 font-semibold">
                      毛利 {tier.margin_percent}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    NT$ {tier.price_per_person.toLocaleString()}
                    <span className="text-xs text-gray-400">/人</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>住宿：{tier.lodging}</p>
                    <p>交通：{tier.transport}</p>
                    <p>餐食：{tier.meals}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {tier.highlights && tier.highlights.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {tier.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                尚未生成提案內容
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-2">費用包含</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {(proposal.inclusions || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-2">費用不含</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {(proposal.exclusions || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-2">安全承諾</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {(proposal.safety_commitments || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
