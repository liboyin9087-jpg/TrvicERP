import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Plus, Search, Edit, Trash2, Eye,
  ChevronRight, X, Building2, TrendingUp, AlertCircle, Save, UserCheck
} from 'lucide-react';
import { cn } from '../../src/lib/utils'; // Assuming this utility is still valid
import type { TourSession } from '../../types'; // Only TourSession type is directly used here

// ============================================
// Types
// ============================================

type TabKey = 'dashboard' | 'groups'; // 'create' tab is now handled by a modal trigger

// Augment TourSession for display purposes within this component
export interface GroupListItem extends TourSession {
  series_name?: string; // Derived from series_id or external data
  registration_progress: number;
  pending_welfare_count?: number;
}

// ============================================
// Props Interface for SessionManager (Kintone Widget Config)
// ============================================

export interface SessionManagerConfig {
  initialGroups: GroupListItem[]; // Initial groups data provided by the parent/Kintone
  onCreateGroup: (newGroupData: Partial<TourSession>) => Promise<GroupListItem | void> | void; // Callback for creating a new group
  onUpdateGroup: (id: string, updatedGroupData: Partial<TourSession>) => Promise<GroupListItem | void> | void; // Callback for updating a group
  onDeleteGroup: (id: string) => Promise<void> | void; // Callback for deleting a group
  onViewGroupDetails: (id: string) => Promise<void> | void; // Callback for viewing group details (e.g., open a new page/modal)
  // Additional configuration for the widget could go here, e.g., default filters, permissions etc.
}

// ============================================
// Helper Components
// ============================================

// TabButton component is already well-defined, just ensure styling uses tokens
interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

function TabButton({ active, icon, label, onClick, badge }: TabButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all relative',
        active
          ? 'bg-primary-900 text-white shadow-lg' // Using primary token
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-sm flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

// StatCard component is well-defined
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ icon, label, value, trend, trendUp }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-600">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-sm font-medium px-2 py-1 rounded-full',
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

interface DashboardTabProps {
  groups: GroupListItem[];
  onNavigate: (tab: TabKey) => void;
  onOpenCreateModal: () => void; // Callback to open create modal
  onOpenEditModal: (groupId: string) => void; // Callback to open edit modal
}

