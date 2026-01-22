/**
 * 動態成本計算引擎
 * Dynamic Cost Calculation Engine
 */

import type { Session, Customer, Quotation } from '../core/types';

/**
 * 成本計算因子
 */
interface CostFactor {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'per_person' | 'per_day' | 'dynamic';
  value: number;
  unit?: string;
  category: 'transport' | 'accommodation' | 'meal' | 'activity' | 'insurance' | 'surcharge' | 'discount';
  conditions?: {
    minPeople?: number;
    maxPeople?: number;
    season?: 'peak' | 'shoulder' | 'off';
    weekdays?: boolean;
    advanceBooking?: number; // 提前預訂天數
  };
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
}

/**
 * 動態定價規則
 */
interface DynamicPricingRule {
  id: string;
  name: string;
  trigger: {
    type: 'demand' | 'season' | 'competitor' | 'inventory' | 'time';
    condition: string;
    threshold: number;
  };
  action: {
    type: 'increase' | 'decrease' | 'multiply';
    value: number;
    maxAdjustment?: number;
  };
  priority: number;
  isActive: boolean;
}

/**
 * 成本計算結果
 */
interface CostCalculationResult {
  baseCost: number;
  additionalCosts: CostBreakdown[];
  surcharges: CostBreakdown[];
  discounts: CostBreakdown[];
  totalCost: number;
  costPerPerson: number;
  appliedRules: AppliedRule[];
  lastUpdated: string;
  confidence: number;
}

/**
 * 成本明細
 */
interface CostBreakdown {
  category: string;
  name: string;
  amount: number;
  unit: string;
  quantity: number;
  description: string;
}

/**
 * 已應用規則
 */
interface AppliedRule {
  ruleId: string;
  ruleName: string;
  impact: number;
  reason: string;
}

/**
 * 市場數據
 */
interface MarketData {
  fuelPrice: number;        // 油價 (元/公升)
  hotelOccupancy: number;   // 飯店住房率 (%)
  flightDemand: number;     // 航班需求指數
  competitorPrices: Array<{
    competitor: string;
    route: string;
    price: number;
    lastUpdated: string;
  }>;
  seasonality: {
    current: 'peak' | 'shoulder' | 'off';
    nextMonth: 'peak' | 'shoulder' | 'off';
    seasonalMultiplier: number;
  };
}

/**
 * 預設成本因子
 */
const DEFAULT_COST_FACTORS: CostFactor[] = [
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
    value: 15,
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
    value: 30,
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
  
  // 折扣
  {
    id: 'early_booking_discount',
    name: '早鳥優惠',
    type: 'percentage',
    value: -10,
    unit: '%',
    category: 'discount',
    conditions: { advanceBooking: 30 },
    isActive: true,
    effectiveDate: '2024-01-01'
  },
  {
    id: 'group_discount',
    name: '團體優惠',
    type: 'percentage',
    value: -5,
    unit: '%',
    category: 'discount',
    conditions: { minPeople: 30 },
    isActive: true,
    effectiveDate: '2024-01-01'
  }
];

/**
 * 動態定價規則
 */
const DYNAMIC_PRICING_RULES: DynamicPricingRule[] = [
  {
    id: 'fuel_price_adjustment',
    name: '油價調整',
    trigger: {
      type: 'competitor',
      condition: 'fuel_price_change',
      threshold: 5 // 油價變動超過5%
    },
    action: {
      type: 'increase',
      value: 3,
      maxAdjustment: 10
    },
    priority: 1,
    isActive: true
  },
  {
    id: 'peak_season_pricing',
    name: '旺季定價',
    trigger: {
      type: 'season',
      condition: 'peak_season',
      threshold: 0.8 // 住房率超過80%
    },
    action: {
      type: 'multiply',
      value: 1.2,
      maxAdjustment: 25
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
      threshold: 30 // 預訂率低於30%
    },
    action: {
      type: 'decrease',
      value: 8,
      maxAdjustment: 15
    },
    priority: 3,
    isActive: true
  }
];

/**
 * 動態成本計算引擎類別
 */
export class DynamicCostEngine {
  private costFactors: Map<string, CostFactor> = new Map();
  private pricingRules: Map<string, DynamicPricingRule> = new Map();
  private marketData: MarketData;
  private lastMarketUpdate: string;

