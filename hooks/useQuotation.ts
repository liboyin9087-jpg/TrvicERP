
import { useMemo } from 'react';
import { MiniQuoteItem } from '../types';

export const useQuotationCalculator = (items: MiniQuoteItem[], paxCount: number, marginPercent: number) => {
  const result = useMemo(() => {
    // 1. Calculate Total Cost
    const totalCost = items.reduce((sum, item) => {
      if (item.cost_type === 'fixed') return sum + Number(item.amount);
      if (item.cost_type === 'per_pax') return sum + (Number(item.amount) * paxCount);
      return sum;
    }, 0);

    // 2. Calculate Cost Per Pax
    const costPerPax = paxCount > 0 ? totalCost / paxCount : 0;

    // 3. Add Margin (Price = Cost / (1 - Margin%))
    // Example: Cost 85, Margin 15% -> Price 100
    const marginDecimal = marginPercent / 100;
    const sellingPricePerPax = marginPercent < 100 
      ? costPerPax / (1 - marginDecimal) 
      : 0;

    // 4. Calculate Total Profit
    // Total Revenue = Selling Price * Pax
    // Total Profit = Total Revenue - Total Cost
    const finalPrice = Math.ceil(sellingPricePerPax);
    const totalRevenue = finalPrice * paxCount;
    const totalProfit = totalRevenue - totalCost;

    return {
      totalCost,
      costPerPax,
      sellingPricePerPax: finalPrice,
      totalProfit,
      totalRevenue
    };
  }, [items, paxCount, marginPercent]);

  return result;
};
