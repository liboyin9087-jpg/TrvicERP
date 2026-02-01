// src/services/carbonFootprintService.ts
/**
 * 碳足跡計算服務
 * Carbon Footprint Calculation Service for Green Tourism
 *
 * 根據交通方式、住宿類型、餐飲選擇與活動類型估算碳排放（kg CO₂e）
 */

// ============================================================
// Types
// ============================================================

export type TransportMode =
  | 'domestic_flight'
  | 'international_flight_economy'
  | 'international_flight_business'
  | 'car_gasoline'
  | 'car_electric'
  | 'tour_bus'
  | 'electric_bus'
  | 'hsr'          // 台灣高鐵
  | 'tra'          // 台鐵
  | 'metro'        // 捷運
  | 'public_bus'
  | 'bicycle'
  | 'walking'
  | 'ferry'
  | 'electric_scooter';

export type AccommodationType =
  | 'five_star'
  | 'four_star'
  | 'three_star'
  | 'budget_hotel'
  | 'green_certified'
  | 'eco_lodge'
  | 'camping';

export type MealType =
  | 'regular'
  | 'local_sourced'
  | 'vegetarian'
  | 'organic_farm';

export type ActivityType =
  | 'golf'
  | 'diving'
  | 'hot_spring'
  | 'hiking'
  | 'cycling'
  | 'cultural_experience'
  | 'eco_tour'
  | 'beach'
  | 'shopping'
  | 'museum';

export interface TransportSegment {
  mode: TransportMode;
  distanceKm: number;
  passengers?: number;  // defaults to 1
}

export interface AccommodationNight {
  type: AccommodationType;
  nights: number;
}

export interface MealEntry {
  type: MealType;
  count: number;
}

export interface ActivityEntry {
  type: ActivityType;
  count: number;
}

export interface CarbonFootprintInput {
  transport: TransportSegment[];
  accommodation: AccommodationNight[];
  meals: MealEntry[];
  activities: ActivityEntry[];
  numberOfPeople?: number;
}

export interface CarbonBreakdown {
  category: 'transport' | 'accommodation' | 'meals' | 'activities';
  label: string;
  emissionKg: number;
  percentage: number;
}

export interface GreenScoreBreakdown {
  transportScore: number;    // out of 30
  accommodationScore: number; // out of 20
  mealScore: number;         // out of 15
  activityScore: number;     // out of 20
  communityScore: number;    // out of 15
  total: number;             // out of 100
}

export interface CarbonFootprintResult {
  totalEmissionKg: number;
  perPersonEmissionKg: number;
  breakdown: CarbonBreakdown[];
  greenScore: GreenScoreBreakdown;
  comparisonWithConventional: {
    conventionalKg: number;
    reductionPercent: number;
  };
  offsetSuggestion: {
    treesNeeded: number;
    costTWD: number;
  };
}

// ============================================================
// Emission Factors (kg CO₂e)
// ============================================================

/** Transport emission factors: kg CO₂e per person per km */
const TRANSPORT_FACTORS: Record<TransportMode, number> = {
  domestic_flight: 0.255,
  international_flight_economy: 0.195,
  international_flight_business: 0.565,
  car_gasoline: 0.171,
  car_electric: 0.047,
  tour_bus: 0.027,
  electric_bus: 0.013,
  hsr: 0.015,
  tra: 0.024,
  metro: 0.008,
  public_bus: 0.089,
  bicycle: 0,
  walking: 0,
  ferry: 0.115,
  electric_scooter: 0.020,
};

/** Accommodation emission factors: kg CO₂e per person per night */
const ACCOMMODATION_FACTORS: Record<AccommodationType, number> = {
  five_star: 33.4,
  four_star: 20.6,
  three_star: 14.3,
  budget_hotel: 8.2,
  green_certified: 6.0,
  eco_lodge: 3.5,
  camping: 1.5,
};

/** Meal emission factors: kg CO₂e per meal */
const MEAL_FACTORS: Record<MealType, number> = {
  regular: 3.3,
  local_sourced: 2.1,
  vegetarian: 1.2,
  organic_farm: 0.9,
};

/** Activity emission factors: kg CO₂e per person per activity */
const ACTIVITY_FACTORS: Record<ActivityType, number> = {
  golf: 14.2,
  diving: 8.5,
  hot_spring: 2.3,
  hiking: 0.2,
  cycling: 0.1,
  cultural_experience: 0.5,
  eco_tour: 0.3,
  beach: 0.1,
  shopping: 1.0,
  museum: 0.4,
};

