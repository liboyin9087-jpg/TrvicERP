import React, { useState, useMemo, useCallback } from 'react';
// Removed 'framer-motion' as it was imported but not used, and the animation was CSS-based.
import {
  Users, Bed, Bus, AlertCircle, Download, FileText, TrendingUp,
  UserCheck, UserX, Filter, Search, X
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import type { TourSession, Booking, RoomAssignment, SeatAssignment, SpecialNeedsSummary } from '../../types';

// ============================================
// Shared UI Components (for reusability and design consistency)
// ============================================

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Renders a standardized status badge with appropriate styling.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusClasses = (s: string) => {
    switch (s) {
      case 'confirmed':
      case 'paid':
        return 'bg-success-100 text-success-700';
      case 'pending':
      case 'pending_payment':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'confirmed': return '已確認';
      case 'paid': return '已付款';
      case 'pending': return '待確認';
      case 'pending_payment': return '待付款';
      default: return '未知';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusClasses(status),
      className
    )}>
      {getStatusText(status)}
    </span>
  );
};

// ============================================
// Helper Types for Processed Data
// ============================================

interface ProcessedBooking extends Booking {
  displayStatusText: string;
  displayRoomAssignment: string;
  displaySeatAssignment: string;
  displaySpecialNeeds: string;
  specialNeedsHighlightClass: string;
}

// ============================================
// Config & Data Interfaces for Kintone Independence
// ============================================

/**
 * Defines configuration properties that can be set for the GroupRoster widget.
 * These control its behavior and visible sections.
 */
interface GroupRosterConfig {
  title?: string;
  description?: string;
  initialFilter?: 'all' | 'confirmed' | 'pending';
  showSpecialNeedsSection?: boolean;
  showRoomAssignmentPreview?: boolean;
  showSeatAssignmentPreview?: boolean;
  roomPreviewLimit?: number; // Max items to show in room preview
  seatPreviewLimit?: number; // Max items to show in seat preview
  // Could add more for title customization, download options, etc.
}

/**
 * Defines the raw data properties passed to the GroupRoster component.
 * This ensures the component receives all necessary data via props.
 */
interface GroupRosterDataProps {
  session: TourSession;
  bookings: Booking[];
  roomAssignments?: RoomAssignment[];
  seatAssignments?: SeatAssignment[];
}

/**
 * Main props for the GroupRoster component, combining data and configuration.
 */
interface GroupRosterProps extends GroupRosterDataProps {
  config?: GroupRosterConfig;
}

// ============================================
// Custom Hook for Business Logic Extraction
// ============================================

/**
 * Custom hook to encapsulate all business logic, calculations, and filtering
 * for the GroupRoster component.
 *
 * @param session TourSession data.
 * @param bookings Booking data.
 * @param roomAssignments Optional room assignment data.
 * @param seatAssignments Optional seat assignment data.
 * @param currentFilter Current filter state ('all', 'confirmed', 'pending').
 * @param searchQuery Current search query string.
 * @returns Processed data ready for rendering.
 */
