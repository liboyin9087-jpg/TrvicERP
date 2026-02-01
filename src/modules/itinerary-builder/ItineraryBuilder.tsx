/**
 * Itinerary Builder Module - Based on Open Source Travel Booking Templates
 * Features: Drag-drop itinerary editor, day-by-day planning, activity scheduling
 * Reference: TourCraft React Template & Odoo Tour Management
 */

import React, { useState, useCallback } from 'react';

// Types
export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date?: string;
  title: string;
  description?: string;
  activities: ItineraryActivity[];
  meals: MealPlan;
  accommodation?: Accommodation;
  notes?: string;
}

export interface ItineraryActivity {
  id: string;
  dayId: string;
  order: number;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  type: 'transport' | 'attraction' | 'meal' | 'free_time' | 'shopping' | 'activity' | 'transfer';
  title: string;
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  supplierId?: string;
  supplierName?: string;
  cost?: number;
  currency?: string;
  includedInPackage: boolean;
  notes?: string;
  photos?: string[];
}

export interface MealPlan {
  breakfast: MealInfo | null;
  lunch: MealInfo | null;
  dinner: MealInfo | null;
}

export interface MealInfo {
  included: boolean;
  venue?: string;
  cuisineType?: string;
  notes?: string;
}

export interface Accommodation {
  name: string;
  type: 'hotel' | 'resort' | 'ryokan' | 'hostel' | 'villa' | 'cruise';
  rating?: number;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  amenities?: string[];
  notes?: string;
}

