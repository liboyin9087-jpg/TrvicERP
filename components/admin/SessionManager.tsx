import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Plus, Search, Filter, Edit, Trash2, Eye,
  ChevronRight, X, Building2, MapPin, Clock, TrendingUp, AlertCircle,
  CheckCircle, FileText, Download, Copy, Settings, UserCheck, Bed,
  Bus, User, Phone, Mail, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatting';
import type { TourSession, Booking, HotelRoomAllocation, SeatAssignment, TourLeader, MeetingInfo } from '@/types';
import { useSessions, useCreateSession, useUpdateSession, useDeleteSession } from '@/modules/sessions/hooks/useSessions';
import type { Session, SessionStatus, GroupType } from '@/core/types/session';
import { SessionStatus as CoreSessionStatus, GroupType as CoreGroupType } from '@/core/types/session';
import { Loading } from '@/components/shared/Loading';
import { useAppStore } from '@/store/useAppStore';
import { AuthService } from '@/core/services/authService';

// ============================================
// Types
// ============================================

type TabKey = 'dashboard' | 'groups' | 'create';

interface GroupListItem extends TourSession {
  series_name?: string;
  registration_progress: number;
  pending_welfare_count?: number;
}

// ============================================
// Mock Data (保留用於導遊選擇等輔助功能)
// ============================================

const MOCK_TOUR_LEADERS: TourLeader[] = [
  { id: 'tl1', name: '張導遊', phone: '0912-345-678', email: 'guide1@travel.com', license_number: 'TL-2020-001', experience_years: 5 },
  { id: 'tl2', name: '李領隊', phone: '0912-345-679', email: 'guide2@travel.com', license_number: 'TL-2018-015', experience_years: 8 },
  { id: 'tl3', name: '王導遊', phone: '0912-345-680', email: 'guide3@travel.com', license_number: 'TL-2021-023', experience_years: 3 },
];

// ============================================
// Type Conversion Utilities
// ============================================

/**
 * Convert Session (camelCase) to GroupListItem (snake_case)
 * 將 Session 類型轉換為 GroupListItem 類型
 */
function convertSessionToGroupListItem(session: Session): GroupListItem {
  // Map status enum values
  const statusMap: Record<SessionStatus, string> = {
    [CoreSessionStatus.SOLICITING]: 'soliciting',
    [CoreSessionStatus.GUARANTEED]: 'guaranteed',
    [CoreSessionStatus.CLOSED]: 'closed',
    [CoreSessionStatus.COMPLETED]: 'completed',
    [CoreSessionStatus.CANCELLED]: 'cancelled',
  };

  // Map group type enum values
  const groupTypeMap: Record<GroupType, string> = {
    [CoreGroupType.WELFARE]: 'welfare',
    [CoreGroupType.REGULAR]: 'regular',
  };

  // Calculate registration progress
  const registrationProgress = session.maxPax > 0
    ? Math.round((session.currentPax / session.maxPax) * 100)
    : 0;

  return {
    id: session.id as string,
    series_id: session.seriesId as string,
    group_number: session.groupNumber,
    group_type: groupTypeMap[session.groupType] as 'welfare' | 'regular',
    start_date: session.startDate,
    end_date: session.endDate,
    status: statusMap[session.status] as 'soliciting' | 'guaranteed' | 'closed' | 'completed' | 'cancelled',
    min_pax: session.minPax,
    max_pax: session.maxPax,
    current_pax: session.currentPax,
    seat_release_date: session.seatReleaseDate,
    price_twd: session.priceTwd,
    agent_commission: session.agentCommission,
    registration_progress: registrationProgress,
    created_at: session.createdAt,
    // Optional fields
    series_name: undefined, // Will be populated from tour data if available
    pending_welfare_count: session.groupType === CoreGroupType.WELFARE ? undefined : undefined,
  };
}

/**
 * Convert GroupListItem to CreateSessionData
 */
function convertGroupListItemToCreateSessionData(data: Partial<TourSession>): {
  seriesId: string;
  tourId: string;
  groupNumber: string;
  groupType: GroupType;
  startDate: string;
  endDate: string;
  minPax: number;
  maxPax: number;
  seatReleaseDate: string;
  priceTwd: number;
  agentCommission: number;
} {
  const groupTypeMap: Record<string, GroupType> = {
    'welfare': CoreGroupType.WELFARE,
    'regular': CoreGroupType.REGULAR,
  };

  return {
    seriesId: (data.series_id || '') as any,
    tourId: (data.series_id || '') as any, // Using series_id as tourId fallback
    groupNumber: data.group_number || '',
    groupType: groupTypeMap[data.group_type || 'regular'] || CoreGroupType.REGULAR,
    startDate: data.start_date || '',
    endDate: data.end_date || '',
    minPax: data.min_pax || 20,
    maxPax: data.max_pax || 40,
    seatReleaseDate: data.seat_release_date || '',
    priceTwd: data.price_twd || 0,
    agentCommission: data.agent_commission || 0.15,
  };
}

