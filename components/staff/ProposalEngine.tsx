import React, { useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProposalComparisonOutput, ProposalTier } from '@/types/ai';

// [architect] [架構] 常數定義應外移 (中)
// 將常數定義移至檔案頂部，使其與元件分離。
const PROPOSAL_TAGS = ['奢華', '親子', '冒險', '員工旅遊', 'CSR', '美食'];

const DEFAULT_PROPOSAL: ProposalComparisonOutput = {
  title: '企業東京五日 - 三版本提案',
  summary: '依照預算與需求調整住宿與活動層級，維持安全與體驗。',
  tiers: [],
  inclusions: [],
  exclusions: [],
  safety_commitments: [],
};

// [architect] [架構] 缺少明確的 Props 類型定義 (中)
// [architect] [架構] 元件直接依賴全域狀態管理 (useToast) 而未透過 Props 傳入 (中)
// 定義 Prop 類型，明確元件的外部依賴，確保 Kintone 獨立性。
export interface ProposalEngineConfig {
  /**
   * 成功通知的回調函數。取代 `useToast().success`。
   * @param message 顯示的訊息
   */
  onSuccess: (message: string) => void;
  /**
   * 錯誤通知的回調函數。取代 `useToast().error`。
   * @param message 顯示的訊息
   */
  onError: (message: string) => void;
  /**
   * 一般資訊通知的回調函數。取代 `useToast().info`。
   * @param message 顯示的訊息
   */
  onInfo: (message: string) => void;

  /**
   * 執行提案生成邏輯的函數。取代直接呼叫 `aiService`。
   * 允許外部注入 AI 服務的實作，解耦元件與特定服務。
   */
  generateProposal: (
    baseItineraryId: string,
    budgetMin: number,
    budgetMax: number,
    paxCount: number,
    selectedTags: string[]
  ) => Promise<ProposalComparisonOutput>;

  /**
   * 執行提案匯出邏輯的函數。取代直接處理匯出。
   * 允許外部注入 PDF 匯出實作。
   */
  exportProposal: (proposalData: ProposalComparisonOutput) => Promise<void>;
}

// [architect] [架構] 元件職責過重，混合了 UI 渲染與業務邏輯 (高)
// 建立一個自訂 Hook 來封裝業務邏輯和狀態管理，將 UI 渲染與邏輯分離。
const useProposalEngineLogic = (config: ProposalEngineConfig) => {
  const [baseItineraryId, setBaseItineraryId] = useState('TOKYO-5D-2025');
  const [budgetMin, setBudgetMin] = useState(45000);
  const [budgetMax, setBudgetMax] = useState(65000);
  const [paxCount, setPaxCount] = useState(80);
  const [selectedTags, setSelectedTags] = useState<string[]>(['員工旅遊']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<ProposalComparisonOutput>(DEFAULT_PROPOSAL);

  const tiers = useMemo<ProposalTier[]>(() => proposal.tiers || [], [proposal]);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const generatedProposal = await config.generateProposal(
        baseItineraryId,
        budgetMin,
        budgetMax,
        paxCount,
        selectedTags
      );
      setProposal(generatedProposal);
      config.onSuccess('已產生三版本提案');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'AI 提案生成失敗';
      config.onError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [baseItineraryId, budgetMin, budgetMax, paxCount, selectedTags, config]);

  const handleExport = useCallback(async () => {
    try {
      await config.exportProposal(proposal);
      config.onInfo('提案 PDF 正在準備中 (Demo)');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PDF 匯出失敗';
      config.onError(message);
    }
  }, [proposal, config]);

  return {
    baseItineraryId,
    setBaseItineraryId,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    paxCount,
    setPaxCount,
    selectedTags,
    handleToggleTag,
    isGenerating,
    handleGenerate,
    handleExport,
    proposal,
    tiers,
    PROPOSAL_TAGS, // Pass constants that might be needed by the UI
  };
};

export default function ProposalEngine(props: ProposalEngineConfig) {
  // 從自訂 Hook 中取得所有狀態和邏輯函數
  const {
    baseItineraryId,
    setBaseItineraryId,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    paxCount,
    setPaxCount,
    selectedTags,
    handleToggleTag,
    isGenerating,
    handleGenerate,
    handleExport,
    proposal,
    tiers,
    PROPOSAL_TAGS,
  } = useProposalEngineLogic(props);

  return (
    // [designer] 2. [設計] 缺少 drag-handle 結構 (高)
    // [designer] 1. [設計] 硬編碼顏色值 (如 `bg-neutral-50`, `text-neutral-900` 等) (中)
    // 依 Dashtail UI 規範，將整個元件包裝在標準卡片結構中，並使用 Tailwind Token (如 `gray-XXX` 而非 `neutral-XXX`)。
    // `drag-handle` 類別應用於卡片標題旁的拖曳區域。
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex-grow">
          <h1 className="text-xl font-semibold text-gray-900">AI 提案引擎</h1>
          <p className="text-sm text-gray-500 mt-1">
            生成三版本企業提案，快速對齊預算與體驗落差。
          </p>
        </div>
        {/* 為 Kintone Widget 增加拖曳把手 */}
        <div className="flex-shrink-0 cursor-grab text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 drag-handle">
          <Move className="w-5 h-5" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-3 mb-6">
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
        >
          <FileText className="w-4 h-4" />
          匯出 PDF
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          生成提案
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1.95fr] gap-6">
        {/* 需求輸入區塊 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-primary-500" />
            需求輸入
          </div>
          <div className="space-y-4">
            <label className="block text-sm text-gray-500">
              基礎行程 ID
              <input
                value={baseItineraryId}
                onChange={(event) => setBaseItineraryId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-gray-500">
                預算下限
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(event) => setBudgetMin(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                />
              </label>
              <label className="block text-sm text-gray-500">
                預算上限
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(event) => setBudgetMax(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                />
              </label>
            </div>
            <label className="block text-sm text-gray-500">
              估算人數
              <input
                type="number"
                value={paxCount}
                onChange={(event) => setPaxCount(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              />
            </label>
            <div>
              <p className="text-sm text-gray-500 mb-2">偏好標籤</p>
              <div className="flex flex-wrap gap-2">
                {PROPOSAL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm border transition-colors',
                      selectedTags.includes(tag)
                        ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                        : 'border-gray-200 text-gray-600 hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 提案內容顯示區塊 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{proposal.title || '提案比較表'}</h2>
              <p className="text-sm text-gray-500 mt-1">{proposal.summary || '請先生成提案。'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              毛利差異可視化
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {tiers.length > 0 ? (
              tiers.map((tier) => (
                <div key={tier.name} className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                    <span className="text-sm text-primary-600 font-semibold">
                      毛利 {tier.margin_percent}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    NT$ {tier.price_per_person.toLocaleString()}
                    <span className="text-sm text-gray-400">/人</span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>住宿：{tier.lodging}</p>
                    <p>交通：{tier.transport}</p>
                    <p>餐食：{tier.meals}</p>
                  </div>
                  <div className="text-sm text-gray-500">
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
              <div className="col-span-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                尚未生成提案內容
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-2">費用包含</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {(proposal.inclusions || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-2">費用不含</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {(proposal.exclusions || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-2">安全承諾</p>
              <ul className="text-sm text-gray-600 space-y-1">
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