// ============================================================
// Labels (Traditional Chinese)
// ============================================================

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  domestic_flight: '國內航班',
  international_flight_economy: '國際航班（經濟艙）',
  international_flight_business: '國際航班（商務艙）',
  car_gasoline: '汽油自用車',
  car_electric: '電動自用車',
  tour_bus: '遊覽車',
  electric_bus: '電動巴士',
  hsr: '高鐵',
  tra: '台鐵',
  metro: '捷運/地鐵',
  public_bus: '公車',
  bicycle: '自行車',
  walking: '步行',
  ferry: '渡輪',
  electric_scooter: '電動機車',
};

export const ACCOMMODATION_LABELS: Record<AccommodationType, string> = {
  five_star: '五星級飯店',
  four_star: '四星級飯店',
  three_star: '三星級飯店',
  budget_hotel: '一般旅館',
  green_certified: '綠色認證旅宿',
  eco_lodge: '生態旅舍',
  camping: '露營',
};

export const MEAL_LABELS: Record<MealType, string> = {
  regular: '一般餐廳',
  local_sourced: '在地食材餐廳',
  vegetarian: '蔬食餐廳',
  organic_farm: '有機農場餐',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  golf: '高爾夫',
  diving: '潛水',
  hot_spring: '溫泉泡湯',
  hiking: '健行步道',
  cycling: '自行車漫遊',
  cultural_experience: '文化體驗',
  eco_tour: '生態導覽',
  beach: '海灘活動',
  shopping: '購物',
  museum: '博物館參觀',
};

// ============================================================
// Carbon Footprint Calculator
// ============================================================

export class CarbonFootprintCalculator {
  /**
   * Calculate total carbon footprint for a trip.
   */
  calculate(input: CarbonFootprintInput): CarbonFootprintResult {
    const numberOfPeople = input.numberOfPeople || 1;
    const breakdownItems: CarbonBreakdown[] = [];

    // Transport
    let transportTotal = 0;
    for (const segment of input.transport) {
      const factor = TRANSPORT_FACTORS[segment.mode] ?? 0;
      const emission = factor * segment.distanceKm * (segment.passengers || 1);
      transportTotal += emission;
    }
    breakdownItems.push({
      category: 'transport',
      label: '交通',
      emissionKg: transportTotal,
      percentage: 0, // calculated later
    });

    // Accommodation
    let accommodationTotal = 0;
    for (const stay of input.accommodation) {
      const factor = ACCOMMODATION_FACTORS[stay.type] ?? 0;
      accommodationTotal += factor * stay.nights * numberOfPeople;
    }
    breakdownItems.push({
      category: 'accommodation',
      label: '住宿',
      emissionKg: accommodationTotal,
      percentage: 0,
    });

    // Meals
    let mealsTotal = 0;
    for (const meal of input.meals) {
      const factor = MEAL_FACTORS[meal.type] ?? 0;
      mealsTotal += factor * meal.count * numberOfPeople;
    }
    breakdownItems.push({
      category: 'meals',
      label: '餐飲',
      emissionKg: mealsTotal,
      percentage: 0,
    });

    // Activities
    let activitiesTotal = 0;
    for (const activity of input.activities) {
      const factor = ACTIVITY_FACTORS[activity.type] ?? 0;
      activitiesTotal += factor * activity.count * numberOfPeople;
    }
    breakdownItems.push({
      category: 'activities',
      label: '活動',
      emissionKg: activitiesTotal,
      percentage: 0,
    });

    // Totals
    const totalEmissionKg = transportTotal + accommodationTotal + mealsTotal + activitiesTotal;

    // Calculate percentages
    for (const item of breakdownItems) {
      item.percentage = totalEmissionKg > 0
        ? Math.round((item.emissionKg / totalEmissionKg) * 100)
        : 0;
    }

    // Green Score
    const greenScore = this.calculateGreenScore(input);

    // Comparison with conventional trip
    const conventionalKg = this.estimateConventionalTrip(input, numberOfPeople);
    const reductionPercent = conventionalKg > 0
      ? Math.round(((conventionalKg - totalEmissionKg) / conventionalKg) * 100)
      : 0;

    // Carbon offset suggestion
    const treesNeeded = Math.ceil(totalEmissionKg / 15); // ~15 kg CO₂ per tree per year
    const costTWD = Math.round(totalEmissionKg * 0.5); // ~TWD 500/ton = TWD 0.5/kg

    return {
      totalEmissionKg: Math.round(totalEmissionKg * 10) / 10,
      perPersonEmissionKg: Math.round((totalEmissionKg / numberOfPeople) * 10) / 10,
      breakdown: breakdownItems,
      greenScore,
      comparisonWithConventional: {
        conventionalKg: Math.round(conventionalKg * 10) / 10,
        reductionPercent: Math.max(0, reductionPercent),
      },
      offsetSuggestion: {
        treesNeeded,
        costTWD,
      },
    };
  }

