import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Card/Card';
import { ItineraryDay, Activity, Accommodation, Transportation, Meal } from '../types';

interface ItineraryBuilderProps {
  packageId: string;
  duration: number;
  onSave: (itinerary: ItineraryDay[]) => void;
  onCancel: () => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  packageId,
  duration,
  onSave,
  onCancel,
}) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    Array.from({ length: duration }, (_, i) => ({
      id: `day_${i + 1}`,
      dayNumber: i + 1,
      activities: [],
      transportation: [],
      meals: [],
      guideNotes: '',
    }))
  );

  const [selectedDay, setSelectedDay] = useState<number>(1);

  const addActivity = (dayIndex: number) => {
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      name: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      cost: 0,
      images: [],
    };

    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities.push(newActivity);
    setItinerary(updatedItinerary);
  };

  const updateActivity = (dayIndex: number, activityIndex: number, field: keyof Activity, value: any) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities[activityIndex] = {
      ...updatedItinerary[dayIndex].activities[activityIndex],
      [field]: value,
    };
    setItinerary(updatedItinerary);
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].activities.splice(activityIndex, 1);
    setItinerary(updatedItinerary);
  };

  const addTransportation = (dayIndex: number) => {
    const newTransportation: Transportation = {
      id: `trans_${Date.now()}`,
      type: 'bus',
      from: '',
      to: '',
      departureTime: '08:00',
      arrivalTime: '09:00',
      cost: 0,
      provider: '',
    };

    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].transportation.push(newTransportation);
    setItinerary(updatedItinerary);
  };

  const updateTransportation = (dayIndex: number, transIndex: number, field: keyof Transportation, value: any) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].transportation[transIndex] = {
      ...updatedItinerary[dayIndex].transportation[transIndex],
      [field]: value,
    };
    setItinerary(updatedItinerary);
  };

  const addMeal = (dayIndex: number, type: 'breakfast' | 'lunch' | 'dinner') => {
    const newMeal: Meal = {
      id: `meal_${Date.now()}`,
      type,
      restaurant: '',
      cuisine: '',
      cost: 0,
      included: true,
    };

    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].meals.push(newMeal);
    setItinerary(updatedItinerary);
  };

  const updateMeal = (dayIndex: number, mealIndex: number, field: keyof Meal, value: any) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[dayIndex].meals[mealIndex] = {
      ...updatedItinerary[dayIndex].meals[mealIndex],
      [field]: value,
    };
    setItinerary(updatedItinerary);
  };

  const currentDay = itinerary[selectedDay - 1];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card title="行程規劃編輯器">
        {/* 日期選擇器 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {itinerary.map((day) => (
            <Button
              key={day.id}
              variant={day.dayNumber === selectedDay ? 'primary' : 'secondary'}
              onClick={() => setSelectedDay(day.dayNumber)}
            >
              第 {day.dayNumber} 天
            </Button>
          ))}
        </div>

        {/* 當前日期編輯 */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-neutral-900">
              第 {selectedDay} 天行程
            </h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => addActivity(selectedDay - 1)}>
                + 新增活動
              </Button>
              <Button variant="secondary" onClick={() => addTransportation(selectedDay - 1)}>
                + 新增交通
              </Button>
            </div>
          </div>

          {/* 活動列表 */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-800 mb-4">活動安排</h4>
            {currentDay.activities.map((activity, index) => (
              <Card key={activity.id} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      活動名稱
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={activity.name}
                      onChange={(e) => updateActivity(selectedDay - 1, index, 'name', e.target.value)}
                      placeholder="例：阿里山森林遊樂區"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      時間
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        className="flex-1 px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                        value={activity.startTime}
                        onChange={(e) => updateActivity(selectedDay - 1, index, 'startTime', e.target.value)}
                      />
                      <span className="self-center">-</span>
                      <input
                        type="time"
                        className="flex-1 px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                        value={activity.endTime}
                        onChange={(e) => updateActivity(selectedDay - 1, index, 'endTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button variant="danger" onClick={() => removeActivity(selectedDay - 1, index)}>
                      刪除
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    活動描述
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md min-h-[80px]"
                    value={activity.description}
                    onChange={(e) => updateActivity(selectedDay - 1, index, 'description', e.target.value)}
                    placeholder="詳細描述活動內容、注意事項等..."
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      地點
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={activity.location}
                      onChange={(e) => updateActivity(selectedDay - 1, index, 'location', e.target.value)}
                      placeholder="例：阿里山森林遊樂區"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      費用 (NT$)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={activity.cost}
                      onChange={(e) => updateActivity(selectedDay - 1, index, 'cost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 交通安排 */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-800 mb-4">交通安排</h4>
            {currentDay.transportation.map((transport, index) => (
              <Card key={transport.id} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      交通類型
                    </label>
                    <select
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={transport.type}
                      onChange={(e) => updateTransportation(selectedDay - 1, index, 'type', e.target.value)}
                    >
                      <option value="bus">遊覽車</option>
                      <option value="flight">飛機</option>
                      <option value="train">火車</option>
                      <option value="car">自駕車</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      供應商
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={transport.provider}
                      onChange={(e) => updateTransportation(selectedDay - 1, index, 'provider', e.target.value)}
                      placeholder="例：台灣客運"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      出發地
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={transport.from}
                      onChange={(e) => updateTransportation(selectedDay - 1, index, 'from', e.target.value)}
                      placeholder="例：台北車站"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      目的地
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={transport.to}
                      onChange={(e) => updateTransportation(selectedDay - 1, index, 'to', e.target.value)}
                      placeholder="例：阿里山"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      時間
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        className="flex-1 px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                        value={transport.departureTime}
                        onChange={(e) => updateTransportation(selectedDay - 1, index, 'departureTime', e.target.value)}
                      />
                      <span className="self-center">-</span>
                      <input
                        type="time"
                        className="flex-1 px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                        value={transport.arrivalTime}
                        onChange={(e) => updateTransportation(selectedDay - 1, index, 'arrivalTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      費用 (NT$)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={transport.cost}
                      onChange={(e) => updateTransportation(selectedDay - 1, index, 'cost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 餐飲安排 */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-800 mb-4">餐飲安排</h4>
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" onClick={() => addMeal(selectedDay - 1, 'breakfast')}>
                + 早餐
              </Button>
              <Button variant="secondary" onClick={() => addMeal(selectedDay - 1, 'lunch')}>
                + 午餐
              </Button>
              <Button variant="secondary" onClick={() => addMeal(selectedDay - 1, 'dinner')}>
                + 晚餐
              </Button>
            </div>
            {currentDay.meals.map((meal, index) => (
              <Card key={meal.id} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      餐廳名稱
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={meal.restaurant}
                      onChange={(e) => updateMeal(selectedDay - 1, index, 'restaurant', e.target.value)}
                      placeholder="例：阿里山賓館餐廳"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      菜系類型
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={meal.cuisine}
                      onChange={(e) => updateMeal(selectedDay - 1, index, 'cuisine', e.target.value)}
                      placeholder="例：台式料理"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      費用 (NT$)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md"
                      value={meal.cost}
                      onChange={(e) => updateMeal(selectedDay - 1, index, 'cost', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={meal.included}
                      onChange={(e) => updateMeal(selectedDay - 1, index, 'included', e.target.checked)}
                    />
                    <span className="text-sm font-semibold text-neutral-700">包含在套裝內</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>

          {/* 導遊說明 */}
          <div>
            <h4 className="text-lg font-semibold text-neutral-800 mb-4">導遊說明</h4>
            <textarea
              className="w-full px-3 py-2 text-base border-2 border-neutral-300 rounded-md min-h-[120px]"
              value={currentDay.guideNotes}
              onChange={(e) => {
                const updatedItinerary = [...itinerary];
                updatedItinerary[selectedDay - 1].guideNotes = e.target.value;
                setItinerary(updatedItinerary);
              }}
              placeholder="導遊注意事項、特殊安排、聯絡資訊等..."
            />
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200 mt-8">
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={() => onSave(itinerary)}>
            儲存行程
          </Button>
        </div>
      </Card>
    </div>
  );
};