/**
 * Convert GroupListItem to UpdateSessionData
 */
function convertGroupListItemToUpdateSessionData(data: Partial<TourSession>, session?: Session): {
  groupNumber: string;
  groupType: GroupType;
  startDate: string;
  endDate: string;
  status?: SessionStatus;
  minPax: number;
  maxPax: number;
  currentPax: number;
  seatReleaseDate: string;
  priceTwd: number;
  agentCommission: number;
  tourLeaderId?: string;
  tourLeaderName?: string;
  meetingInfo?: {
    location: string;
    address: string;
    meetingTime: string;
    contactPerson: string;
    contactPhone: string;
    notes: string;
  };
} {
  const groupTypeMap: Record<string, GroupType> = {
    'welfare': CoreGroupType.WELFARE,
    'regular': CoreGroupType.REGULAR,
  };

  const statusMap: Record<string, SessionStatus> = {
    'soliciting': CoreSessionStatus.SOLICITING,
    'guaranteed': CoreSessionStatus.GUARANTEED,
    'closed': CoreSessionStatus.CLOSED,
    'completed': CoreSessionStatus.COMPLETED,
    'cancelled': CoreSessionStatus.CANCELLED,
  };

  return {
    groupNumber: data.group_number || session?.groupNumber || '',
    groupType: groupTypeMap[data.group_type || 'regular'] || CoreGroupType.REGULAR,
    startDate: data.start_date || session?.startDate || '',
    endDate: data.end_date || session?.endDate || '',
    status: data.status ? statusMap[data.status] : undefined,
    minPax: data.min_pax ?? session?.minPax ?? 20,
    maxPax: data.max_pax ?? session?.maxPax ?? 40,
    currentPax: data.current_pax ?? session?.currentPax ?? 0,
    seatReleaseDate: data.seat_release_date || session?.seatReleaseDate || '',
    priceTwd: data.price_twd ?? session?.priceTwd ?? 0,
    agentCommission: data.agent_commission ?? session?.agentCommission ?? 0.15,
    tourLeaderId: session?.tourLeaderId as string | undefined,
    tourLeaderName: session?.tourLeaderName,
    meetingInfo: session?.meetingInfo,
  };
}

// ============================================
// Helper Components
// ============================================