  constructor() {
    // 初始化成本因子
    DEFAULT_COST_FACTORS.forEach(factor => {
      this.costFactors.set(factor.id, factor);
    });

    // 初始化定價規則
    DYNAMIC_PRICING_RULES.forEach(rule => {
      this.pricingRules.set(rule.id, rule);
    });

    // 初始化市場數據
    this.marketData = this.initializeMarketData();
    this.lastMarketUpdate = new Date().toISOString();
  }

  /**
   * 計算動態成本
   */
  async calculateDynamicCost(
    sessionId: string,
    numberOfPeople: number,
    duration: number,
    bookingDate: Date,
    customFactors?: Partial<CostFactor>[]
  ): Promise<CostCalculationResult> {
    // 更新市場數據
    await this.updateMarketData();

    const session = await this.getSessionData(sessionId);
    const season = this.determineSeason(bookingDate);
    const advanceDays = this.calculateAdvanceDays(bookingDate);

    // 計算基礎成本
    const baseCost = this.calculateBaseCost(numberOfPeople, duration, session);

    // 計算附加成本
    const additionalCosts = this.calculateAdditionalCosts(
      numberOfPeople, 
      duration, 
      season, 
      advanceDays,
      customFactors
    );

    // 計算附加費
    const surcharges = this.calculateSurcharges(
      baseCost + additionalCosts.reduce((sum, cost) => sum + cost.amount, 0),
      numberOfPeople,
      season
    );

    // 計算折扣
    const discounts = this.calculateDiscounts(
      baseCost + additionalCosts.reduce((sum, cost) => sum + cost.amount, 0),
      numberOfPeople,
      advanceDays
    );

    // 應用動態定價規則
    const { adjustedCost, appliedRules } = this.applyDynamicPricing(
      baseCost,
      numberOfPeople,
      season,
      advanceDays
    );

    // 計算總成本
    const totalCost = baseCost + 
      additionalCosts.reduce((sum, cost) => sum + cost.amount, 0) +
      surcharges.reduce((sum, surcharge) => sum + surcharge.amount, 0) +
      discounts.reduce((sum, discount) => sum + discount.amount, 0) +
      adjustedCost;

    return {
      baseCost,
      additionalCosts,
      surcharges,
      discounts,
      totalCost,
      costPerPerson: totalCost / numberOfPeople,
      appliedRules,
      lastUpdated: new Date().toISOString(),
      confidence: this.calculateConfidence()
    };
  }

  /**
   * 更新成本因子
   */
  updateCostFactor(factor: CostFactor): void {
    this.costFactors.set(factor.id, factor);
  }

  /**
   * 新增動態定價規則
   */
  addPricingRule(rule: DynamicPricingRule): void {
    this.pricingRules.set(rule.id, rule);
  }

  /**
   * 取得即時市場數據
   */
  async getRealTimeMarketData(): Promise<MarketData> {
    await this.updateMarketData();
    return { ...this.marketData };
  }

  /**
   * 預測成本趨勢
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
      const predictedMarketData = this.predictMarketData(futureDate);
      
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
   * 產生成本分析報告
   */
  async generateCostAnalysis(sessionId: string): Promise<{
    currentCost: CostCalculationResult;
    costBreakdown: Record<string, number>;
    optimizationSuggestions: string[];
    riskFactors: string[];
  }> {
    const session = await this.getSessionData(sessionId);
    const numberOfPeople = session.customers?.length || 20;
    const duration = this.calculateSessionDuration(session);
    
    const currentCost = await this.calculateDynamicCost(
      sessionId,
      numberOfPeople,
      duration,
      new Date()
    );

    const costBreakdown = this.analyzeCostBreakdown(currentCost);
    const optimizationSuggestions = this.generateOptimizationSuggestions(currentCost);
    const riskFactors = this.identifyRiskFactors(currentCost);

    return {
      currentCost,
      costBreakdown,
      optimizationSuggestions,
      riskFactors
    };
  }

  // 私有方法

