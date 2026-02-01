// src/services/dynamicCostEngine.ts

import type { Session, Customer } from '../core/types'; // 假設這些類型來自核心定義
import {
  CostFactor,
  DynamicPricingRule,
  CostCalculationResult,
  CostBreakdown,
  AppliedRule,
  MarketData,
  DynamicCostEngineConfig,
  MinimalSession,
} from '../types/dynamicCostEngine.d'; // 引入分離的類型定義

// --- 預設配置 (可透過建構子或環境變數覆寫) ---

/**
 * 預設成本因子。這些值作為服務的初始配置，可在建構時被覆寫。
 * 在實際應用中，這些複雜結構通常會從配置服務、資料庫或經解析的環境變數載入。
 */
const DEFAULT_INITIAL_COST_FACTORS: CostFactor[] = [
  // 基礎交通成本
  {
    id: 'base_bus_cost',
    name: '基礎巴士成本',
    type: 'fixed',
    value: 3000,
    unit: '元/天',
    category: 'transport',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'fuel_surcharge',
    name: '燃油附加費',
    type: 'percentage',
    value: 15, // 15%
    unit: '%',
    category: 'surcharge',
    conditions: { minPeople: 20 },
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'driver_fee',
    name: '司機費用',
    type: 'per_day',
    value: 2500,
    unit: '元/天',
    category: 'transport',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  
  // 住宿成本
  {
    id: 'hotel_base_rate',
    name: '飯店基礎費率',
    type: 'per_person',
    value: 1200,
    unit: '元/人/晚',
    category: 'accommodation',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'peak_season_surcharge',
    name: '旺季附加費',
    type: 'percentage',
    value: 30, // 30%
    unit: '%',
    category: 'surcharge',
    conditions: { season: 'peak' },
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  
  // 餐飲成本
  {
    id: 'meal_breakfast',
    name: '早餐',
    type: 'per_person',
    value: 150,
    unit: '元/人',
    category: 'meal',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'meal_lunch',
    name: '午餐',
    type: 'per_person',
    value: 250,
    unit: '元/人',
    category: 'meal',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'meal_dinner',
    name: '晚餐',
    type: 'per_person',
    value: 300,
    unit: '元/人',
    category: 'meal',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  
  // 活動成本
  {
    id: 'activity_base',
    name: '活動基礎費用',
    type: 'per_person',
    value: 500,
    unit: '元/人',
    category: 'activity',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  
  // 保險成本
  {
    id: 'insurance_base',
    name: '旅遊保險',
    type: 'per_person',
    value: 200,
    unit: '元/人',
    category: 'insurance',
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  
  // 綠色旅遊成本因子
  {
    id: 'green_transport_upgrade',
    name: '環保交通升級（電動巴士）',
    type: 'per_person',
    value: 200,
    unit: '元/人',
    category: 'green',
    isActive: true,
    effectiveDate: '2026-01-01'
  },
  {
    id: 'green_accommodation_upgrade',
    name: '綠色旅宿升級',
    type: 'per_person',
    value: 300,
    unit: '元/人/晚',
    category: 'green',
    isActive: true,
    effectiveDate: '2026-01-01'
  },
  {
    id: 'carbon_offset_fee',
    name: '碳抵銷費用',
    type: 'per_person',
    value: 50,
    unit: '元/人',
    category: 'green',
    isActive: true,
    effectiveDate: '2026-01-01'
  },
  {
    id: 'eco_guide_fee',
    name: '生態導覽專業費',
    type: 'per_day',
    value: 1500,
    unit: '元/天',
    category: 'green',
    isActive: true,
    effectiveDate: '2026-01-01'
  },

  // 折扣
  {
    id: 'green_subsidy_discount',
    name: '環保交通補貼',
    type: 'percentage',
    value: -3, // -3%
    unit: '%',
    category: 'discount',
    isActive: true,
    effectiveDate: '2026-01-01'
  },
  {
    id: 'early_booking_discount',
    name: '早鳥優惠',
    type: 'percentage',
    value: -10, // -10%
    unit: '%',
    category: 'discount',
    conditions: { advanceBooking: 30 }, // 提前預訂30天
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'group_discount',
    name: '團體優惠',
    type: 'percentage',
    value: -5, // -5%
    unit: '%',
    category: 'discount',
    conditions: { minPeople: 30 },
    isActive: true,
    effectiveDate: '2024-01-01'
  }
];

/**
 * 預設動態定價規則。這些值作為服務的初始配置，可在建構時被覆寫。
 * 在實際應用中，這些複雜結構通常會從配置服務、資料庫或經解析的環境變數載入。
 */
const DEFAULT_INITIAL_DYNAMIC_PRICING_RULES: DynamicPricingRule[] = [
  {
    id: 'fuel_price_adjustment',
    name: '油價調整',
    trigger: {
      type: 'competitor',
      condition: 'fuel_price_change',
      threshold: 5 // 油價變動超過5% (相對於基準油價)
    },
    action: {
      type: 'increase',
      value: 3, // 增加3%
      maxAdjustment: 10 // 最大調整10% (相對於當前總成本)
    },
    priority: 1,
    isActive: true
  },
  {
    id: 'peak_season_pricing',
    name: '旺季定價',
    trigger: {
      type: 'season',
      condition: 'peak_season_high_occupancy',
      threshold: 80 // 飯店住房率超過80%
    },
    action: {
      type: 'multiply',
      value: 1.2, // 價格乘以1.2 (即增加20%)
      maxAdjustment: 25 // 最大調整25% (相對於當前總成本)
    },
    priority: 2,
    isActive: true
  },
  {
    id: 'low_demand_discount',
    name: '低需求折扣',
    trigger: {
      type: 'demand',
      condition: 'low_booking_rate',
      threshold: 30 // 飯店住房率低於30% (作為需求低的指標)
    },
    action: {
      type: 'decrease',
      value: 8, // 降低8%
      maxAdjustment: 15 // 最大降低15% (相對於當前總成本)
    },
    priority: 3,
    isActive: true
  }
];

/**
 * 預設參考油價。此值應透過環境變數配置，以實現架構獨立性。
 * 在 Node.js 環境中為 `process.env.REFERENCE_FUEL_PRICE`，在瀏覽器環境中可能透過 Webpack DefinePlugin 或其他方式注入。
 */
const DEFAULT_REFERENCE_FUEL_PRICE = parseFloat(
  typeof process !== 'undefined' && process.env.REFERENCE_FUEL_PRICE
    ? process.env.REFERENCE_FUEL_PRICE
    : '29.5' // 若環境變數未設置，則使用硬編碼預設值
);

/**
 * 計算上下文，用於在各私有方法間傳遞常用參數
 */
interface CalculationContext {
  numberOfPeople: number;
  duration: number;
  season: 'peak' | 'shoulder' | 'off';
  advanceDays: number;
  marketData: MarketData;
  referenceFuelPrice: number;
}

/**
 * 動態成本計算引擎類別
 * 負責根據多種因子、市場數據和動態規則計算服務成本。
 */
export class DynamicCostEngine {
  private costFactors: Map<string, CostFactor> = new Map();
  private pricingRules: Map<string, DynamicPricingRule> = new Map();
  private marketData: MarketData;
  private lastMarketUpdate: string;
  private referenceFuelPrice: number;

  /**
   * 建構函數，接受配置對象以初始化成本因子和定價規則。
   * 這實現了架構獨立性，允許外部在不修改原始碼的情況下配置引擎。
   * @param config 可選的配置對象，用於覆寫預設的成本因子、定價規則、初始市場數據和參考油價。
   */
  constructor(config?: DynamicCostEngineConfig) {
    // 初始化成本因子，優先使用傳入的配置，否則使用預設值
    const initialCostFactors = config?.defaultCostFactors || DEFAULT_INITIAL_COST_FACTORS;
    initialCostFactors.forEach(factor => {
      this.costFactors.set(factor.id, factor);
    });

    // 初始化定價規則，優先使用傳入的配置，否則使用預設值
    const initialPricingRules = config?.dynamicPricingRules || DEFAULT_INITIAL_DYNAMIC_PRICING_RULES;
    initialPricingRules.forEach(rule => {
      this.pricingRules.set(rule.id, rule);
    });

    // 初始化市場數據，優先使用傳入的配置，否則使用預設值
    this.marketData = config?.initialMarketData || this.initializeMarketData();
    this.lastMarketUpdate = new Date().toISOString();

    // 初始化參考油價，優先使用傳入的配置，否則使用環境變數的預設值
    this.referenceFuelPrice = config?.referenceFuelPrice || DEFAULT_REFERENCE_FUEL_PRICE;
  }

  /**
   * 核心計算函數：計算動態成本。
   * 此函數整合了所有成本因子、附加費、折扣和動態定價規則。
   * @param session 團次數據，包含人數、天數和預訂日期等。
   * @param customFactors 可選的自定義成本因子，用於臨時調整。
   * @returns 成本計算結果，包含詳細的成本明細和應用規則。
   */
  async calculateDynamicCost(
    session: MinimalSession,
    customFactors?: Partial<CostFactor>[]
  ): Promise<CostCalculationResult> {
    const { customers, duration, bookingDate } = session;
    const numberOfPeople = customers?.length || 1; // 確保人數至少為1

    if (numberOfPeople <= 0 || duration <= 0) {
      throw new Error('Number of people and duration must be positive values for cost calculation.');
    }

    // 更新市場數據以獲取最新資訊
    await this.updateMarketData();

    // 確定季節和提前預訂天數，作為計算條件
    const actualBookingDate = bookingDate || new Date(); // 若 session 無 bookingDate 則使用當前日期
    const season = this.determineSeason(actualBookingDate);
    const advanceDays = this.calculateAdvanceDays(actualBookingDate);

    // 將常用參數打包成 context，方便在各私有方法間傳遞
    const context: CalculationContext = {
      numberOfPeople,
      duration,
      season,
      advanceDays,
      marketData: this.marketData,
      referenceFuelPrice: this.referenceFuelPrice,
    };

    const allAppliedRules: AppliedRule[] = [];
    let currentTotalCost = 0; // 用於累積計算過程中的總成本

    // 1. 計算原始成本：包含所有非百分比的固定費用、按人、按天成本，以及自定義因子。
    const { rawCost, additionalCostsBreakdown } = this.calculateRawCost(context, customFactors);
    currentTotalCost = rawCost;

    // 2. 計算附加費：基於當前總成本 (rawCost) 應用百分比附加費。
    const surcharges = this.calculateSurcharges(currentTotalCost, context);
    const totalSurchargesAmount = surcharges.reduce((sum, cost) => sum + cost.amount, 0);
    currentTotalCost += totalSurchargesAmount;

    // 3. 計算折扣：基於當前總成本 (rawCost + surcharges) 應用百分比折扣。
    const discounts = this.calculateDiscounts(currentTotalCost, context);
    const totalDiscountsAmount = discounts.reduce((sum, cost) => sum + cost.amount, 0);
    currentTotalCost += totalDiscountsAmount; // 折扣為負值，相加即為扣減

    // 4. 應用動態定價規則：基於當前總成本 (rawCost + surcharges + discounts) 進行調整。
    const { adjustedAmount, appliedRules: dynamicRulesApplied } = this.applyDynamicPricing(
      currentTotalCost,
      context
    );
    currentTotalCost += adjustedAmount;
    allAppliedRules.push(...dynamicRulesApplied);

    // 動態調整明細
    const dynamicAdjustments: CostBreakdown[] = [];
    if (adjustedAmount !== 0) {
      dynamicAdjustments.push({
        category: 'dynamic_pricing',
        name: '動態價格調整',
        amount: adjustedAmount,
        unit: '元',
        quantity: 1,
        description: `來自 ${dynamicRulesApplied.length} 條動態規則的調整`,
      });
    }

    // 返回最終計算結果
    return {
      rawCost,
      surcharges,
      discounts,
      dynamicAdjustments,
      totalCost: currentTotalCost,
      costPerPerson: numberOfPeople > 0 ? currentTotalCost / numberOfPeople : 0,
      appliedRules: allAppliedRules,
      lastUpdated: new Date().toISOString(),
      confidence: this.calculateConfidence()
    };
  }

  /**
   * 更新現有的成本因子。
   * @param factor 要更新的成本因子。
   */
  updateCostFactor(factor: CostFactor): void {
    this.costFactors.set(factor.id, factor);
  }

  /**
   * 新增一個動態定價規則。
   * @param rule 要新增的定價規則。
   */
  addPricingRule(rule: DynamicPricingRule): void {
    this.pricingRules.set(rule.id, rule);
  }

  /**
   * 取得最新的即時市場數據。
   * @returns 市場數據。
   */
  async getRealTimeMarketData(): Promise<MarketData> {
    await this.updateMarketData(); // 確保數據是最新的
    return { ...this.marketData };
  }

  /**
   * 預測未來指定天數的成本趨勢。
   * @param daysAhead 預測未來的天數。
   * @param numberOfPeople 預測時的人數。
   * @param duration 預測時的天數。
   * @returns 包含每日預測成本、信心指數和影響因子的列表。
   */
  predictCostTrends(
    daysAhead: number,
    numberOfPeople: number,
    duration: number
  ): Array<{
    date: string;
    predictedCost: number;
    confidence: number;
    factors: string[];
  }> {
    const trends = [];
    const currentDate = new Date();

    for (let i = 1; i <= daysAhead; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + i);
      
      const season = this.determineSeason(futureDate);
      const predictedMarketData = this.predictMarketData(futureDate); // 預測未來市場數據
      
      const prediction = this.predictCostForDate(
        futureDate,
        numberOfPeople,
        duration,
        season,
        predictedMarketData
      );

      trends.push({
        date: futureDate.toISOString().split('T')[0],
        predictedCost: prediction.cost,
        confidence: prediction.confidence,
        factors: prediction.factors
      });
    }

    return trends;
  }

  /**
   * 產生成本分析報告，包含當前成本、明細、優化建議和風險因素。
   * @param session 團次數據。
   * @returns 成本分析報告。
   */
  async generateCostAnalysis(session: MinimalSession): Promise<{
    currentCost: CostCalculationResult;
    costBreakdown: Record<string, number>;
    optimizationSuggestions: string[];
    riskFactors: string[];
  }> {
    const currentCost = await this.calculateDynamicCost(session);

    const costBreakdown = this.analyzeCostBreakdown(currentCost);
    const optimizationSuggestions = this.generateOptimizationSuggestions(currentCost, session);
    const riskFactors = this.identifyRiskFactors(currentCost);

    return {
      currentCost,
      costBreakdown,
      optimizationSuggestions,
      riskFactors
    };
  }

  // --- 私有輔助方法 ---

  /**
   * 根據類型和條件計算單一成本因子的金額。
   * 此方法統一了所有因子（包括自定義因子）的計算邏輯。
   * @param factor 成本因子對象。
   * @param numberOfPeople 人數。
   * @param duration 天數。
   * @param baseAmountForPercentage 基礎金額 (僅用於百分比類型因子)。
   * @returns 計算出的金額。
   */
  private _calculateFactorAmount(
    factor: CostFactor | Partial<CostFactor>,
    numberOfPeople: number,
    duration: number,
    baseAmountForPercentage: number = 0
  ): number {
    if (factor.isActive === false) return 0; // 不活躍的因子不計算

    const value = factor.value || 0;
    
    switch (factor.type) {
      case 'fixed':
        return value;
      case 'percentage':
        return (baseAmountForPercentage * value) / 100;
      case 'per_person':
        return value * numberOfPeople;
      case 'per_day':
        return value * duration;
      case 'dynamic': // 假設動態類型需要人數和天數
        return value * numberOfPeople * duration;
      default:
        return value;
    }
  }

  /**
   * 檢查成本因子的條件是否滿足。
   * @param factor 成本因子。
   * @param context 計算上下文。
   * @returns 如果所有條件都滿足則為 true，否則為 false。
   */
  private _checkFactorConditions(factor: CostFactor, context: CalculationContext): boolean {
    const conditions = factor.conditions;
    if (!conditions) return true; // 無條件則始終滿足

    if (conditions.minPeople && context.numberOfPeople < conditions.minPeople) return false;
    if (conditions.maxPeople && context.numberOfPeople > conditions.maxPeople) return false;
    if (conditions.season && context.season !== conditions.season) return false;
    // 如果有 weekdays 條件，需要傳入具體日期來判斷
    // if (conditions.weekdays && !isWeekday(context.currentDate)) return false; 
    if (conditions.advanceBooking && context.advanceDays < conditions.advanceBooking) return false;

    return true;
  }

  /**
   * 計算原始成本 (所有非百分比的固定費用、按人、按天等)。
   * 這部分成本是所有附加費和折扣的基礎。
   * @param context 計算上下文。
   * @param customFactors 自定義成本因子。
   * @returns 包含原始成本總額及詳細明細的對象。
   */
  private calculateRawCost(
    context: CalculationContext,
    customFactors?: Partial<CostFactor>[]
  ): { rawCost: number; additionalCostsBreakdown: CostBreakdown[] } {
    let totalRawCost = 0;
    const breakdown: CostBreakdown[] = [];

    // 遍歷所有非百分比類型的成本因子來計算原始成本
    this.costFactors.forEach(factor => {
      // 排除百分比類型的附加費和折扣，這些將在後續步驟計算
      const isBaseCostFactor = factor.type !== 'percentage' && factor.category !== 'surcharge' && factor.category !== 'discount';
      
      if (factor.isActive && isBaseCostFactor) {
        if (this._checkFactorConditions(factor, context)) {
          const amount = this._calculateFactorAmount(factor, context.numberOfPeople, context.duration);
          totalRawCost += amount;
          breakdown.push({
            category: factor.category,
            name: factor.name,
            amount,
            unit: factor.unit || '元',
            quantity: factor.type === 'per_person' ? context.numberOfPeople : (factor.type === 'per_day' ? context.duration : 1),
            description: `${factor.name} (${factor.value}${factor.unit || ''})`,
            factorId: factor.id,
          });
        }
      }
    });

    // 處理自定義因子，同樣排除百分比類型
    if (customFactors) {
      customFactors.forEach(customFactor => {
        const isBaseCustomFactor = customFactor.isActive !== false && customFactor.type !== 'percentage';
        if (isBaseCustomFactor) {
          // 對於自定義因子，條件判斷可能更複雜，這裡簡化處理
          // 如果需要，customFactor 也可以包含 conditions 欄位
          const amount = this._calculateFactorAmount(customFactor, context.numberOfPeople, context.duration);
          totalRawCost += amount;
          breakdown.push({
            category: customFactor.category || 'custom',
            name: customFactor.name || '自定義費用',
            amount,
            unit: customFactor.unit || '元',
            quantity: customFactor.type === 'per_person' ? context.numberOfPeople : (customFactor.type === 'per_day' ? context.duration : 1),
            description: customFactor.name || '自定義費用',
            factorId: customFactor.id || `custom_${Math.random().toString(36).substring(7)}`, // 為自定義因子生成一個ID
          });
        }
      });
    }

    return { rawCost: totalRawCost, additionalCostsBreakdown: breakdown };
  }

  /**
   * 計算所有適用的附加費。
   * @param baseAmount 附加費計算的基礎金額。
   * @param context 計算上下文。
   * @returns 附加費明細列表。
   */
  private calculateSurcharges(
    baseAmount: number,
    context: CalculationContext
  ): CostBreakdown[] {
    const surcharges: CostBreakdown[] = [];

    this.costFactors.forEach(factor => {
      if (factor.isActive && factor.category === 'surcharge' && factor.type === 'percentage') {
        if (this._checkFactorConditions(factor, context)) {
          const amount = this._calculateFactorAmount(factor, context.numberOfPeople, context.duration, baseAmount);
          surcharges.push({
            category: factor.category,
            name: factor.name,
            amount,
            unit: factor.unit || '元',
            quantity: 1,
            description: `${factor.name} (${factor.value}%)`,
            factorId: factor.id,
          });
        }
      }
    });
    return surcharges;
  }

  /**
   * 計算所有適用的折扣。
   * @param baseAmount 折扣計算的基礎金額。
   * @param context 計算上下文。
   * @returns 折扣明細列表 (折扣金額為負值)。
   */
  private calculateDiscounts(
    baseAmount: number,
    context: CalculationContext
  ): CostBreakdown[] {
    const discounts: CostBreakdown[] = [];

    this.costFactors.forEach(factor => {
      if (factor.isActive && factor.category === 'discount' && factor.type === 'percentage') {
        if (this._checkFactorConditions(factor, context)) {
          const amount = this._calculateFactorAmount(factor, context.numberOfPeople, context.duration, baseAmount);
          discounts.push({
            category: factor.category,
            name: factor.name,
            amount,
            unit: factor.unit || '元',
            quantity: 1,
            description: `${factor.name} (${Math.abs(factor.value)}%)`, // 顯示折扣的絕對值百分比
            factorId: factor.id,
          });
        }
      }
    });
    return discounts;
  }

  /**
   * 應用所有動態定價規則。
   * 規則按優先級排序，並逐一應用。
   * @param baseCostForAdjustment 規則調整的基礎金額。
   * @param context 計算上下文。
   * @returns 包含總調整金額及所有已應用規則的對象。
   */
  private applyDynamicPricing(
    baseCostForAdjustment: number,
    context: CalculationContext
  ): { adjustedAmount: number; appliedRules: AppliedRule[] } {
    let adjustment = 0;
    const appliedRules: AppliedRule[] = [];

    // 按優先級排序規則 (優先級數字越小，表示優先級越高)
    const sortedRules = Array.from(this.pricingRules.values())
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.shouldApplyRule(rule, context)) {
        // 計算單一規則的調整金額，考慮當前已累積的調整額度以避免超限
        const ruleAdjustment = this.calculateRuleAdjustment(rule, baseCostForAdjustment, adjustment, context);
        adjustment += ruleAdjustment;
        
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          impact: ruleAdjustment,
          reason: this.getRuleApplicationReason(rule, context)
        });
      }
    }

    return { adjustedAmount: adjustment, appliedRules };
  }

  /**
   * 判斷是否應該應用某個動態定價規則。
   * 根據規則的觸發條件和當前的市場數據、人數等上下文信息進行判斷。
   * @param rule 動態定價規則。
   * @param context 計算上下文。
   * @returns 如果規則條件滿足則為 true，否則為 false。
   */
  private shouldApplyRule(
    rule: DynamicPricingRule,
    context: CalculationContext
  ): boolean {
    const { marketData, numberOfPeople, season, advanceDays, referenceFuelPrice } = context;

    switch (rule.trigger.type) {
      case 'season':
        // 範例：旺季且飯店住房率高於閾值
        return season === 'peak' && marketData.hotelOccupancy > rule.trigger.threshold;
      case 'demand':
        // 範例：飯店住房率（作為需求代理）低於閾值
        return marketData.hotelOccupancy < rule.trigger.threshold;
      case 'competitor':
        // 範例：油價相對參考價變動超過閾值
        const fuelPriceChange = Math.abs((marketData.fuelPrice - referenceFuelPrice) / referenceFuelPrice) * 100;
        return fuelPriceChange > rule.trigger.threshold;
      case 'people_count':
        // 範例：人數達到或超過閾值
        return numberOfPeople >= rule.trigger.threshold;
      case 'time':
        // 範例：提前預訂天數達到閾值
        return rule.trigger.condition === 'advanceBooking' && advanceDays >= rule.trigger.threshold;
      // 可擴展更多觸發類型
      default:
        return false;
    }
  }

  /**
   * 計算單一動態定價規則的調整金額。
   * @param rule 動態定價規則。
   * @param initialBaseCost 調整的基準成本 (通常是應用動態規則前的總成本)。
   * @param currentAdjustmentTotal 當前已累積的調整總額 (由高優先級規則產生)。
   * @param context 計算上下文。
   * @returns 規則調整金額。
   */
  private calculateRuleAdjustment(
    rule: DynamicPricingRule,
    initialBaseCost: number,
    currentAdjustmentTotal: number,
    context: CalculationContext
  ): number {
    let adjustment = 0;
    const baseValue = initialBaseCost;

    switch (rule.action.type) {
      case 'increase':
        adjustment = (baseValue * rule.action.value) / 100;
        break;
      case 'decrease':
        adjustment = -(baseValue * rule.action.value) / 100;
        break;
      case 'multiply':
        adjustment = baseValue * (rule.action.value - 1); // 如果 value 是 1.2，表示增加 20%
        break;
      case 'fixed_set':
        // 此類型更複雜，通常意味著設定最終價格，而非簡單調整。
        // 為簡化，如果需實現，需考慮目標價格與當前價格的差額。
        // 目前不支援此複雜行為，可根據實際需求完善。
        adjustment = 0; 
        break;
    }

    // 應用調整限制，防止調整金額超過預設的最大/最小百分比或絕對值
    if (rule.action.maxAdjustment !== undefined && adjustment > 0) {
      const maxAdjustmentValue = (initialBaseCost * rule.action.maxAdjustment) / 100;
      adjustment = Math.min(adjustment, maxAdjustmentValue - currentAdjustmentTotal);
    }
    if (rule.action.minAdjustment !== undefined && adjustment < 0) {
      const minAdjustmentValue = -(initialBaseCost * Math.abs(rule.action.minAdjustment)) / 100;
      adjustment = Math.max(adjustment, minAdjustmentValue - currentAdjustmentTotal);
    }
    if (rule.action.absoluteMaxAdjustment !== undefined && adjustment > rule.action.absoluteMaxAdjustment) {
      adjustment = rule.action.absoluteMaxAdjustment - currentAdjustmentTotal;
    }
    if (rule.action.absoluteMinAdjustment !== undefined && adjustment < rule.action.absoluteMinAdjustment) {
      adjustment = rule.action.absoluteMinAdjustment - currentAdjustmentTotal;
    }
    
    return adjustment;
  }

  /**
   * 取得規則應用原因的描述文字。
   * @param rule 動態定價規則。
   * @param context 計算上下文。
   * @returns 描述原因的字串。
   */
  private getRuleApplicationReason(rule: DynamicPricingRule, context: CalculationContext): string {
    const { marketData, numberOfPeople, advanceDays } = context;
    switch (rule.trigger.type) {
      case 'season':
        return `旺季住房率達 ${Math.round(marketData.hotelOccupancy)}% (閾值: ${rule.trigger.threshold}%)`;
      case 'demand':
        return `當前需求較低，住房率僅 ${Math.round(marketData.hotelOccupancy)}% (閾值: ${rule.trigger.threshold}%)`;
      case 'competitor':
        const currentFuelPriceChange = Math.abs((marketData.fuelPrice - this.referenceFuelPrice) / this.referenceFuelPrice) * 100;
        return `油價波動 (${currentFuelPriceChange.toFixed(1)}%) 超過 ${rule.trigger.threshold}%`;
      case 'people_count':
        return `人數達到或超過 ${rule.trigger.threshold} 人 (當前人數: ${numberOfPeople} 人)`;
      case 'time':
        return `提前預訂天數達到 ${advanceDays} 天 (閾值: ${rule.trigger.threshold} 天)`;
      default:
        return '市場條件變動';
    }
  }

  /**
   * 更新市場數據。在實際應用中，此方法會調用外部 API 獲取最新的市場資訊。
   * 這裡使用模擬數據。
   */
  private async updateMarketData(): Promise<void> {
    this.marketData = {
      fuelPrice: 28.5 + Math.random() * 4, // 28.5-32.5 元/公升
      hotelOccupancy: 60 + Math.random() * 35, // 60-95%
      flightDemand: 0.6 + Math.random() * 0.4, // 0.6-1.0
      competitorPrices: [
        {
          competitor: 'CompetitorA',
          route: 'Taipei-Kaohsiung',
          price: 2500 + Math.random() * 500,
          lastUpdated: new Date().toISOString()
        }
      ],
      seasonality: {
        current: this.determineCurrentSeason(),
        nextMonth: this.determineNextMonthSeason(),
        seasonalMultiplier: this.getSeasonalMultiplier()
      }
    };

    this.lastMarketUpdate = new Date().toISOString();
  }

  /**
   * 初始化市場數據的預設值。
   * @returns 初始市場數據。
   */
  private initializeMarketData(): MarketData {
    return {
      fuelPrice: this.referenceFuelPrice, // 使用參考油價作為初始值
      hotelOccupancy: 75,
      flightDemand: 0.8,
      competitorPrices: [],
      seasonality: {
        current: 'shoulder',
        nextMonth: 'shoulder',
        seasonalMultiplier: 1.0
      }
    };
  }

  /**
   * 根據給定日期判斷所屬季節。
   * @param date 日期對象。
   * @returns 季節類型 (peak/shoulder/off)。
   */
  private determineSeason(date: Date): 'peak' | 'shoulder' | 'off' {
    const month = date.getMonth() + 1;
    
    // 旺季：1-2月（春節）、7-8月（暑假）、12月（聖誕跨年）
    if ([1, 2, 7, 8, 12].includes(month)) {
      return 'peak';
    }
    
    // 平季/中季：3-6月、9-11月
    if ([3, 4, 5, 6, 9, 10, 11].includes(month)) {
      return 'shoulder';
    }
    
    // 淡季 (如果沒有明確旺季和平季，則歸為淡季)
    return 'off'; 
  }

  /**
   * 判斷當前日期所屬的季節。
   * @returns 當前季節類型。
   */
  private determineCurrentSeason(): 'peak' | 'shoulder' | 'off' {
    return this.determineSeason(new Date());
  }

  /**
   * 判斷下一個月份所屬的季節。
   * @returns 下一個月份的季節類型。
   */
  private determineNextMonthSeason(): 'peak' | 'shoulder' | 'off' {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return this.determineSeason(nextMonth);
  }

  /**
   * 根據當前季節取得季節性乘數。
   * @returns 季節性成本乘數。
   */
  private getSeasonalMultiplier(): number {
    const season = this.determineCurrentSeason();
    switch (season) {
      case 'peak': return 1.3;
      case 'shoulder': return 1.0;
      case 'off': return 0.8;
      default: return 1.0;
    }
  }

  /**
   * 計算從今天到預訂日期的天數（提前預訂天數）。
   * @param bookingDate 預訂日期。
   * @returns 提前預訂的天數。
   */
  private calculateAdvanceDays(bookingDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 將時間部分歸零以確保日期比較準確
    bookingDate.setHours(0, 0, 0, 0); 

    const diffTime = bookingDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 計算成本預估的信心指數，基於市場數據的新鮮度。
   * @returns 信心指數 (0-1)。
   */
  private calculateConfidence(): number {
    const minutesSinceUpdate = (Date.now() - new Date(this.lastMarketUpdate).getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate < 60) return 0.95; // 1小時內更新
    if (minutesSinceUpdate < 180) return 0.85; // 3小時內更新
    if (minutesSinceUpdate < 360) return 0.75; // 6小時內更新
    return 0.65; // 超過6小時
  }

  /**
   * 模擬獲取團次數據。在實際應用中，應從資料庫或 Kintone API 獲取真實數據。
   * @param sessionId 團次 ID。
   * @returns 模擬的團次數據。
   */
  private async getSessionData(sessionId: string): Promise<MinimalSession> {
    return {
      id: sessionId,
      title: '模擬團次',
      customers: Array(20).fill(null).map((_, i) => ({ id: `customer_${i}`, name: `Customer ${i}` } as Customer)),
      duration: 3, // 假設 3 天
      bookingDate: new Date(new Date().setDate(new Date().getDate() + 15)) // 假設預訂日期是從今天起 15 天後
    };
  }

  /**
   * 預測未來指定日期的市場數據（簡易模型）。
   * @param date 預測日期。
   * @returns 預測的市場數據。
   */
  private predictMarketData(date: Date): MarketData {
    // 簡易預測：主要基於季節性，其他數據假設有輕微隨機波動
    const season = this.determineSeason(date);
    const seasonalMultiplier = this.getSeasonalMultiplier();
    
    return {
      ...this.marketData, // 複製當前市場數據作為基礎
      seasonality: {
        current: season,
        nextMonth: season, // 預測時簡化為下個月與當前預測月相同
        seasonalMultiplier
      },
      fuelPrice: this.marketData.fuelPrice * (1 + (Math.random() - 0.5) * 0.02), // ±1% 隨機波動
      hotelOccupancy: Math.min(95, Math.max(50, this.marketData.hotelOccupancy * (1 + (Math.random() - 0.5) * 0.05))) // ±2.5% 隨機波動，並設限
    };
  }

  /**
   * 預測單一未來日期的成本（簡易模型）。
   * @param date 預測日期。
   * @param numberOfPeople 人數。
   * @param duration 天數。
   * @param season 預測季節。
   * @param marketData 預測市場數據。
   * @returns 包含預測成本、信心指數和影響因子的對象。
   */
  private predictCostForDate(
    date: Date,
    numberOfPeople: number,
    duration: number,
    season: 'peak' | 'shoulder' | 'off',
    marketData: MarketData
  ): { cost: number; confidence: number; factors: string[] } {
    const factors = [];
    let predictedCost = 0;

    // 構建一個模擬的 context 用於成本計算
    const context: CalculationContext = {
      numberOfPeople,
      duration,
      season,
      advanceDays: this.calculateAdvanceDays(date),
      marketData: marketData,
      referenceFuelPrice: this.referenceFuelPrice,
    };

    // 1. 計算原始成本
    const { rawCost } = this.calculateRawCost(context);
    predictedCost = rawCost;
    factors.push('基礎成本');

    // 2. 應用附加費
    const surcharges = this.calculateSurcharges(predictedCost, context);
    predictedCost += surcharges.reduce((sum, s) => sum + s.amount, 0);
    if (surcharges.length > 0) factors.push('附加費');

    // 3. 應用折扣
    const discounts = this.calculateDiscounts(predictedCost, context);
    predictedCost += discounts.reduce((sum, d) => sum + d.amount, 0);
    if (discounts.length > 0) factors.push('折扣');

    // 4. 應用動態定價
    const { adjustedAmount } = this.applyDynamicPricing(predictedCost, context);
    predictedCost += adjustedAmount;
    if (adjustedAmount !== 0) factors.push('動態定價調整');

    // 簡單信心指數：越遠的日期信心越低
    const daysFromNow = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    let confidence = 0.95 - (daysFromNow * 0.005); // 每天減少 0.5% 信心
    confidence = Math.max(0.5, confidence); // 設定最低信心指數為 50%

    return {
      cost: Math.round(predictedCost),
      confidence: parseFloat(confidence.toFixed(2)),
      factors
    };
  }

  /**
   * 分析成本明細，按類別彙總金額。
   * @param result 成本計算結果。
   * @returns 按類別彙總的成本明細。
   */
  private analyzeCostBreakdown(result: CostCalculationResult): Record<string, number> {
    const breakdown: Record<string, number> = {};

    // 這裡我們直接將 rawCost 歸類為 'Base Costs'
    breakdown['Base Costs'] = (breakdown['Base Costs'] || 0) + result.rawCost;

    result.surcharges.forEach(surcharge => {
      breakdown[surcharge.category] = (breakdown[surcharge.category] || 0) + surcharge.amount;
    });

    result.discounts.forEach(discount => {
      breakdown[discount.category] = (breakdown[discount.category] || 0) + discount.amount;
    });

    result.dynamicAdjustments.forEach(adj => {
      breakdown[adj.category] = (breakdown[adj.category] || 0) + adj.amount;
    });

    return breakdown;
  }

  /**
   * 根據成本計算結果和會話信息，產生成本優化建議。
   * @param result 成本計算結果。
   * @param session 團次數據。
   * @returns 優化建議列表。
   */
  private generateOptimizationSuggestions(result: CostCalculationResult, session: MinimalSession): string[] {
    const suggestions = [];
    const { customers, duration, bookingDate } = session;
    const numberOfPeople = customers?.length || 1;
    const actualBookingDate = bookingDate || new Date();

    // 旺季附加費建議
    const peakSeasonSurcharge = result.surcharges.find(s => s.factorId === 'peak_season_surcharge');
    if (peakSeasonSurcharge && peakSeasonSurcharge.amount > 0) {
      suggestions.push('考慮調整出發時間避開旺季（例如避開1-2月、7-8月、12月），以減少旺季附加費。');
    }

    // 早鳥優惠建議
    const earlyBookingDiscount = result.discounts.find(d => d.factorId === 'early_booking_discount');
    if (!earlyBookingDiscount && this.calculateAdvanceDays(actualBookingDate) < 30) {
      suggestions.push('建議提早預訂（例如提前30天以上）以獲得早鳥優惠。');
    }

    // 團體優惠建議
    const groupDiscount = result.discounts.find(d => d.factorId === 'group_discount');
    const groupDiscountFactor = this.costFactors.get('group_discount');
    if (!groupDiscount && groupDiscountFactor?.conditions?.minPeople && numberOfPeople < groupDiscountFactor.conditions.minPeople) {
      suggestions.push(`考慮增加團員人數至 ${groupDiscountFactor.conditions.minPeople} 人以上，以獲得團體優惠。`);
    }

    // 人均成本高建議
    const costPerPerson = result.costPerPerson;
    if (costPerPerson > 5000) { // 假設一個任意高成本閾值
      suggestions.push('人均成本較高，建議審查行程中的高價活動或住宿選項，尋找替代方案或增加團員人數以攤平固定成本。');
    }

    // 油價附加費建議
    const fuelSurcharge = result.surcharges.find(s => s.factorId === 'fuel_surcharge');
    if (fuelSurcharge && fuelSurcharge.amount > 0 && this.marketData.fuelPrice > this.referenceFuelPrice * 1.1) {
      suggestions.push('當前油價較高，建議考慮優化交通路線或選擇更節能的交通工具，以降低燃油附加費影響。');
    }

    // 綠色旅遊建議
    suggestions.push('🌿 考慮升級為綠色行程：選擇電動巴士可減少約 52% 交通碳排放，並可申請環保交通補貼（-3%）。');
    suggestions.push('🌿 選擇綠色認證旅宿可降低住宿碳足跡約 58%，符合 GSTC 永續旅遊標準。');

    return suggestions;
  }

  /**
   * 識別潛在的成本風險因素。
   * @param result 成本計算結果。
   * @returns 風險因素列表。
   */
  private identifyRiskFactors(result: CostCalculationResult): string[] {
    const risks = [];

    // 數據新鮮度風險
    if (result.confidence < 0.8) {
      risks.push(`市場數據更新較舊 (更新於 ${this.lastMarketUpdate})，成本預估可能不準確 (信心指數: ${result.confidence.toFixed(2)})。`);
    }

    // 動態定價波動風險
    const significantDynamicAdjustments = result.appliedRules.filter(
        rule => Math.abs(rule.impact) > result.rawCost * 0.05 // 影響超過原始成本的5%
    );
    if (significantDynamicAdjustments.length > 0) {
      risks.push('多項動態定價規則生效並導致顯著調整，成本波動性較高，建議持續關注市場趨勢。');
    }

    // 季節性高成本風險
    if (result.appliedRules.some(rule => rule.ruleName.includes('旺季') && rule.impact > 0)) {
      risks.push('成本受旺季因素影響較大，未來若市場需求進一步提升，成本可能繼續上漲。');
    }

    // 燃油價格波動風險
    if (result.appliedRules.some(rule => rule.ruleName.includes('油價調整'))) {
      risks.push('油價波動已導致成本調整，若油價持續不穩，可能進一步影響成本。');
    }

    return risks;
  }
}

// 建立全域實例。
// 在 Kintone 環境中，此實例的創建可能在 Widget 的初始化邏輯中，
// 並且可以從 Kintone 記錄或插件配置中讀取 DynamicCostEngineConfig，以提供更靈活的配置。
export const dynamicCostEngine = new DynamicCostEngine();

export default DynamicCostEngine;