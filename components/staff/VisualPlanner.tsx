/**
 * 行程規劃 (Visual Planner)
 * 宏觀視角：給老闆、業務看進度
 * - 顯示整團的狀態（日期、人數、預算、訂金、領隊等）
 * - 月曆/看板視圖
 * - 點擊卡片可跳轉到「行程配置器 (Itinerary Builder)」進行詳細配置
 */

import React, { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, CheckCircle, Clock, Edit2, Plus, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useItineraryBuilderStore } from '@/store/useItineraryBuilderStore';
import { cn } from '@/lib/utils';

// 模擬團次數據（實際應該從 API 獲取）
interface TripCard {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  budget: number;
  depositReceived: boolean;
  leaderAssigned: boolean;
  status: 'draft' | 'confirmed' | 'in-progress' | 'completed';
  hasDetailedItinerary: boolean; // 是否有詳細行程配置
}

const MOCK_TRIPS: TripCard[] = [
  {
    id: 'trip-1',
    name: '嘉義三日遊',
    destination: '嘉義',
    startDate: '2025-10-10',
    endDate: '2025-10-12',
    participantCount: 25,
    budget: 150000,
    depositReceived: true,
    leaderAssigned: true,
    status: 'confirmed',
    hasDetailedItinerary: true,
  },
  {
    id: 'trip-2',
    name: '花東慢活五日',
    destination: '花蓮、台東',
    startDate: '2025-10-15',
    endDate: '2025-10-19',
    participantCount: 18,
    budget: 220000,
    depositReceived: false,
    leaderAssigned: false,
    status: 'draft',
    hasDetailedItinerary: false,
  },
  {
    id: 'trip-3',
    name: '阿里山日出團',
    destination: '嘉義',
    startDate: '2025-10-20',
    endDate: '2025-10-21',
    participantCount: 30,
    budget: 80000,
    depositReceived: true,
    leaderAssigned: false,
    status: 'confirmed',
    hasDetailedItinerary: false,
  },
];

const STATUS_CONFIG: Record<TripCard['status'], { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  confirmed: { label: '已確認', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'in-progress': { label: '進行中', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: '已完成', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export default function VisualPlanner() {
  const { setCurrentView } = useAppStore();
  const { savedPlans, loadPlan, createNewPlan } = useItineraryBuilderStore();
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripCard['status'] | 'all'>('all');

  // 處理跳轉到行程配置器
  const handleEditItinerary = (tripId: string) => {
    const trip = MOCK_TRIPS.find(t => t.id === tripId);
    if (!trip) return;

    // 嘗試從 savedPlans 中找到對應的行程
    const existingPlan = savedPlans.find(p => p.id === tripId);
    
    if (existingPlan) {
      // 如果已存在，載入該行程
      loadPlan(tripId);
    } else {
      // 如果不存在，根據 trip 信息創建新行程
      const daysCount = Math.ceil(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      createNewPlan(trip.name, trip.destination, daysCount);
    }
    
    // 跳轉到 Builder
    setCurrentView('builder');
  };

  // 過濾行程
  const filteredTrips = MOCK_TRIPS.filter(trip => {
    const matchSearch = 
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">行程規劃</h2>
            <p className="text-sm text-gray-500">宏觀視角：監控整團進度與狀態</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                月曆
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                看板
              </button>
            </div>
            <button className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" />
              新增行程
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋行程名稱或目的地..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TripCard['status'] | 'all')}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">全部狀態</option>
              <option value="draft">草稿</option>
              <option value="confirmed">已確認</option>
              <option value="in-progress">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {viewMode === 'calendar' ? (
          // 月曆視圖（簡化版，實際應該使用日曆組件）
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEditItinerary={() => handleEditItinerary(trip.id)}
              />
            ))}
          </div>
        ) : (
          // 看板視圖
          <div className="grid grid-cols-4 gap-4 h-full">
            {(['draft', 'confirmed', 'in-progress', 'completed'] as const).map((status) => {
              const tripsInStatus = filteredTrips.filter(t => t.status === status);
              const config = STATUS_CONFIG[status];
              return (
                <div key={status} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={cn('font-semibold text-sm', config.color)}>
                      {config.label}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {tripsInStatus.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {tripsInStatus.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onEditItinerary={() => handleEditItinerary(trip.id)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// 行程卡片組件
interface TripCardProps {
  trip: TripCard;
  onEditItinerary: () => void;
  compact?: boolean;
}

function TripCard({ trip, onEditItinerary, compact = false }: TripCardProps) {
  const config = STATUS_CONFIG[trip.status];

  if (compact) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group"
        onClick={onEditItinerary}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">{trip.name}</h4>
          <span className={cn('text-xs px-2 py-0.5 rounded ml-2', config.color, config.bgColor)}>
            {config.label}
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{trip.startDate} ~ {trip.endDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{trip.participantCount} 人</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditItinerary();
          }}
          className="mt-2 w-full py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="w-3 h-3" />
          編輯詳細行程
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{trip.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{trip.destination}</span>
          </div>
        </div>
        <span className={cn('text-xs px-2.5 py-1 rounded font-medium', config.color, config.bgColor)}>
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-gray-900 font-medium">{trip.startDate}</div>
            <div className="text-gray-500 text-xs">出發日期</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-gray-900 font-medium">{trip.participantCount} 人</div>
            <div className="text-gray-500 text-xs">參與人數</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-gray-900 font-medium">${trip.budget.toLocaleString()}</div>
            <div className="text-gray-500 text-xs">預算</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-gray-900 font-medium">
              {Math.ceil(
                (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
              ) + 1} 天
            </div>
            <div className="text-gray-500 text-xs">行程天數</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs">
          <div className={cn('flex items-center gap-1', trip.depositReceived ? 'text-green-600' : 'text-gray-400')}>
            <CheckCircle className="w-4 h-4" />
            <span>{trip.depositReceived ? '訂金已收' : '訂金未收'}</span>
          </div>
          <div className={cn('flex items-center gap-1', trip.leaderAssigned ? 'text-green-600' : 'text-gray-400')}>
            <Users className="w-4 h-4" />
            <span>{trip.leaderAssigned ? '已派領隊' : '未派領隊'}</span>
          </div>
          {trip.hasDetailedItinerary && (
            <div className="flex items-center gap-1 text-blue-600">
              <MapPin className="w-4 h-4" />
              <span>已配置行程</span>
            </div>
          )}
        </div>
        <button
          onClick={onEditItinerary}
          className="px-4 py-2 bg-black text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Edit2 className="w-4 h-4" />
          編輯詳細行程
        </button>
      </div>
    </div>
  );
}
