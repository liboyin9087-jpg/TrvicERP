import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Plus, Search, Filter, Edit, Trash2, Eye,
  ChevronRight, X, Building2, MapPin, Clock, TrendingUp, AlertCircle,
  CheckCircle, FileText, Download, Copy, Settings, UserCheck, Bed,
  Bus, User, Phone, Mail, Save
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import type { TourSession, Booking, HotelRoomAllocation, SeatAssignment, TourLeader, MeetingInfo } from '../../types';

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
// Mock Data
// ============================================

const MOCK_TOUR_LEADERS: TourLeader[] = [
  { id: 'tl1', name: '張導遊', phone: '0912-345-678', email: 'guide1@travel.com', license_number: 'TL-2020-001', experience_years: 5 },
  { id: 'tl2', name: '李領隊', phone: '0912-345-679', email: 'guide2@travel.com', license_number: 'TL-2018-015', experience_years: 8 },
  { id: 'tl3', name: '王導遊', phone: '0912-345-680', email: 'guide3@travel.com', license_number: 'TL-2021-023', experience_years: 3 },
];

const MOCK_GROUPS: GroupListItem[] = [
  {
    id: 's1',
    series_id: 'series_tokyo_2025',
    group_number: 'GRP-2025-001',
    group_type: 'regular',
    series_name: '東京經典五日遊',
    start_date: '2025-03-15',
    end_date: '2025-03-19',
    status: 'soliciting',
    min_pax: 20,
    max_pax: 40,
    current_pax: 28,
    seat_release_date: '2025-02-28',
    price_twd: 45000,
    agent_commission: 0.15,
    registration_progress: 70,
    created_at: '2025-01-10',
  },
  {
    id: 's2',
    series_id: 'series_hokkaido_2025',
    group_number: 'GRP-2025-002',
    group_type: 'welfare',
    series_name: '北海道絕景五日遊',
    start_date: '2025-04-20',
    end_date: '2025-04-24',
    status: 'guaranteed',
    min_pax: 30,
    max_pax: 60,
    current_pax: 45,
    seat_release_date: '2025-03-15',
    price_twd: 55000,
    agent_commission: 0.12,
    registration_progress: 75,
    pending_welfare_count: 5,
    created_at: '2025-01-15',
  },
  {
    id: 's3',
    series_id: 'series_bali_2025',
    group_number: 'GRP-2025-003',
    group_type: 'regular',
    series_name: '峇里島豪華五日遊',
    start_date: '2025-05-10',
    end_date: '2025-05-14',
    status: 'soliciting',
    min_pax: 15,
    max_pax: 30,
    current_pax: 12,
    seat_release_date: '2025-04-20',
    price_twd: 42000,
    agent_commission: 0.18,
    registration_progress: 40,
    created_at: '2025-02-01',
  },
];

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
        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-600">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl text-white shadow-lg"
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
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl text-white shadow-lg"
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
            className="flex items-center gap-4 p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg"
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
              <h4 className="font-bold text-amber-900">待審核福委團</h4>
              <p className="text-sm text-amber-700 mt-1">
                有 {totalPendingWelfare} 個福委團的報名申請等待審核
              </p>
              <button
                onClick={() => onNavigate('groups')}
                className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
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
      guaranteed: { bg: 'bg-brand-100', text: 'text-brand-700', label: '已成團' },
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
              <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-semibold">
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
                      group.group_type === 'welfare' ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'
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
                      group.status === 'soliciting' && 'bg-green-100 text-green-700',
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
                        className="p-1.5 bg-brand-100 text-brand-600 rounded-lg hover:bg-brand-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(group.id)}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
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
                className="input-modern w-full"
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
                className="input-modern w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">團型</label>
              <select
                value={formData.group_type || 'regular'}
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value as 'welfare' | 'regular' })}
                className="input-modern w-full"
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
                className="input-modern w-full"
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
                className="input-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">結束日期</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input-modern w-full"
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
                className="input-modern w-full"
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
                className="input-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">座位釋放日期</label>
              <input
                type="date"
                value={formData.seat_release_date || ''}
                onChange={(e) => setFormData({ ...formData, seat_release_date: e.target.value })}
                className="input-modern w-full"
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
                className="input-modern w-full"
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
                className="input-modern w-full"
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
  const [groups, setGroups] = useState<GroupListItem[]>(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateGroup = (data: Partial<TourSession>) => {
    const newGroup: GroupListItem = {
      id: `s${Date.now()}`,
      series_id: data.series_id || '',
      group_number: data.group_number || `GRP-${new Date().getFullYear()}-${String(groups.length + 1).padStart(3, '0')}`,
      group_type: data.group_type || 'regular',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      status: data.status || 'soliciting',
      min_pax: data.min_pax || 20,
      max_pax: data.max_pax || 40,
      current_pax: 0,
      seat_release_date: data.seat_release_date || '',
      price_twd: data.price_twd || 0,
      agent_commission: data.agent_commission || 0.15,
      registration_progress: 0,
      created_at: new Date().toISOString().split('T')[0],
    };
    setGroups([...groups, newGroup]);
  };

  const handleEdit = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      // 預填表單並切換到編輯模式
      setActiveTab('create');
      // 將編輯的資料存入 sessionStorage 供表單使用
      sessionStorage.setItem('editingGroup', JSON.stringify(group));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除此團體嗎？')) {
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  const handleView = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      // 顯示詳情 Modal
      alert(`團號：${group.group_number}\n` +
        `系列：${group.series_name}\n` +
        `日期：${group.start_date} ~ ${group.end_date}\n` +
        `人數：${group.current_pax}/${group.max_pax}\n` +
        `狀態：${group.status}\n` +
        `報價：NT$ ${group.price_twd.toLocaleString()}`);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '儀表板', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'groups', label: '團體列表', icon: <Calendar className="w-4 h-4" /> },
    { key: 'create', label: '建立團體', icon: <Plus className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/25">
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
    </div>
  );
}