function DashboardTab({ groups, onNavigate, onOpenCreateModal, onOpenEditModal }: DashboardTabProps) {
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
          onClick={onOpenCreateModal}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl text-white shadow-lg" // Using primary token
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
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
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
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
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
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
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1" // Using primary token
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {activeGroups.slice(0, 5).map((group) => (
            <GroupRow key={group.id} group={group} onEdit={onOpenEditModal} /> // Pass onEdit
          ))}
        </div>
      </div>

      {/* Pending Welfare Groups Alert */}
      {totalPendingWelfare > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
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

interface GroupRowProps {
  group: GroupListItem;
  onEdit: (id: string) => void;
}

function GroupRow({ group, onEdit }: GroupRowProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      soliciting: { bg: 'bg-green-100', text: 'text-green-700', label: '招募中' },
      guaranteed: { bg: 'bg-primary-100', text: 'text-primary-700', label: '已成團' }, // Using primary token
      closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已截止' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已結案' },
    };
    return styles[status] || styles.soliciting;
  };

  const status = getStatusBadge(group.status);
  const fillRate = (group.current_pax / group.max_pax) * 100;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onEdit(group.id)}> {/* Make row clickable for edit/view */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-3">
            <h4 className="font-semibold text-gray-900">{group.series_name || '未命名行程'}</h4>
            <span className={cn('px-2 py-1 rounded-full text-sm font-semibold', status.bg, status.text)}>
              {status.label}
            </span>
            {group.group_type === 'welfare' && (
              <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold"> {/* Using secondary token */}
                福委團
              </span>
            )}
            {group.group_number && (
              <span className="text-sm text-gray-500 font-mono">{group.group_number}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{group.start_date} ~ {group.end_date}</span>
            <span>•</span>
            <span>截止 {group.seat_release_date}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3 sm:mt-0">
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-900 rounded-full transition-all" style={{ width: `${fillRate}%` }} /> {/* Using primary token */}
              </div>
              <span className="text-sm font-semibold text-gray-900 w-16">
                {group.current_pax}/{group.max_pax}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">報名進度 {group.registration_progress}%</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Groups List Tab
// ============================================

interface GroupsListTabProps {
  groups: GroupListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

function GroupsListTab({ groups, onEdit, onDelete, onView }: GroupsListTabProps) {
  const [filter, setFilter] = useState<'all' | 'welfare' | 'regular'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'soliciting' | 'guaranteed' | 'closed' | 'completed'>('all'); // Added 'completed' status
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
      {/* Filters (Responsive layout) */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1 min-w-[200px] lg:max-w-xs"> {/* Added min-width for responsiveness */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋團體名稱或團號..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for buttons */}
          {(['all', 'welfare', 'regular'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                filter === type
                  ? 'bg-primary-900 text-white' // Using primary token
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' && '全部'}
              {type === 'welfare' && '福委團'}
              {type === 'regular' && '一般團'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for buttons */}
          {(['all', 'soliciting', 'guaranteed', 'closed', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                statusFilter === status
                  ? 'bg-primary-900 text-white' // Using primary token
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status === 'all' && '全部狀態'}
              {status === 'soliciting' && '招募中'}
              {status === 'guaranteed' && '已成團'}
              {status === 'closed' && '已截止'}
              {status === 'completed' && '已結案'}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto"> {/* Added overflow-x-auto for responsive tables */}
          <table className="w-full text-sm"> {/* Added text-sm for better table sizing */}
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[150px]">團體資訊</th>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[80px]">團型</th>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[150px]">日期</th>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[120px]">報名進度</th>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[80px]">狀態</th>
                <th className="text-left px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 min-w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">無符合條件的團體</td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div>
                        <p className="font-medium text-gray-900">{group.series_name || '未命名行程'}</p>
                        {group.group_number && (
                          <p className="text-xs sm:text-sm text-gray-500 font-mono">{group.group_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap',
                        group.group_type === 'welfare' ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-600' // Using secondary token
                      )}>
                        {group.group_type === 'welfare' ? '福委團' : '一般團'}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                      {group.start_date} ~ {group.end_date}
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 sm:w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-900 rounded-full transition-all" // Using primary token
                            style={{ width: `${(group.current_pax / group.max_pax) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {group.current_pax}/{group.max_pax}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap',
                        group.status === 'soliciting' && 'bg-green-100 text-green-700',
                        group.status === 'guaranteed' && 'bg-primary-100 text-primary-700', // Using primary token
                        (group.status === 'closed' || group.status === 'completed') && 'bg-gray-100 text-gray-600',
                      )}>
                        {group.status === 'soliciting' && '招募中'}
                        {group.status === 'guaranteed' && '已成團'}
                        {group.status === 'closed' && '已截止'}
                        {group.status === 'completed' && '已結案'}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(group.id)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          aria-label="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(group.id)}
                          className="p-1.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors" // Using primary token
                          aria-label="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(group.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Create/Edit Group Modal (Renamed and refactored)
// ============================================

interface CreateEditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TourSession>, id?: string) => void;
  editingGroup?: GroupListItem | null; // Data for editing an existing group
}

function CreateEditGroupModal({ isOpen, onClose, onSubmit, editingGroup }: CreateEditGroupModalProps) {
  const isEditing = !!editingGroup;
  const initialFormData: Partial<TourSession> = editingGroup ? {
    ...editingGroup,
    series_id: editingGroup.series_name || editingGroup.series_id, // Use series_name for display if available
  } : {
    group_type: 'regular',
    status: 'soliciting',
    min_pax: 20,
    max_pax: 40,
    price_twd: 0,
    agent_commission: 0.15,
    // Default dates for new creation can be current date or empty
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days later
    seat_release_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
  };

  const [formData, setFormData] = useState<Partial<TourSession>>(initialFormData);

  // Reset form data when modal opens/closes or editingGroup changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen, editingGroup]); // eslint-disable-line react-hooks/exhaustive-deps - initialFormData logic ensures correct reset

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'number') {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = 0;
    } else if (name === 'agent_commission' && type === 'number') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = 0;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editingGroup?.id) {
      onSubmit(formData, editingGroup.id);
    } else {
      onSubmit(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"> {/* Using primary token */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"> {/* Using primary token */}
              {isEditing ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? '編輯團體' : '建立新團體'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="series_id" className="block text-sm font-medium text-gray-700 mb-1.5">行程系列</label>
              <input
                id="series_id"
                type="text"
                name="series_id"
                placeholder="例：東京經典五日遊"
                value={formData.series_id || ''}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="group_number" className="block text-sm font-medium text-gray-700 mb-1.5">團號</label>
              <input
                id="group_number"
                type="text"
                name="group_number"
                placeholder="例：GRP-2025-001"
                value={formData.group_number || ''}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="group_type" className="block text-sm font-medium text-gray-700 mb-1.5">團型</label>
              <select
                id="group_type"
                name="group_type"
                value={formData.group_type || 'regular'}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="regular">一般團</option>
                <option value="welfare">福委團</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">狀態</label>
              <select
                id="status"
                name="status"
                value={formData.status || 'soliciting'}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="soliciting">招募中</option>
                <option value="guaranteed">已成團</option>
                <option value="closed">已截止</option>
                <option value="completed">已結案</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1.5">出發日期</label>
              <input
                id="start_date"
                type="date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1.5">結束日期</label>
              <input
                id="end_date"
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="min_pax" className="block text-sm font-medium text-gray-700 mb-1.5">最低成團人數</label>
              <input
                id="min_pax"
                type="number"
                min="1"
                name="min_pax"
                value={formData.min_pax || 0}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="max_pax" className="block text-sm font-medium text-gray-700 mb-1.5">最高人數</label>
              <input
                id="max_pax"
                type="number"
                min="1"
                name="max_pax"
                value={formData.max_pax || 0}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="seat_release_date" className="block text-sm font-medium text-gray-700 mb-1.5">座位釋放日期</label>
              <input
                id="seat_release_date"
                type="date"
                name="seat_release_date"
                value={formData.seat_release_date || ''}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price_twd" className="block text-sm font-medium text-gray-700 mb-1.5">價格（TWD）</label>
              <input
                id="price_twd"
                type="number"
                min="0"
                name="price_twd"
                value={formData.price_twd || 0}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="agent_commission" className="block text-sm font-medium text-gray-700 mb-1.5">業務佣金率</label>
              <input
                id="agent_commission"
                type="number"
                min="0"
                max="1"
                step="0.01"
                name="agent_commission"
                value={formData.agent_commission || 0.15}
                onChange={handleChange}
                className="input-modern w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="btn-pill btn-pill-secondary flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              取消
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-pill btn-pill-primary flex-1 gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center justify-center" // Using primary token
            >
              <Save className="w-4 h-4" />
              {isEditing ? '儲存變更' : '建立團體'}
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

export default function SessionManager(props: SessionManagerConfig) {
  const { initialGroups, onCreateGroup, onUpdateGroup, onDeleteGroup, onViewGroupDetails } = props;

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [editingGroupData, setEditingGroupData] = useState<GroupListItem | null>(null);

  // Memoize groups for consistent filtering/display if it's a large dataset
  const groups = initialGroups;

  const handleOpenCreateModal = useCallback(() => {
    setEditingGroupData(null);
    setShowCreateEditModal(true);
  }, []);

  const handleOpenEditModal = useCallback((id: string) => {
    const groupToEdit = groups.find(g => g.id === id);
    if (groupToEdit) {
      setEditingGroupData(groupToEdit);
      setShowCreateEditModal(true);
    } else {
      console.error(`Group with ID ${id} not found for editing.`);
    }
  }, [groups]);

  const handleCloseModal = useCallback(() => {
    setShowCreateEditModal(false);
    setEditingGroupData(null); // Clear editing data when modal closes
  }, []);

  const handleModalSubmit = useCallback(async (data: Partial<TourSession>, id?: string) => {
    if (id) {
      await onUpdateGroup(id, data);
    } else {
      await onCreateGroup(data);
    }
    // Parent component (Kintone) is responsible for re-fetching or updating its state
    // and passing the new 'initialGroups' back to SessionManager.
    // The modal will close automatically after onSubmit.
  }, [onCreateGroup, onUpdateGroup]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('確定要刪除此團體嗎？此操作無法復原。')) {
      await onDeleteGroup(id);
    }
  }, [onDeleteGroup]);

  const handleView = useCallback(async (id: string) => {
    await onViewGroupDetails(id);
  }, [onViewGroupDetails]);

  // Tab definitions, 'create' is now handled by a modal action
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '儀表板', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'groups', label: '團體列表', icon: <Calendar className="w-4 h-4" /> },
  ];

  const pendingWelfareCount = groups.filter(g => g.group_type === 'welfare' && g.pending_welfare_count && g.pending_welfare_count > 0).reduce((sum, g) => sum + (g.pending_welfare_count || 0), 0);

  return (
    // Standard Dashtail Card structure for a Kintone Widget
    <div className="dashtail-card bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
      {/* Widget Header (Drag Handle) */}
      <div className="dashtail-card-header drag-handle p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">團次管理</h1>
            <p className="text-gray-500">建立與管理旅遊團體</p>
          </div>
        </div>
        {/* Optional: Add a settings button or other widget-level controls here */}
      </div>

      <div className="p-6 pt-4 flex-1 space-y-6">
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
              badge={tab.key === 'dashboard' ? pendingWelfareCount : undefined} // Only show badge on dashboard if there are pending welfare groups
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
          {/* "建立團體" button, not a tab */}
          <TabButton
            active={false}
            icon={<Plus className="w-4 h-4" />}
            label="建立團體"
            onClick={handleOpenCreateModal}
          />
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab} // Key changes to trigger AnimatePresence for tab transitions
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              groups={groups}
              onNavigate={setActiveTab}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
            />
          )}
          {activeTab === 'groups' && (
            <GroupsListTab
              groups={groups}
              onEdit={handleOpenEditModal} // Use handleOpenEditModal for editing
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </motion.div>
      </div>

      {/* Create/Edit Group Modal */}
      <AnimatePresence>
        {showCreateEditModal && (
          <CreateEditGroupModal
            isOpen={showCreateEditModal}
            onClose={handleCloseModal}
            onSubmit={handleModalSubmit}
            editingGroup={editingGroupData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}