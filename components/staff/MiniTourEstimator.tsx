import React, { useState, useMemo, memo } from 'react';
import { Calculator, Users, Calendar, MapPin, Plane, Hotel, Utensils } from 'lucide-react';

interface BaseRates {
  flight: number;
  hotel: {
    standard: number;
    business: number;
    luxury: number;
  };
  meal: number;
  transport: number;
  guide: number;
}

interface MiniTourEstimatorProps {
  initialDestination?: string;
  initialDays?: number;
  initialPax?: number;
  initialHotelLevel?: 'standard' | 'business' | 'luxury';
}

const MiniTourEstimator: React.FC<MiniTourEstimatorProps> = memo(({
  initialDestination = '日本東京',
  initialDays = 5,
  initialPax = 20,
  initialHotelLevel = 'business',
}) => {
  const [destination, setDestination] = useState(initialDestination);
  const [days, setDays] = useState(initialDays);
  const [pax, setPax] = useState(initialPax);
  const [hotelLevel, setHotelLevel] = useState<'standard' | 'business' | 'luxury'>(initialHotelLevel);

  const baseRates: BaseRates = {
    flight: 15000,
    hotel: { standard: 2000, business: 3500, luxury: 6000 },
    meal: 800,
    transport: 500,
    guide: 150,
  };

  const { flightCost, hotelCost, mealCost, transportCost, guideCost, totalPerPerson, totalGroup } = useMemo(() => {
    const flightCost = baseRates.flight;
    const hotelCost = baseRates.hotel[hotelLevel] * days;
    const mealCost = baseRates.meal * days;
    const transportCost = baseRates.transport * days;
    const guideCost = (baseRates.guide * days * pax) / pax;
    const totalPerPerson = flightCost + hotelCost + mealCost + transportCost + guideCost;
    const totalGroup = totalPerPerson * pax;

    return { flightCost, hotelCost, mealCost, transportCost, guideCost, totalPerPerson, totalGroup };
  }, [hotelLevel, days, pax]);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestination(e.target.value);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDays(parseInt(e.target.value) || 1);
  };

  const handlePaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPax(parseInt(e.target.value) || 1);
  };

  const handleHotelLevelChange = (level: 'standard' | 'business' | 'luxury') => {
    setHotelLevel(level);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in" role="region" aria-label="快速估價工具">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">快速估價</h2>
        <p className="text-gray-500 mt-1">團體旅遊成本試算工具</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-5">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">目的地</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="destination"
                value={destination}
                onChange={handleDestinationChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-black"
                aria-label="選擇旅遊目的地"
              >
                <option value="日本東京">日本東京</option>
                <option value="日本大阪">日本大阪</option>
                <option value="韓國首爾">韓國首爾</option>
                <option value="泰國曼谷">泰國曼谷</option>
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
                onChange={handleDaysChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                aria-label="輸入旅遊天數"
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
                onChange={handlePaxChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                aria-label="輸入旅遊人數"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">住宿等級</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="選擇住宿等級">
              {(['standard', 'business', 'luxury'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleHotelLevelChange(level)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    hotelLevel === level
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  role="radio"
                  aria-checked={hotelLevel === level}
                >
                  {level === 'standard' ? '標準' : level === 'business' ? '商務' : '豪華'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-2xl" aria-live="polite">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5" />
            <h3 className="font-bold">估價結果</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="flex items-center gap-2 text-gray-400">
                <Plane className="w-4 h-4" /> 機票
              </span>
              <span className="font-mono">NT$ {flightCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="flex items-center gap-2 text-gray-400">
                <Hotel className="w-4 h-4" /> 住宿 ({days}晚)
              </span>
              <span className="font-mono">NT$ {hotelCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="flex items-center gap-2 text-gray-400">
                <Utensils className="w-4 h-4" /> 餐食
              </span>
              <span className="font-mono">NT$ {mealCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">交通 + 導遊</span>
              <span className="font-mono">NT$ {(transportCost + guideCost).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">每人費用</span>
              <span className="text-xl font-bold text-brand-400">
                NT$ {totalPerPerson.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">團體總價 ({pax}人)</span>
              <span className="text-2xl font-bold">
                NT$ {totalGroup.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            * 此為預估價格，實際報價以業務確認為準
          </p>
        </div>
      </div>
    </div>
  );
});

MiniTourEstimator.displayName = 'MiniTourEstimator';

export default MiniTourEstimator;