const useGroupRosterLogic = (
  session: TourSession,
  bookings: Booking[],
  roomAssignments: RoomAssignment[],
  seatAssignments: SeatAssignment[],
  currentFilter: 'all' | 'confirmed' | 'pending',
  searchQuery: string,
) => {
  const processedData = useMemo(() => {
    // 1. Calculate Registration Progress
    const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length;
    const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'pending_payment').length;
    const registrationProgress = session.max_pax > 0
      ? Math.round((session.current_pax / session.max_pax) * 100)
      : 0;

    // 2. Special Needs Summary
    const specialNeedsMap: Record<string, { count: number; passengers: { id: string; name: string }[] }> = {};
    bookings.forEach(booking => {
      if (booking.special_needs) {
        const needs = booking.special_needs.split(',').map(s => s.trim()).filter(Boolean);
        needs.forEach(need => {
          if (!specialNeedsMap[need]) {
            specialNeedsMap[need] = { count: 0, passengers: [] };
          }
          specialNeedsMap[need].count++;
          specialNeedsMap[need].passengers.push({
            id: booking.id,
            name: booking.customer_name,
          });
        });
      }
    });
    const specialNeedsSummary: SpecialNeedsSummary[] = Object.entries(specialNeedsMap).map(([category, data]) => ({
      category,
      count: data.count,
      passengers: data.passengers,
    }));

    // 3. Filter Bookings
    const filteredBookings: ProcessedBooking[] = bookings.filter(b => {
      // Apply status filter
      if (currentFilter === 'confirmed' && b.status !== 'confirmed' && b.status !== 'paid') return false;
      if (currentFilter === 'pending' && b.status !== 'pending' && b.status !== 'pending_payment') return false;

      // Apply search query filter
      if (searchQuery && !b.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).map(booking => ({
      ...booking,
      displayStatusText: (
        booking.status === 'confirmed' && '已確認' ||
        booking.status === 'paid' && '已付款' ||
        booking.status === 'pending' && '待確認' ||
        booking.status === 'pending_payment' && '待付款' ||
        '未知'
      ),
      displayRoomAssignment: booking.assigned_room || '未分配',
      displaySeatAssignment: booking.assigned_seat || '未分配',
      displaySpecialNeeds: booking.special_needs || '無',
      specialNeedsHighlightClass: booking.special_needs ? 'text-warning-600' : 'text-muted-foreground',
    }));

    return {
      confirmedCount,
      pendingCount,
      registrationProgress,
      specialNeedsSummary,
      filteredBookings,
      roomAssignments,
      seatAssignments,
    };
  }, [session, bookings, roomAssignments, seatAssignments, currentFilter, searchQuery]);

  return processedData;
};

// ============================================
// Sub-Components (extracted from the main component)
// ============================================

interface GroupRosterHeaderProps {
  title?: string;
  description?: string;
}

const GroupRosterHeader: React.FC<GroupRosterHeaderProps> = ({
  title = "全團名單總覽",
  description = "即時查看報名進度與名單資訊"
}) => (
  <div className="flex items-center justify-between border-b border-border p-6 bg-card-header rounded-t-xl drag-handle">
    <div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    {/* Optional: Add action buttons here if configurable */}
    <div className="flex gap-2">
      {/* <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90">
        <Download className="w-4 h-4" /> 匯出名單
      </button> */}
    </div>
  </div>
);


interface StatCardProps {
  icon: React.ElementType;
  iconBgClass: string;
  iconTextClass: string;
  label: string;
  value: string | number;
  valueClass?: string;
  progress?: { current: number; max: number; percentage: number };
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  iconBgClass,
  iconTextClass,
  label,
  value,
  valueClass,
  progress,
}) => (
  <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
        <Icon className={cn("w-5 h-5", iconTextClass)} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold", valueClass || "text-foreground")}>{value}</p>
      </div>
    </div>
    {progress && progress.max > 0 && (
      <>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          進度 {progress.percentage}% ({progress.current}/{progress.max})
        </p>
      </>
    )}
  </div>
);

interface GroupRosterStatsCardsProps {
  session: TourSession;
  confirmedCount: number;
  pendingCount: number;
  registrationProgress: number;
  roomAssignmentsCount: number;
}

const GroupRosterStatsCards: React.FC<GroupRosterStatsCardsProps> = ({
  session,
  confirmedCount,
  pendingCount,
  registrationProgress,
  roomAssignmentsCount,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 pt-0"> {/* Adjusted padding */}
    <StatCard
      icon={Users}
      iconBgClass="bg-primary-100"
      iconTextClass="text-primary-600"
      label="總報名人數"
      value={session.current_pax}
      progress={{
        current: session.current_pax,
        max: session.max_pax,
        percentage: registrationProgress,
      }}
    />

    <StatCard
      icon={UserCheck}
      iconBgClass="bg-success-100"
      iconTextClass="text-success-600"
      label="已確認"
      value={confirmedCount}
      valueClass="text-success-600"
    />

    <StatCard
      icon={UserX}
      iconBgClass="bg-warning-100"
      iconTextClass="text-warning-600"
      label="待確認"
      value={pendingCount}
      valueClass="text-warning-600"
    />

    <StatCard
      icon={Bed}
      iconBgClass="bg-info-100" // Using 'info' for the original 'accent' color
      iconTextClass="text-info-600" // Using 'info' for the original 'accent' color
      label="已分房"
      value={roomAssignmentsCount}
      valueClass="text-info-600" // Using 'info' for the original 'accent' color
    />
  </div>
);

interface GroupRosterControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: 'all' | 'confirmed' | 'pending';
  setFilter: (filter: 'all' | 'confirmed' | 'pending') => void;
}

