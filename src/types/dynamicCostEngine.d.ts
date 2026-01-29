/**
 * Dynamic Cost Engine Type Definitions
 */

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
