/**
 * Dynamic Cost Engine Type Definitions
 */

import type { Customer } from '../core/types';

export interface CostItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  quantity: number;
  unit?: string;
}

export interface CostCalculation {
  subtotal: number;
  tax: number;
  total: number;
  items: CostItem[];
}

export interface PricingRule {
  id: string;
  name: string;
  condition: (item: CostItem) => boolean;
  adjustment: (price: number) => number;
}

export interface CostEngineConfig {
  taxRate?: number;
  currency?: string;
  rules?: PricingRule[];
}

export interface CostEngine {
  calculate: (items: CostItem[], config?: CostEngineConfig) => CostCalculation;
  addRule: (rule: PricingRule) => void;
  removeRule: (ruleId: string) => void;
}

/**
 * Cost Factor for dynamic pricing calculations
 */
export interface CostFactor {
  id: string;
  name: string;
  type: 'fixed' | 'percentage' | 'per_day' | 'per_person';
  value: number;
  unit: string;
  category: string;
  conditions?: Record<string, unknown>;
  isActive: boolean;
  effectiveDate: string;
}

/**
 * Dynamic Pricing Rule trigger configuration
 */
export interface PricingTrigger {
  type: 'competitor' | 'season' | 'demand';
  condition: string;
  threshold: number;
}

/**
 * Dynamic Pricing Rule action configuration
 */
export interface PricingAction {
  type: 'increase' | 'decrease' | 'multiply';
  value: number;
  maxAdjustment: number;
}

/**
 * Dynamic Pricing Rule
 */
export interface DynamicPricingRule {
  id: string;
  name: string;
  trigger: PricingTrigger;
  action: PricingAction;
  priority: number;
  isActive: boolean;
}

/**
 * Cost Breakdown for detailed cost reporting
 */
export interface CostBreakdown {
  category: string;
  name: string;
  amount: number;
  unit: string;
  quantity: number;
  description?: string;
}

/**
 * Applied Rule record for tracking which rules affected pricing
 */
export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  adjustmentAmount: number;
  reason: string;
}

/**
 * Market Data for dynamic pricing calculations
 */
export interface MarketData {
  fuelPrice: number;
  hotelOccupancy: number;
  competitorPrices: Record<string, number>;
  demandIndex: number;
  lastUpdated: string;
}

/**
 * Cost Calculation Result
 */
export interface CostCalculationResult {
  rawCost: number;
  surcharges: CostBreakdown[];
  discounts: CostBreakdown[];
  dynamicAdjustments: CostBreakdown[];
  totalCost: number;
  costPerPerson: number;
  appliedRules: AppliedRule[];
  lastUpdated: string;
  confidence: number;
}

/**
 * Dynamic Cost Engine Configuration
 */
export interface DynamicCostEngineConfig {
  defaultCostFactors?: CostFactor[];
  dynamicPricingRules?: DynamicPricingRule[];
  initialMarketData?: MarketData;
  referenceFuelPrice?: number;
}

/**
 * Minimal Session data required for cost calculations
 */
export interface MinimalSession {
  customers?: Customer[];
  duration: number;
  bookingDate?: Date;
}
