import React, { useState, useMemo, memo } from 'react';
import { Calendar, MapPin, Users, DollarSign, CheckCircle, Clock, Edit2, Plus, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useItineraryBuilderStore } from '@/store/useItineraryBuilderStore';
import { cn } from '@/lib/utils';

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
  hasDetailedItinerary: boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface TripCardProps {
  trip: TripCard;
  onEditItinerary: () => void;
  compact?: boolean;
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

const STATUS_CONFIG: Record<TripCard['status'], StatusConfig> = {
  draft: { label: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  confirmed: { label: '已確認', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'in-progress': { label: '進行中', color: 'text-green-600', bgColor: 'bg-green-100' },
  completed: { label: '已完成', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const TripCard: React.FC<TripCardProps> = memo(({ trip, onEditItinerary, compact = false }) => {
  const config = STATUS_CONFIG[trip.status];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditItinerary();
  };

  const daysCount = useMemo(() => {
    return Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  }, [trip.startDate, trip.endDate]);

  if (compact) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all group"
        onClick={onEditItinerary}
        role="button"
        aria-label={`查看 ${trip.name} 行程`}
        tabIndex={0}
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
          onClick={handleClick}
          className="mt-2 w-full py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
          aria-label={`編輯 ${trip.name} 詳細行程`}
        >
          <Edit2 className="w-3 h-3" />
          編輯詳細行程
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group"
      role="button"
      aria-label={`查看 ${trip.name} 行程詳細資訊`}
      tabIndex={0}
    >
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
            <div className="text-gray-900 font-medium">{daysCount} 天</div>
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
          onClick={handleClick}
          className="px-4 py-2 bg-black text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`編輯 ${trip.name} 詳細行程`}
        >
          <Edit2 className="w-4 h-4" />
          編輯詳細行程
        </button>
      </div>
    </div>
  );
});

const VisualPlanner: React.FC = memo(() => {
  const { setCurrentView } = useAppStore();
  const { savedPlans, loadPlan, createNewPlan } = useItineraryBuilderStore();
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripCard['status'] | 'all'>('all');

  const handleEditItinerary = (tripId: string) => {
    const trip = MOCK_TRIPS.find(t => t.id === tripId);
    if (!trip) return;

    const existingPlan = savedPlans.find(p => p.id === tripId);
    
    if (existingPlan) {
      loadPlan(tripId);
    } else {
      const daysCount = Math.ceil(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      createNewPlan(trip.name, trip.destination, daysCount);
    }
    
    setCurrentView('builder');
  };

  const filteredTrips = useMemo(() => {
    return MOCK_TRIPS.filter(trip => {
      const matchSearch = 
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || trip.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, statusFilter]);

  const handleViewModeChange = (mode: 'calendar' | 'kanban') => {
    setViewMode(mode);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as TripCard['status'] | 'all');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">行程規劃</h2>
            <p className="text-sm text-gray-500">宏觀視角：監控整團進度與狀態</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('calendar')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="切換到月曆視圖"
              >
                月曆
              </button>
              <button
                onClick={() => handleViewModeChange('kanban')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                aria-label="切換到看板視圖"
              >
                看板
              </button>
            </div>
            <button 
              className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              aria-label="新增行程"
            >
              <Plus className="w-4 h-4" />
              新增行程
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜尋行程名稱或目的地..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="搜尋行程"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="篩選行程狀態"
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

      <main className="flex-1 overflow-auto p-6">
        {viewMode === 'calendar' ? (
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
});

export default VisualPlanner;