  /**
   * Calculate green score (0-100) based on trip composition.
   */
  private calculateGreenScore(input: CarbonFootprintInput): GreenScoreBreakdown {
    // Transport score (max 30)
    let transportScore = 30;
    const hasCarGasoline = input.transport.some(t => t.mode === 'car_gasoline');
    const hasFlight = input.transport.some(t => t.mode.includes('flight'));
    const hasGreenTransport = input.transport.some(t =>
      ['bicycle', 'walking', 'electric_bus', 'hsr', 'metro', 'electric_scooter'].includes(t.mode)
    );
    if (hasFlight) transportScore -= 15;
    if (hasCarGasoline) transportScore -= 10;
    if (!hasGreenTransport) transportScore -= 5;

    // Accommodation score (max 20)
    let accommodationScore = 20;
    const hasGreenStay = input.accommodation.some(a =>
      ['green_certified', 'eco_lodge', 'camping'].includes(a.type)
    );
    const hasLuxury = input.accommodation.some(a => a.type === 'five_star');
    if (!hasGreenStay) accommodationScore -= 10;
    if (hasLuxury) accommodationScore -= 5;

    // Meal score (max 15)
    let mealScore = 15;
    const hasOrganic = input.meals.some(m => m.type === 'organic_farm');
    const hasLocal = input.meals.some(m => m.type === 'local_sourced');
    const allRegular = input.meals.every(m => m.type === 'regular');
    if (allRegular) mealScore -= 10;
    if (!hasOrganic && !hasLocal) mealScore -= 5;

    // Activity score (max 20)
    let activityScore = 20;
    const hasEcoActivity = input.activities.some(a =>
      ['hiking', 'cycling', 'cultural_experience', 'eco_tour'].includes(a.type)
    );
    const hasHighImpact = input.activities.some(a =>
      ['golf', 'diving'].includes(a.type)
    );
    if (!hasEcoActivity) activityScore -= 10;
    if (hasHighImpact) activityScore -= 5;

    // Community score (max 15) - based on local/organic meal and cultural activities
    let communityScore = 15;
    const hasCulture = input.activities.some(a => a.type === 'cultural_experience');
    if (!hasCulture) communityScore -= 5;
    if (!hasLocal && !hasOrganic) communityScore -= 5;
    if (allRegular && !hasCulture) communityScore -= 5;

    // Clamp all scores
    transportScore = Math.max(0, transportScore);
    accommodationScore = Math.max(0, accommodationScore);
    mealScore = Math.max(0, mealScore);
    activityScore = Math.max(0, activityScore);
    communityScore = Math.max(0, communityScore);

    return {
      transportScore,
      accommodationScore,
      mealScore,
      activityScore,
      communityScore,
      total: transportScore + accommodationScore + mealScore + activityScore + communityScore,
    };
  }

  /**
   * Estimate conventional trip emissions for comparison.
   * Uses "worst-case" transport and standard hotels/meals.
   */
  private estimateConventionalTrip(input: CarbonFootprintInput, numberOfPeople: number): number {
    // Conventional transport: assume car_gasoline for same distances
    let conventionalTransport = 0;
    for (const segment of input.transport) {
      const factor = segment.mode.includes('flight')
        ? TRANSPORT_FACTORS[segment.mode]
        : TRANSPORT_FACTORS.car_gasoline;
      conventionalTransport += factor * segment.distanceKm * (segment.passengers || 1);
    }

    // Conventional accommodation: assume three_star hotel
    let conventionalAccommodation = 0;
    for (const stay of input.accommodation) {
      conventionalAccommodation += ACCOMMODATION_FACTORS.three_star * stay.nights * numberOfPeople;
    }

    // Conventional meals: assume regular
    let conventionalMeals = 0;
    for (const meal of input.meals) {
      conventionalMeals += MEAL_FACTORS.regular * meal.count * numberOfPeople;
    }

    // Conventional activities: assume same but with shopping replacing eco
    let conventionalActivities = 0;
    for (const activity of input.activities) {
      conventionalActivities += (ACTIVITY_FACTORS[activity.type] ?? ACTIVITY_FACTORS.shopping) * activity.count * numberOfPeople;
    }

    return conventionalTransport + conventionalAccommodation + conventionalMeals + conventionalActivities;
  }
}

// Singleton export
export const carbonFootprintCalculator = new CarbonFootprintCalculator();