  private async updateMarketData(): Promise<void> {
    // 模擬從外部API獲取市場數據
    // 在實際應用中，這裡會調用真實的API
    this.marketData = {
      fuelPrice: 28.5 + Math.random() * 2, // 28.5-30.5 元/公升
      hotelOccupancy: 65 + Math.random() * 25, // 65-90%
      flightDemand: 0.7 + Math.random() * 0.3, // 0.7-1.0
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

  private initializeMarketData(): MarketData {
    return {
      fuelPrice: 29.5,
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

  private determineSeason(date: Date): 'peak' | 'shoulder' | 'off' {
    const month = date.getMonth() + 1;
    
    // 旺季：1-2月（春節）、7-8月（暑假）、12月（聖誕跨年）
    if ([1, 2, 7, 8, 12].includes(month)) {
      return 'peak';
    }
    
    // 平季：3-6月、9-11月
    if ([3, 4, 5, 6, 9, 10, 11].includes(month)) {
      return 'shoulder';
    }
    
    return 'off';
  }

  private determineCurrentSeason(): 'peak' | 'shoulder' | 'off' {
    return this.determineSeason(new Date());
  }

  private determineNextMonthSeason(): 'peak' | 'shoulder' | 'off' {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return this.determineSeason(nextMonth);
  }

  private getSeasonalMultiplier(): number {
    const season = this.determineCurrentSeason();
    switch (season) {
      case 'peak': return 1.3;
      case 'shoulder': return 1.0;
      case 'off': return 0.8;
      default: return 1.0;
    }
  }

  private calculateAdvanceDays(bookingDate: Date): number {
    const today = new Date();
    const diffTime = bookingDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateBaseCost(numberOfPeople: number, duration: number, session: any): number {
    let baseCost = 0;

    // 基礎交通成本
    const transportFactor = this.costFactors.get('base_bus_cost');
    if (transportFactor && transportFactor.isActive) {
      baseCost += transportFactor.value * duration;
    }

    // 司機費用
    const driverFactor = this.costFactors.get('driver_fee');
    if (driverFactor && driverFactor.isActive) {
      baseCost += driverFactor.value * duration;
    }

    return baseCost;
  }

  private calculateAdditionalCosts(
    numberOfPeople: number,
    duration: number,
    season: 'peak' | 'shoulder' | 'off',
    advanceDays: number,
    customFactors?: Partial<CostFactor>[]
  ): CostBreakdown[] {
    const costs: CostBreakdown[] = [];

    // 住宿成本
    const hotelFactor = this.costFactors.get('hotel_base_rate');
    if (hotelFactor && hotelFactor.isActive) {
      costs.push({
        category: 'accommodation',
        name: '住宿費用',
        amount: hotelFactor.value * numberOfPeople * (duration - 1), // 假設最後一天不住宿
        unit: '元',
        quantity: numberOfPeople * (duration - 1),
        description: `${hotelFactor.name} (${hotelFactor.value}元/人/晚)`
      });
    }

    // 餐飲成本
    const mealFactors = ['meal_breakfast', 'meal_lunch', 'meal_dinner'];
    mealFactors.forEach(factorId => {
      const factor = this.costFactors.get(factorId);
      if (factor && factor.isActive) {
        costs.push({
          category: 'meal',
          name: factor.name,
          amount: factor.value * numberOfPeople * duration,
          unit: '元',
          quantity: numberOfPeople * duration,
          description: `${factor.name} (${factor.value}元/人)`
        });
      }
    });

    // 活動成本
    const activityFactor = this.costFactors.get('activity_base');
    if (activityFactor && activityFactor.isActive) {
      costs.push({
        category: 'activity',
        name: '活動費用',
        amount: activityFactor.value * numberOfPeople,
        unit: '元',
        quantity: numberOfPeople,
        description: `${activityFactor.name} (${activityFactor.value}元/人)`
      });
    }

    // 保險成本
    const insuranceFactor = this.costFactors.get('insurance_base');
    if (insuranceFactor && insuranceFactor.isActive) {
      costs.push({
        category: 'insurance',
        name: '旅遊保險',
        amount: insuranceFactor.value * numberOfPeople,
        unit: '元',
        quantity: numberOfPeople,
        description: `${insuranceFactor.name} (${insuranceFactor.value}元/人)`
      });
    }

    // 自定義因子
    if (customFactors) {
      customFactors.forEach(customFactor => {
        if (customFactor.isActive !== false) {
          costs.push({
            category: customFactor.category || 'custom',
            name: customFactor.name || '自定義費用',
            amount: this.calculateFactorAmount(customFactor, numberOfPeople, duration),
            unit: customFactor.unit || '元',
            quantity: numberOfPeople,
            description: customFactor.name || '自定義費用'
          });
        }
      });
    }

    return costs;
  }

  private calculateSurcharges(
    baseCost: number,
    numberOfPeople: number,
    season: 'peak' | 'shoulder' | 'off'
  ): CostBreakdown[] {
    const surcharges: CostBreakdown[] = [];

    // 燃油附加費
    const fuelFactor = this.costFactors.get('fuel_surcharge');
    if (fuelFactor && fuelFactor.isActive && 
        (!fuelFactor.conditions?.minPeople || numberOfPeople >= fuelFactor.conditions.minPeople)) {
      const amount = (baseCost * fuelFactor.value) / 100;
      surcharges.push({
        category: 'surcharge',
        name: fuelFactor.name,
        amount,
        unit: '元',
        quantity: 1,
        description: `${fuelFactor.name} (${fuelFactor.value}%)`
      });
    }

    // 旺季附加費
    if (season === 'peak') {
      const peakFactor = this.costFactors.get('peak_season_surcharge');
      if (peakFactor && peakFactor.isActive) {
        const amount = (baseCost * peakFactor.value) / 100;
        surcharges.push({
          category: 'surcharge',
          name: peakFactor.name,
          amount,
          unit: '元',
          quantity: 1,
          description: `${peakFactor.name} (${peakFactor.value}%)`
        });
      }
    }

    return surcharges;
  }

  private calculateDiscounts(
    baseCost: number,
    numberOfPeople: number,
    advanceDays: number
  ): CostBreakdown[] {
    const discounts: CostBreakdown[] = [];

    // 早鳥優惠
    const earlyBookingFactor = this.costFactors.get('early_booking_discount');
    if (earlyBookingFactor && earlyBookingFactor.isActive && 
        (!earlyBookingFactor.conditions?.advanceBooking || advanceDays >= earlyBookingFactor.conditions.advanceBooking)) {
      const amount = (baseCost * earlyBookingFactor.value) / 100; // 負值表示折扣
      discounts.push({
        category: 'discount',
        name: earlyBookingFactor.name,
        amount,
        unit: '元',
        quantity: 1,
        description: `${earlyBookingFactor.name} (${Math.abs(earlyBookingFactor.value)}%)`
      });
    }

    // 團體優惠
    const groupFactor = this.costFactors.get('group_discount');
    if (groupFactor && groupFactor.isActive && 
        (!groupFactor.conditions?.minPeople || numberOfPeople >= groupFactor.conditions.minPeople)) {
      const amount = (baseCost * groupFactor.value) / 100; // 負值表示折扣
      discounts.push({
        category: 'discount',
        name: groupFactor.name,
        amount,
        unit: '元',
        quantity: 1,
        description: `${groupFactor.name} (${Math.abs(groupFactor.value)}%)`
      });
    }

    return discounts;
  }

  private applyDynamicPricing(
    baseCost: number,
    numberOfPeople: number,
    season: 'peak' | 'shoulder' | 'off',
    advanceDays: number
  ): { adjustedCost: number; appliedRules: AppliedRule[] } {
    let adjustedCost = 0;
    const appliedRules: AppliedRule[] = [];

    // 按優先級排序規則
    const sortedRules = Array.from(this.pricingRules.values())
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.shouldApplyRule(rule, numberOfPeople, season, advanceDays)) {
        const adjustment = this.calculateRuleAdjustment(rule, baseCost);
        adjustedCost += adjustment;
        
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          impact: adjustment,
          reason: this.getRuleApplicationReason(rule)
        });
      }
    }

    return { adjustedCost, appliedRules };
  }

  private shouldApplyRule(
    rule: DynamicPricingRule,
    numberOfPeople: number,
    season: 'peak' | 'shoulder' | 'off',
    advanceDays: number
  ): boolean {
    switch (rule.trigger.type) {
      case 'season':
        return season === 'peak' && this.marketData.hotelOccupancy > rule.trigger.threshold;
      case 'demand':
        return this.marketData.hotelOccupancy < rule.trigger.threshold;
      case 'competitor':
        return Math.abs(this.marketData.fuelPrice - 29.5) > (rule.trigger.threshold / 100 * 29.5);
      default:
        return false;
    }
  }

  private calculateRuleAdjustment(rule: DynamicPricingRule, baseCost: number): number {
    let adjustment = 0;

    switch (rule.action.type) {
      case 'increase':
        adjustment = (baseCost * rule.action.value) / 100;
        break;
      case 'decrease':
        adjustment = -(baseCost * rule.action.value) / 100;
        break;
      case 'multiply':
        adjustment = baseCost * (rule.action.value - 1);
        break;
    }

    // 應用最大調整限制
    if (rule.action.maxAdjustment) {
      const maxAdjustment = (baseCost * rule.action.maxAdjustment) / 100;
      adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));
    }

