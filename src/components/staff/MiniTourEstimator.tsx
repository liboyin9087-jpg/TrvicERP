import React, { useState, useMemo } from 'react';
import { Calculator, Users, Calendar, MapPin, Plane, Hotel, Utensils, GripVertical } from 'lucide-react';

// --- Type Definitions ---
export type HotelLevel = 'standard' | 'business' | 'luxury';

export interface DestinationOption {
  value: string;
  label: string;
}

export interface EstimatorBaseRates {
  flight: number;
  hotel: Record<HotelLevel, number>;
  meal: number;
  transport: number;
  guide: number;
}

// --- Component Props Interface ---
export interface MiniTourEstimatorProps {
  /** Initial selected destination. */
  initialDestination?: string;
  /** Initial number of days for the tour. */
  initialDays?: number;
  /** Initial number of participants (pax). */
  initialPax?: number;
  /** Initial selected hotel level. */
  initialHotelLevel?: HotelLevel;
  /** List of available destinations for selection. */
  availableDestinations?: DestinationOption[];
  /** Base rates for various tour components. */
  baseRates?: EstimatorBaseRates;
  /** Optional class name for the outer container. */
  className?: string;
  /** Whether the component should display a drag handle (e.g., for Kintone widgets). */
  showDragHandle?: boolean;
}

// --- Default Static Data ---
const DEFAULT_DESTINATIONS: DestinationOption[] = [
  { value: '日本東京', label: '日本東京' },
  { value: '日本大阪', label: '日本大阪' },
  { value: '韓國首爾', label: '韓國首爾' },
  { value: '泰國曼谷', label: '泰國曼谷' },
  { value: '新加坡', label: '新加坡' },
];

const DEFAULT_BASE_RATES: EstimatorBaseRates = {
  flight: 15000,
  hotel: { standard: 2000, business: 3500, luxury: 6000 },
  meal: 800,
  transport: 500,
  guide: 150,
};

// --- Business Logic / Calculation Function ---
interface CalculationParams {
  days: number;
  pax: number;
  hotelLevel: HotelLevel;
  baseRates: EstimatorBaseRates;
}

function calculateTourCosts({ days, pax, hotelLevel, baseRates }: CalculationParams) {
  const flightCost = baseRates.flight; // Per person
  const hotelCost = baseRates.hotel[hotelLevel] * days; // Per person for 'days' nights
  const mealCost = baseRates.meal * days; // Per person for 'days' meals
  const transportCost = baseRates.transport * days; // Per person for 'days' transport
  const guideCost = baseRates.guide * days; // Per person for 'days' guide service

  const totalPerPerson = flightCost + hotelCost + mealCost + transportCost + guideCost;
  const totalGroup = totalPerPerson * pax;

  return { flightCost, hotelCost, mealCost, transportCost, guideCost, totalPerPerson, totalGroup };
}

// --- Main Component ---
export default function MiniTourEstimator({
  initialDestination = DEFAULT_DESTINATIONS[0].value,
  initialDays = 5,
  initialPax = 20,
  initialHotelLevel = 'business',
  availableDestinations = DEFAULT_DESTINATIONS,
  baseRates = DEFAULT_BASE_RATES,
  className = '',
  showDragHandle = true,
}: MiniTourEstimatorProps) {
  // Internal state for user inputs, initialized from props
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [pax, setPax] = useState(initialPax);
  const [hotelLevel, setHotelLevel] = useState<HotelLevel>(initialHotelLevel);

  // Memoize calculation results to avoid re-computation on every render
  const {
    flightCost,
    hotelCost,
    mealCost,
    transportCost,
    guideCost,
    totalPerPerson,
    totalGroup,
  } = useMemo(() => {
    return calculateTourCosts({ days, pax, hotelLevel, baseRates });
  }, [days, pax, hotelLevel, baseRates]);

  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
      {/* Card Header with Drag Handle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showDragHandle && (
            <div className="drag-handle cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">快速估價</h2>
            <p className="text-sm text-gray-500 mt-1">團體旅遊成本試算工具</p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form Section */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">輸入參數</h3>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">目的地</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800"
                >
                  {availableDestinations.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">天數</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="days"
                  type="number"
                  min={1}
                  max={14}
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pax" className="block text-sm font-medium text-gray-700 mb-2">人數</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="pax"
                  type="number"
                  min={1}
                  max={100}
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">住宿等級</label>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'business', 'luxury'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setHotelLevel(level)}
                    className={`py-2.5 rounded-md text-sm font-medium transition-colors ${
                      hotelLevel === level
                        ? 'bg-primary-600 text-white shadow'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {level === 'standard' ? '標準' : level === 'business' ? '商務' : '豪華'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Display Section */}
          <div className="bg-primary-800 text-white p-6 rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5" />
                <h3 className="font-semibold text-lg">估價結果</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-primary-700">
                  <span className="flex items-center gap-2 text-primary-200">
                    <Plane className="w-4 h-4" /> 機票
                  </span>
                  <span className="font-mono text-base font-medium">NT$ {flightCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-primary-700">
                  <span className="flex items-center gap-2 text-primary-200">
                    <Hotel className="w-4 h-4" /> 住宿 ({days}晚)
                  </span>
                  <span className="font-mono text-base font-medium">NT$ {hotelCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-primary-700">
                  <span className="flex items-center gap-2 text-primary-200">
                    <Utensils className="w-4 h-4" /> 餐食
                  </span>
                  <span className="font-mono text-base font-medium">NT$ {mealCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-primary-700">
                  <span className="text-primary-200">交通 + 導遊</span>
                  <span className="font-mono text-base font-medium">NT$ {(transportCost + guideCost).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-primary-100 font-medium">每人費用</span>
                <span className="text-2xl font-bold text-accent-300">
                  NT$ {totalPerPerson.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-100 font-medium">團體總價 ({pax}人)</span>
                <span className="text-3xl font-bold text-white">
                  NT$ {totalGroup.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-primary-200 text-center mt-auto">
              * 此為預估價格，實際報價以業務確認為準
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}