function TabButton({ active, icon, label, onClick, badge }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void; badge?: number;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all relative',
        active
          ? 'bg-slate-900 text-white shadow-lg'
          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

function StatCard({ icon, label, value, trend, trendUp }: {
  icon: React.ReactNode; label: string; value: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 bg-neutral-200 rounded-xl flex items-center justify-center text-slate-600">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            trendUp ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-700'
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-4">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </motion.div>
  );
}

// ============================================
// Dashboard Tab
// ============================================

function DashboardTab({ groups, onNavigate }: {
  groups: GroupListItem[]; onNavigate: (tab: TabKey) => void;
}) {
  const activeGroups = groups.filter(g => g.status !== 'completed');
  const pendingWelfare = groups.filter(g => g.group_type === 'welfare' && g.pending_welfare_count && g.pending_welfare_count > 0);
  const totalPendingWelfare = pendingWelfare.reduce((sum, g) => sum + (g.pending_welfare_count || 0), 0);
  const totalRegistrations = groups.reduce((sum, g) => sum + g.current_pax, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="進行中團體" value={activeGroups.length.toString()} />
        <StatCard icon={<Users className="w-5 h-5" />} label="總報名人數" value={totalRegistrations.toString()} trend="+12%" trendUp />
        <StatCard icon={<Building2 className="w-5 h-5" />} label="福委團數量" value={groups.filter(g => g.group_type === 'welfare').length.toString()} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="待審核福委團" value={totalPendingWelfare.toString()} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('create')}
          className="flex items-center gap-4 p-6 bg-brand-600 rounded-2xl text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold">建立新團體</h4>
            <p className="text-sm text-white/80">開團、設定團號與團型</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('groups')}
          className="flex items-center gap-4 p-6 bg-brand-600 rounded-2xl text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold">查看所有團體</h4>
            <p className="text-sm text-white/80">{groups.length} 個團體</p>
          </div>
        </motion.button>

        {totalPendingWelfare > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('groups')}
            className="flex items-center gap-4 p-6 bg-brand-600 rounded-2xl text-white shadow-lg"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold">待審核福委團</h4>
              <p className="text-sm text-white/80">{totalPendingWelfare} 件待處理</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* Active Groups */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">開放團體列表</h3>
          <button
            onClick={() => onNavigate('groups')}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {activeGroups.slice(0, 5).map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Pending Welfare Groups Alert */}
      {totalPendingWelfare > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-brand-900">待審核福委團</h4>
              <p className="text-sm text-brand-700 mt-1">
                有 {totalPendingWelfare} 個福委團的報名申請等待審核
              </p>
              <button
                onClick={() => onNavigate('groups')}
                className="mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                立即處理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupRow({ group }: { group: GroupListItem }) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      soliciting: { bg: 'bg-green-100', text: 'text-green-700', label: '招募中' },
      guaranteed: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已成團' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已截止' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已結案' },
    };
    return styles[status] || styles.soliciting;
  };

  const status = getStatusBadge(group.status);
  const fillRate = (group.current_pax / group.max_pax) * 100;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{group.series_name || '未命名行程'}</h4>
            <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', status.bg, status.text)}>
              {status.label}
            </span>
            {group.group_type === 'welfare' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                福委團
              </span>
            )}
            {group.group_number && (
              <span className="text-xs text-gray-500 font-mono">{group.group_number}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{group.start_date} ~ {group.end_date}</span>
            <span>•</span>
            <span>截止 {group.seat_release_date}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${fillRate}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-16">
                {group.current_pax}/{group.max_pax}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">報名進度 {group.registration_progress}%</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Groups List Tab
// ============================================

function GroupsListTab({ groups, onEdit, onDelete, onView }: {
  groups: GroupListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'welfare' | 'regular'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'soliciting' | 'guaranteed' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = groups.filter(g => {
    if (filter !== 'all' && g.group_type !== filter) return false;
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (searchQuery && !g.series_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !g.group_number?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋團體名稱或團號..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'welfare', 'regular'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' && '全部'}
              {type === 'welfare' && '福委團'}
              {type === 'regular' && '一般團'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'soliciting', 'guaranteed', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status === 'all' && '全部狀態'}
              {status === 'soliciting' && '招募中'}
              {status === 'guaranteed' && '已成團'}
              {status === 'closed' && '已截止'}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">團體資訊</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">團型</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">日期</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">報名進度</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">狀態</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{group.series_name || '未命名行程'}</p>
                      {group.group_number && (
                        <p className="text-xs text-gray-500 font-mono">{group.group_number}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      group.group_type === 'welfare' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {group.group_type === 'welfare' ? '福委團' : '一般團'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {group.start_date} ~ {group.end_date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all"
                          style={{ width: `${(group.current_pax / group.max_pax) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {group.current_pax}/{group.max_pax}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      group.status === 'soliciting' && 'bg-brand-100 text-brand-700',
                      group.status === 'guaranteed' && 'bg-brand-100 text-brand-700',
                      group.status === 'closed' && 'bg-gray-100 text-gray-600',
                    )}>
                      {group.status === 'soliciting' && '招募中'}
                      {group.status === 'guaranteed' && '已成團'}
                      {group.status === 'closed' && '已截止'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(group.id)}
                        className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(group.id)}
                        className="p-1.5 bg-brand-100 text-brand-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(group.id)}
                        className="p-1.5 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Edit Group Modal
// ============================================

function EditGroupModal({ isOpen, onClose, onSubmit, group }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TourSession>) => void;
  group: GroupListItem;
}) {
  const [formData, setFormData] = useState<Partial<TourSession>>({
    series_id: group.series_id,
    group_number: group.group_number,
    group_type: group.group_type,
    status: group.status,
    start_date: group.start_date,
    end_date: group.end_date,
    min_pax: group.min_pax,
    max_pax: group.max_pax,
    seat_release_date: group.seat_release_date,
    price_twd: group.price_twd,
    agent_commission: group.agent_commission,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="trvic-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">編輯團體</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">行程系列</label>
              <input
                type="text"
                placeholder="例：東京經典五日遊"
                value={formData.series_id || ''}
                onChange={(e) => setFormData({ ...formData, series_id: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">團號</label>
              <input
                type="text"
                placeholder="例：GRP-2025-001"
                value={formData.group_number || ''}
                onChange={(e) => setFormData({ ...formData, group_number: e.target.value })}
                className="trvic-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">團型</label>
              <select
                value={formData.group_type || 'regular'}
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value as 'welfare' | 'regular' })}
                className="trvic-input w-full"
              >
                <option value="regular">一般團</option>
                <option value="welfare">福委團</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">狀態</label>
              <select
                value={formData.status || 'soliciting'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TourSession['status'] })}
                className="trvic-input w-full"
              >
                <option value="soliciting">招募中</option>
                <option value="guaranteed">已成團</option>
                <option value="closed">已截止</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">出發日期</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">結束日期</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最低成團人數</label>
              <input
                type="number"
                min="1"
                value={formData.min_pax || 20}
                onChange={(e) => setFormData({ ...formData, min_pax: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最高人數</label>
              <input
                type="number"
                min="1"
                value={formData.max_pax || 40}
                onChange={(e) => setFormData({ ...formData, max_pax: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">座位釋放日期</label>
              <input
                type="date"
                value={formData.seat_release_date || ''}
                onChange={(e) => setFormData({ ...formData, seat_release_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">價格（TWD）</label>
              <input
                type="number"
                min="0"
                value={formData.price_twd || 0}
                onChange={(e) => setFormData({ ...formData, price_twd: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">業務佣金率</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.agent_commission || 0.15}
                onChange={(e) => setFormData({ ...formData, agent_commission: parseFloat(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="btn-pill btn-pill-secondary flex-1"
            >
              取消
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-pill btn-pill-primary flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              儲存變更
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// View Group Modal
// ============================================

function ViewGroupModal({ isOpen, onClose, group }: {
  isOpen: boolean;
  onClose: () => void;
  group: GroupListItem;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="trvic-card w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">團體詳情</h2>
              <p className="text-sm text-gray-500">{group.group_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">行程系列</p>
              <p className="font-semibold text-gray-900">{group.series_name || group.series_id || '未命名'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">團型</p>
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                group.group_type === 'welfare' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              )}>
                {group.group_type === 'welfare' ? '福委團' : '一般團'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">出發日期</p>
              <p className="font-semibold text-gray-900">{group.start_date}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">結束日期</p>
              <p className="font-semibold text-gray-900">{group.end_date}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">報名進度</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all"
                    style={{ width: `${(group.current_pax / group.max_pax) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {group.current_pax}/{group.max_pax}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">狀態</p>
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                group.status === 'soliciting' && 'bg-brand-100 text-brand-700',
                group.status === 'guaranteed' && 'bg-green-100 text-green-700',
                group.status === 'closed' && 'bg-gray-100 text-gray-600',
              )}>
                {group.status === 'soliciting' && '招募中'}
                {group.status === 'guaranteed' && '已成團'}
                {group.status === 'closed' && '已截止'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">價格</p>
              <p className="font-semibold text-gray-900">{formatCurrency(group.price_twd || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">業務佣金率</p>
              <p className="font-semibold text-gray-900">{(group.agent_commission * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">座位釋放日期</p>
              <p className="font-semibold text-gray-900">{group.seat_release_date || '未設定'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">建立日期</p>
              <p className="font-semibold text-gray-900">{group.created_at}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// Create Group Modal
// ============================================

function CreateGroupModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TourSession>) => void;
}) {
  const [formData, setFormData] = useState<Partial<TourSession>>({
    group_type: 'regular',
    status: 'soliciting',
    min_pax: 20,
    max_pax: 40,
    price_twd: 0,
    agent_commission: 0.15,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="trvic-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">建立新團體</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">行程系列</label>
              <input
                type="text"
                placeholder="例：東京經典五日遊"
                value={formData.series_id || ''}
                onChange={(e) => setFormData({ ...formData, series_id: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">團號</label>
              <input
                type="text"
                placeholder="例：GRP-2025-001"
                value={formData.group_number || ''}
                onChange={(e) => setFormData({ ...formData, group_number: e.target.value })}
                className="trvic-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">團型</label>
              <select
                value={formData.group_type || 'regular'}
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value as 'welfare' | 'regular' })}
                className="trvic-input w-full"
              >
                <option value="regular">一般團</option>
                <option value="welfare">福委團</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">狀態</label>
              <select
                value={formData.status || 'soliciting'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TourSession['status'] })}
                className="trvic-input w-full"
              >
                <option value="soliciting">招募中</option>
                <option value="guaranteed">已成團</option>
                <option value="closed">已截止</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">出發日期</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">結束日期</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最低成團人數</label>
              <input
                type="number"
                min="1"
                value={formData.min_pax || 20}
                onChange={(e) => setFormData({ ...formData, min_pax: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最高人數</label>
              <input
                type="number"
                min="1"
                value={formData.max_pax || 40}
                onChange={(e) => setFormData({ ...formData, max_pax: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">座位釋放日期</label>
              <input
                type="date"
                value={formData.seat_release_date || ''}
                onChange={(e) => setFormData({ ...formData, seat_release_date: e.target.value })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">價格（TWD）</label>
              <input
                type="number"
                min="0"
                value={formData.price_twd || 0}
                onChange={(e) => setFormData({ ...formData, price_twd: parseInt(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">業務佣金率</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.agent_commission || 0.15}
                onChange={(e) => setFormData({ ...formData, agent_commission: parseFloat(e.target.value) })}
                className="trvic-input w-full"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="btn-pill btn-pill-secondary flex-1"
            >
              取消
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-pill btn-pill-primary flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              建立團體
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function SessionManager() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupListItem | null>(null);

  // Connect to service layer hooks
  const { sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useSessions();
  const { createSession, loading: createLoading } = useCreateSession();
  const { updateSession, loading: updateLoading } = useUpdateSession();
  const { deleteSession, loading: deleteLoading } = useDeleteSession();

  // Convert sessions to GroupListItem format
  const groups: GroupListItem[] = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    return sessions.map(convertSessionToGroupListItem);
  }, [sessions]);

  // Get current user ID for audit logging
  const currentUser = AuthService.getCurrentUser();
  const currentUserId = currentUser?.id || 'system';

  const handleCreateGroup = async (data: Partial<TourSession>) => {
    try {
      const createData = convertGroupListItemToCreateSessionData(data);
      const result = await createSession(createData);
      
      if (result.success && result.data) {
        await refetchSessions();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleEdit = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      setSelectedGroup(group);
      setShowEditModal(true);
    }
  };

  const handleUpdateGroup = async (data: Partial<TourSession>) => {
    if (!selectedGroup) return;

    try {
      // Find the original session to get full data
      const originalSession = sessions?.find(s => s.id === selectedGroup.id);
      if (!originalSession) {
        console.error('Original session not found');
        return;
      }

      const updateData = convertGroupListItemToUpdateSessionData(data, originalSession);
      // Note: updateSession hook doesn't expose userId parameter, so we need to call service directly
      // For now, we'll use the hook and let the service handle userId internally
      const result = await updateSession(selectedGroup.id, updateData);
      
      if (result.success) {
        await refetchSessions();
        setShowEditModal(false);
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此團體嗎？')) return;

    try {
      const result = await deleteSession(id);
      if (result.success) {
        await refetchSessions();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleView = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      setSelectedGroup(group);
      setShowViewModal(true);
    }
  };

  // Loading state
  const isLoading = sessionsLoading || createLoading || updateLoading || deleteLoading;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '儀表板', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'groups', label: '團體列表', icon: <Calendar className="w-4 h-4" /> },
    { key: 'create', label: '建立團體', icon: <Plus className="w-4 h-4" /> },
  ];

  // Show loading state
  if (isLoading && groups.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading text="載入團次資料中..." />
      </div>
    );
  }

  // Show error state
  if (sessionsError && groups.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">載入失敗</p>
          <p className="text-gray-600 mb-4">{sessionsError.message || '無法載入團次資料'}</p>
          <button
            onClick={() => refetchSessions()}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">團次管理</h1>
              <p className="text-gray-500">建立與管理旅遊團體</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 flex-wrap"
        >
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              icon={tab.icon}
              label={tab.label}
              badge={tab.badge}
              onClick={() => {
                if (tab.key === 'create') {
                  setShowCreateModal(true);
                } else {
                  setActiveTab(tab.key);
                }
              }}
            />
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab groups={groups} onNavigate={setActiveTab} />
          )}
          {activeTab === 'groups' && (
            <GroupsListTab
              groups={groups}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </motion.div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateGroup}
          />
        )}
      </AnimatePresence>

      {/* Edit Group Modal */}
      <AnimatePresence>
        {showEditModal && selectedGroup && (
          <EditGroupModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedGroup(null);
            }}
            onSubmit={handleUpdateGroup}
            group={selectedGroup}
          />
        )}
      </AnimatePresence>

      {/* View Group Modal */}
      <AnimatePresence>
        {showViewModal && selectedGroup && (
          <ViewGroupModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedGroup(null);
            }}
            group={selectedGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