export interface Itinerary {
  id: string;
  tourId: string;
  name: string;
  destination: string;
  duration: number;
  days: ItineraryDay[];
  totalCost: number;
  currency: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Activity Type Configuration
export const ACTIVITY_TYPES = {
  transport: { label: '交通', icon: '🚌', color: 'bg-blue-100 text-blue-800' },
  attraction: { label: '景點', icon: '🏛️', color: 'bg-purple-100 text-purple-800' },
  meal: { label: '用餐', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
  free_time: { label: '自由活動', icon: '🏃', color: 'bg-green-100 text-green-800' },
  shopping: { label: '購物', icon: '🛍️', color: 'bg-pink-100 text-pink-800' },
  activity: { label: '體驗活動', icon: '🎯', color: 'bg-cyan-100 text-cyan-800' },
  transfer: { label: '接送', icon: '🚐', color: 'bg-gray-100 text-gray-800' }
};

// Activity Type Badge Component
export const ActivityTypeBadge: React.FC<{ type: keyof typeof ACTIVITY_TYPES }> = ({ type }) => {
  const config = ACTIVITY_TYPES[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Single Activity Card Component
interface ActivityCardProps {
  activity: ItineraryActivity;
  onEdit: (activity: ItineraryActivity) => void;
  onDelete: (id: string) => void;
  onMove?: (direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast
}) => {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow group">
      {/* Time Column */}
      <div className="w-16 text-center flex-shrink-0">
        {activity.startTime && (
          <div className="text-sm font-medium text-gray-900">{activity.startTime}</div>
        )}
        {activity.duration && (
          <div className="text-xs text-gray-500">
            {activity.duration >= 60 
              ? `${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ''}`
              : `${activity.duration}m`}
          </div>
        )}
      </div>

      {/* Timeline Connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${ACTIVITY_TYPES[activity.type]?.color.split(' ')[0] || 'bg-gray-300'}`} />
        {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-1" style={{ minHeight: '40px' }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ActivityTypeBadge type={activity.type} />
          {!activity.includedInPackage && (
            <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">自費</span>
          )}
        </div>
        <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
        {activity.location && (
          <p className="text-sm text-gray-500 flex items-center mt-0.5">
            <span className="mr-1">📍</span>
            {activity.location}
          </p>
        )}
        {activity.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
        )}
        {activity.cost && activity.cost > 0 && (
          <p className="text-sm font-medium text-blue-600 mt-1">
            {activity.currency || 'TWD'} {activity.cost.toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMove && !isFirst && (
          <button
            onClick={() => onMove('up')}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="上移"
          >
            ↑
          </button>
        )}
        {onMove && !isLast && (
          <button
            onClick={() => onMove('down')}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="下移"
          >
            ↓
          </button>
        )}
        <button
          onClick={() => onEdit(activity)}
          className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="編輯"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="刪除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

// Day Card Component
interface DayCardProps {
  day: ItineraryDay;
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: ItineraryActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveActivity: (dayId: string, activityId: string, direction: 'up' | 'down') => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveActivity
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Day Header */}
      <div 
        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              D{day.dayNumber}
            </div>
            <div>
              <h3 className="font-semibold">{day.title}</h3>
              {day.date && (
                <p className="text-sm text-blue-100">{day.date}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
              {day.activities.length} 項活動
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onEditDay(day); }}
              className="p-1 hover:bg-white/20 rounded"
            >
              ⚙️
            </button>
            <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Day Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Meals Summary */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className={`flex items-center gap-1 ${day.meals.breakfast?.included ? 'text-green-600' : 'text-gray-400'}`}>
              🌅 早餐: {day.meals.breakfast?.included ? (day.meals.breakfast.venue || '含') : '自理'}
            </div>
            <div className={`flex items-center gap-1 ${day.meals.lunch?.included ? 'text-green-600' : 'text-gray-400'}`}>
              ☀️ 午餐: {day.meals.lunch?.included ? (day.meals.lunch.venue || '含') : '自理'}
            </div>
            <div className={`flex items-center gap-1 ${day.meals.dinner?.included ? 'text-green-600' : 'text-gray-400'}`}>
              🌙 晚餐: {day.meals.dinner?.included ? (day.meals.dinner.venue || '含') : '自理'}
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-2">
            {day.activities
              .sort((a, b) => a.order - b.order)
              .map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onEdit={onEditActivity}
                  onDelete={onDeleteActivity}
                  onMove={(direction) => onMoveActivity(day.id, activity.id, direction)}
                  isFirst={index === 0}
                  isLast={index === day.activities.length - 1}
                />
              ))}
          </div>

          {/* Add Activity Button */}
          <button
            onClick={() => onAddActivity(day.id)}
            className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span> 新增活動
          </button>

          {/* Accommodation */}
          {day.accommodation && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 text-indigo-800">
                <span>🏨</span>
                <span className="font-medium">{day.accommodation.name}</span>
                {day.accommodation.rating && (
                  <span className="text-yellow-500">
                    {'★'.repeat(day.accommodation.rating)}
                  </span>
                )}
              </div>
              {day.accommodation.roomType && (
                <p className="text-sm text-indigo-600 mt-1">
                  房型: {day.accommodation.roomType}
                </p>
              )}
            </div>
          )}

          {/* Day Notes */}
          {day.notes && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <span className="font-medium">備註:</span> {day.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Activity Form Component
interface ActivityFormProps {
  initialData?: Partial<ItineraryActivity>;
  dayId: string;
  onSubmit: (data: Partial<ItineraryActivity>) => void;
  onCancel: () => void;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  initialData,
  dayId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<ItineraryActivity>>({
    dayId,
    type: 'attraction',
    title: '',
    includedInPackage: true,
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Activity Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">活動類型 *</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: key as ItineraryActivity['type'] }))}
              className={`p-2 rounded-lg border text-center transition-all ${
                formData.type === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-xl">{config.icon}</span>
              <p className="text-xs mt-1">{config.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">活動名稱 *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="例如：淺草寺參觀"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Time */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">開始時間</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">結束時間</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">時長 (分鐘)</label>
          <input
            type="number"
            name="duration"
            value={formData.duration || ''}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">地點</label>
        <input
          type="text"
          name="location"
          value={formData.location || ''}
          onChange={handleChange}
          placeholder="例如：東京都台東區淺草2-3-1"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">說明</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          placeholder="活動詳細說明..."
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Cost & Inclusion */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">費用</label>
          <input
            type="number"
            name="cost"
            value={formData.cost || ''}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includedInPackage"
              checked={formData.includedInPackage}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">包含在團費內</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">備註</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {initialData?.id ? '更新' : '新增活動'}
        </button>
      </div>
    </form>
  );
};

// Itinerary Summary Component
interface ItinerarySummaryProps {
  itinerary: Itinerary;
}

export const ItinerarySummary: React.FC<ItinerarySummaryProps> = ({ itinerary }) => {
  const totalActivities = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
  
  const activityStats = itinerary.days.reduce((stats, day) => {
    day.activities.forEach(activity => {
      stats[activity.type] = (stats[activity.type] || 0) + 1;
    });
    return stats;
  }, {} as Record<string, number>);

  const includedMeals = itinerary.days.reduce((count, day) => {
    return count + 
      (day.meals.breakfast?.included ? 1 : 0) +
      (day.meals.lunch?.included ? 1 : 0) +
      (day.meals.dinner?.included ? 1 : 0);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-900 mb-4">行程摘要</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{itinerary.duration}</p>
          <p className="text-xs text-gray-500">天數</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{totalActivities}</p>
          <p className="text-xs text-gray-500">活動項目</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">{includedMeals}</p>
          <p className="text-xs text-gray-500">含餐數</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {itinerary.currency} {itinerary.totalCost.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">預估費用</p>
        </div>
      </div>

      {/* Activity Type Breakdown */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">活動分布</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(activityStats).map(([type, count]) => {
            const config = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
            return (
              <span
                key={type}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100'}`}
              >
                <span className="mr-1">{config?.icon}</span>
                {config?.label}: {count}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Main Itinerary Builder Component
interface ItineraryBuilderProps {
  itinerary: Itinerary;
  onSave: (itinerary: Itinerary) => void;
  onPublish: (itinerary: Itinerary) => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  itinerary: initialItinerary,
  onSave,
  onPublish
}) => {
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [editingActivity, setEditingActivity] = useState<{ dayId: string; activity?: ItineraryActivity } | null>(null);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);

  const handleAddActivity = useCallback((dayId: string) => {
    setEditingActivity({ dayId });
  }, []);

  const handleEditActivity = useCallback((activity: ItineraryActivity) => {
    setEditingActivity({ dayId: activity.dayId, activity });
  }, []);

  const handleDeleteActivity = useCallback((activityId: string) => {
    if (confirm('確定要刪除此活動嗎？')) {
      setItinerary(prev => ({
        ...prev,
        days: prev.days.map(day => ({
          ...day,
          activities: day.activities.filter(a => a.id !== activityId)
        }))
      }));
    }
  }, []);

  const handleMoveActivity = useCallback((dayId: string, activityId: string, direction: 'up' | 'down') => {
    setItinerary(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.id !== dayId) return day;
        
        const activities = [...day.activities].sort((a, b) => a.order - b.order);
        const currentIndex = activities.findIndex(a => a.id === activityId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex < 0 || newIndex >= activities.length) return day;
        
        // Swap orders
        const temp = activities[currentIndex].order;
        activities[currentIndex].order = activities[newIndex].order;
        activities[newIndex].order = temp;
        
        return { ...day, activities };
      })
    }));
  }, []);