    return adjustment;
  }

  private getRuleApplicationReason(rule: DynamicPricingRule): string {
    switch (rule.trigger.type) {
      case 'season':
        return `旺季住房率達 ${Math.round(this.marketData.hotelOccupancy)}%`;
      case 'demand':
        return `當前需求較低，住房率僅 ${Math.round(this.marketData.hotelOccupancy)}%`;
      case 'competitor':
        return `油價波動超過 ${rule.trigger.threshold}%`;
      default:
        return '市場條件變動';
    }
  }

  private calculateConfidence(): number {
    // 基於市場數據新鮮度計算信心指數
    const minutesSinceUpdate = (Date.now() - new Date(this.lastMarketUpdate).getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate < 60) return 0.95;
    if (minutesSinceUpdate < 180) return 0.85;
    if (minutesSinceUpdate < 360) return 0.75;
    return 0.65;
  }

  private async getSessionData(sessionId: string): Promise<any> {
    // 模擬獲取團次數據
    // 在實際應用中，這裡會調用API獲取真實數據
    return {
      id: sessionId,
      title: '模擬團次',
      customers: Array(20).fill(null).map((_, i) => ({ id: `customer_${i}` })),
      duration: 3
    };
  }

  private calculateSessionDuration(session: any): number {
    return session.duration || 3;
  }

  private calculateFactorAmount(factor: Partial<CostFactor>, numberOfPeople: number, duration: number): number {
    const value = factor.value || 0;
    
    switch (factor.type) {
      case 'fixed':
        return value;
      case 'percentage':
        return value; // 需要基礎成本來計算
      case 'per_person':
        return value * numberOfPeople;
      case 'per_day':
        return value * duration;
      case 'dynamic':
        return value * numberOfPeople * duration;
      default:
        return value;
    }
  }

  private predictMarketData(date: Date): MarketData {
    // 簡單的市場數據預測
    const season = this.determineSeason(date);
    const seasonalMultiplier = this.getSeasonalMultiplier();
    
    return {
      ...this.marketData,
      seasonality: {
        current: season,
        nextMonth: season,
        seasonalMultiplier
      }
    };
  }

  private predictCostForDate(
    date: Date,
    numberOfPeople: number,
    duration: number,
    season: 'peak' | 'shoulder' | 'off',
    marketData: MarketData
  ): { cost: number; confidence: number; factors: string[] } {
    const factors = [];
    let cost = 0;

    // 基礎成本預測
    const baseCost = this.calculateBaseCost(numberOfPeople, duration, null);
    cost += baseCost;
    factors.push('基礎成本');

    // 季節性調整
    if (season === 'peak') {
      cost *= 1.3;
      factors.push('旺季加價');
    } else if (season === 'off') {
      cost *= 0.85;
      factors.push('淡季折扣');
    }

    // 市場需求調整
    if (marketData.hotelOccupancy > 85) {
      cost *= 1.1;
      factors.push('高需求調整');
    }

    return {
      cost: Math.round(cost),
      confidence: 0.75,
      factors
    };
  }

  private analyzeCostBreakdown(result: CostCalculationResult): Record<string, number> {
    const breakdown: Record<string, number> = {};

    result.additionalCosts.forEach(cost => {
      breakdown[cost.category] = (breakdown[cost.category] || 0) + cost.amount;
    });

    result.surcharges.forEach(surcharge => {
      breakdown[surcharge.category] = (breakdown[surcharge.category] || 0) + surcharge.amount;
    });

    result.discounts.forEach(discount => {
      breakdown[discount.category] = (breakdown[discount.category] || 0) + discount.amount;
    });

    return breakdown;
  }

  private generateOptimizationSuggestions(result: CostCalculationResult): string[] {
    const suggestions = [];

    if (result.surcharges.length > 2) {
      suggestions.push('考慮調整出發時間以減少旺季附加費');
    }

    if (result.discounts.length === 0) {
      suggestions.push('建議提前預訂以獲得早鳥優惠');
    }

    const costPerPerson = result.costPerPerson;
    if (costPerPerson > 5000) {
      suggestions.push('人均成本較高，考慮優化行程或增加團員人數');
    }

    return suggestions;
  }

  private identifyRiskFactors(result: CostCalculationResult): string[] {
    const risks = [];

    if (result.confidence < 0.8) {
      risks.push('市場數據更新較舊，成本預估可能不準確');
    }

    if (result.appliedRules.length > 3) {
      risks.push('多項動態定價規則生效，成本波動性較高');
    }

    return risks;
  }
}

// 建立全域實例
export const dynamicCostEngine = new DynamicCostEngine();

export default DynamicCostEngine;