const GroupRosterControls: React.FC<GroupRosterControlsProps> = ({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
}) => (
  <div className="flex flex-col md:flex-row items-center gap-4 p-6 pt-0"> {/* Adjusted padding */}
    <div className="relative flex-1 w-full md:max-w-xs lg:max-w-sm"> {/* Responsive search bar width */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="搜尋旅客姓名..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      />
    </div>
    <div className="flex gap-2">
      {(['all', 'confirmed', 'pending'] as const).map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap', // Added whitespace-nowrap
            filter === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {status === 'all' && '全部'}
          {status === 'confirmed' && '已確認'}
          {status === 'pending' && '待確認'}
        </button>
      ))}
    </div>
  </div>
);

interface GroupRosterPassengerTableProps {
  filteredBookings: ProcessedBooking[];
}

const GroupRosterPassengerTable: React.FC<GroupRosterPassengerTableProps> = ({
  filteredBookings,
}) => (
  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="p-6 border-b border-border flex items-center justify-between bg-card-header">
      <h4 className="font-semibold text-foreground">旅客名單</h4>
      <span className="text-sm text-muted-foreground">{filteredBookings.length} 位</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">姓名</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">狀態</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">房間</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">座位</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">特殊需求</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{booking.customer_name}</p>
                  {booking.email && (
                    <p className="text-sm text-muted-foreground">{booking.email}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {booking.displayRoomAssignment}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {booking.displaySeatAssignment}
                </td>
                <td className="px-6 py-4 text-sm">
                  {booking.special_needs ? (
                    <span className={booking.specialNeedsHighlightClass}>{booking.special_needs}</span>
                  ) : (
                    <span className="text-muted-foreground">無</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                查無旅客資料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

interface GroupRosterSpecialNeedsSummaryProps {
  specialNeedsSummary: SpecialNeedsSummary[];
}

const GroupRosterSpecialNeedsSummary: React.FC<GroupRosterSpecialNeedsSummaryProps> = ({
  specialNeedsSummary,
}) => (
  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="p-6 border-b border-border bg-card-header">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-warning" />
        特殊需求統計
      </h4>
    </div>
    <div className="p-6">
      {specialNeedsSummary.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialNeedsSummary.map((item) => (
            <div key={item.category} className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-warning-900">{item.category}</span>
                <span className="text-lg font-bold text-warning-600">{item.count}</span>
              </div>
              <div className="text-sm text-warning-700">
                {item.passengers.slice(0, 3).map(p => p.name).join('、')}
                {item.passengers.length > 3 && ` 等${item.passengers.length}位`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">無特殊需求資料</p>
      )}
    </div>
  </div>
);

interface GroupRosterRoomAssignmentPreviewProps {
  roomAssignments: RoomAssignment[];
  limit: number;
}

const GroupRosterRoomAssignmentPreview: React.FC<GroupRosterRoomAssignmentPreviewProps> = ({
  roomAssignments,
  limit,
}) => (
  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="p-6 border-b border-border flex items-center justify-between bg-card-header">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <Bed className="w-5 h-5 text-info-600" />
        分房表預覽
      </h4>
      <span className="text-sm text-muted-foreground">{roomAssignments.length} 間</span>
    </div>
    <div className="p-6 max-h-64 overflow-y-auto">
      {roomAssignments.length > 0 ? (
        <div className="space-y-3">
          {roomAssignments.slice(0, limit).map((room) => (
            <div key={room.roomNumber} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">房號 {room.roomNumber}</span>
                <span className="text-sm text-muted-foreground">{room.roomType}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {room.occupants.map(o => o.name).join('、')}
              </div>
            </div>
          ))}
          {roomAssignments.length > limit && (
            <p className="text-sm text-muted-foreground text-center pt-2">還有 {roomAssignments.length - limit} 間...</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">尚未分配房間</p>
      )}
    </div>
  </div>
);

interface GroupRosterSeatAssignmentPreviewProps {
  seatAssignments: SeatAssignment[];
  limit: number;
}

const GroupRosterSeatAssignmentPreview: React.FC<GroupRosterSeatAssignmentPreviewProps> = ({
  seatAssignments,
  limit,
}) => (
  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="p-6 border-b border-border flex items-center justify-between bg-card-header">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <Bus className="w-5 h-5 text-primary-600" />
        座位表預覽
      </h4>
      <span className="text-sm text-muted-foreground">
        {seatAssignments.filter(s => s.is_assigned).length} / {seatAssignments.length}
      </span>
    </div>
    <div className="p-6">
      {seatAssignments.length > 0 ? (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1"> {/* More responsive grid */}
          {seatAssignments.slice(0, limit).map((seat) => (
            <div
              key={seat.id}
              className={cn(
                'aspect-square rounded-sm border-2 flex items-center justify-center text-xs font-medium',
                seat.is_assigned
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {seat.seat_number}
            </div>
          ))}
          {seatAssignments.length > limit && (
            <div className="col-span-full text-sm text-muted-foreground text-center py-2"> {/* `col-span-full` for grid systems */}
              還有 {seatAssignments.length - limit} 個座位...
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">尚未設定座位</p>
      )}
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================

export default function GroupRoster({
  session,
  bookings,
  roomAssignments = [],
  seatAssignments = [],
  config,
}: GroupRosterProps) {
  // Use config defaults or provided values
  const initialFilter = config?.initialFilter || 'all';
  const showSpecialNeedsSection = config?.showSpecialNeedsSection ?? true;
  const showRoomAssignmentPreview = config?.showRoomAssignmentPreview ?? true;
  const showSeatAssignmentPreview = config?.showSeatAssignmentPreview ?? true;
  const roomPreviewLimit = config?.roomPreviewLimit || 5;
  const seatPreviewLimit = config?.seatPreviewLimit || 20;

  // Internal component state for filtering and searching
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract business logic into a custom hook
  const {
    confirmedCount,
    pendingCount,
    registrationProgress,
    specialNeedsSummary,
    filteredBookings,
  } = useGroupRosterLogic(
    session,
    bookings,
    roomAssignments,
    seatAssignments,
    filter,
    searchQuery
  );

  return (
    // Main widget container with Dashtail standard Card structure
    <div className="bg-card text-card-foreground rounded-xl border shadow-sm space-y-0">
      <GroupRosterHeader
        title={config?.title || "全團名單總覽"}
        description={config?.description || "即時查看報名進度與名單資訊"}
      />

      <div className="space-y-6 p-6 pt-0"> {/* Main content area with consistent padding */}
        <GroupRosterStatsCards
          session={session}
          confirmedCount={confirmedCount}
          pendingCount={pendingCount}
          registrationProgress={registrationProgress}
          roomAssignmentsCount={roomAssignments.length}
        />

        <GroupRosterControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
        />

        <GroupRosterPassengerTable
          filteredBookings={filteredBookings}
        />

        {showSpecialNeedsSection && specialNeedsSummary.length > 0 && (
          <GroupRosterSpecialNeedsSummary
            specialNeedsSummary={specialNeedsSummary}
          />
        )}

        {(showRoomAssignmentPreview || showSeatAssignmentPreview) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showRoomAssignmentPreview && (
              <GroupRosterRoomAssignmentPreview
                roomAssignments={roomAssignments}
                limit={roomPreviewLimit}
              />
            )}
            {showSeatAssignmentPreview && (
              <GroupRosterSeatAssignmentPreview
                seatAssignments={seatAssignments}
                limit={seatPreviewLimit}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}