  const handleSaveActivity = useCallback((data: Partial<ItineraryActivity>) => {
    if (!editingActivity) return;

    setItinerary(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.id !== editingActivity.dayId) return day;

        if (editingActivity.activity) {
          // Update existing activity
          return {
            ...day,
            activities: day.activities.map(a => 
              a.id === editingActivity.activity!.id 
                ? { ...a, ...data }
                : a
            )
          };
        } else {
          // Add new activity
          const newActivity: ItineraryActivity = {
            id: `act_${Date.now()}`,
            dayId: day.id,
            order: day.activities.length + 1,
            type: 'attraction',
            title: '',
            includedInPackage: true,
            ...data
          } as ItineraryActivity;
          
          return {
            ...day,
            activities: [...day.activities, newActivity]
          };
        }
      })
    }));

    setEditingActivity(null);
  }, [editingActivity]);

  const handleEditDay = useCallback((day: ItineraryDay) => {
    setEditingDay(day);
  }, []);

  const handleAddDay = useCallback(() => {
    const newDay: ItineraryDay = {
      id: `day_${Date.now()}`,
      dayNumber: itinerary.days.length + 1,
      title: `第 ${itinerary.days.length + 1} 天`,
      activities: [],
      meals: {
        breakfast: { included: true },
        lunch: { included: true },
        dinner: { included: true }
      }
    };

    setItinerary(prev => ({
      ...prev,
      duration: prev.duration + 1,
      days: [...prev.days, newDay]
    }));
  }, [itinerary.days.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{itinerary.name}</h1>
          <p className="text-gray-500">{itinerary.destination} • {itinerary.duration} 天</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(itinerary)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            儲存草稿
          </button>
          <button
            onClick={() => onPublish(itinerary)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            發布行程
          </button>
        </div>
      </div>

      {/* Summary */}
      <ItinerarySummary itinerary={itinerary} />

      {/* Days */}
      <div className="space-y-4">
        {itinerary.days
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map(day => (
            <DayCard
              key={day.id}
              day={day}
              onEditDay={handleEditDay}
              onAddActivity={handleAddActivity}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onMoveActivity={handleMoveActivity}
            />
          ))}
      </div>

      {/* Add Day Button */}
      <button
        onClick={handleAddDay}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span> 新增一天
      </button>

      {/* Activity Form Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">
                {editingActivity.activity ? '編輯活動' : '新增活動'}
              </h3>
            </div>
            <div className="p-4">
              <ActivityForm
                initialData={editingActivity.activity}
                dayId={editingActivity.dayId}
                onSubmit={handleSaveActivity}
                onCancel={() => setEditingActivity(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  ActivityTypeBadge,
  ActivityCard,
  DayCard,
  ActivityForm,
  ItinerarySummary,
  ItineraryBuilder,
  ACTIVITY_TYPES
};
