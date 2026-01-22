import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Calendar, FileText, TrendingUp, Clock, CheckCircle,
  AlertCircle, Plus, Copy, Settings, UserCheck, UserX, Home, Bed,
  Mail, Download, BarChart3, Filter, Search, ChevronRight, X,
  Edit, Trash2, Eye, Send, FileDown, PieChart, DollarSign,
  ClipboardList, UserPlus, Shield, Award, Baby, Heart, Users2
} from 'lucide-react';
import { cn } from '../../src/lib/utils';

// ============================================
// Types
// ============================================

type TabKey = 'dashboard' | 'groups' | 'rules' | 'registration' | 'roster' | 'preparation' | 'reports';

interface WelfareTrip {
  id: string;
  name: string;
  destination: string;
  date: string;
  endDate: string;
  participants: number;
  maxParticipants: number;
  status: 'draft' | 'open' | 'closing' | 'confirmed' | 'completed';
  registrationDeadline: string;
  subsidyType: 'fixed' | 'percentage';
  subsidyAmount: number;
  maxSubsidy: number;
  templateId?: string;
  createdAt: string;
}

interface SubsidyRule {
  id: string;
  name: string;
  seniorityYears: number;
  subsidyType: 'fixed' | 'percentage';
  amount: number;
  maxAmount: number;
  taxExempt: boolean;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  seniority: number;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  roomType: 'single' | 'double' | 'family';
  specialNeeds?: string;
  companions: Companion[];
  subsidyAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

interface Companion {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'other';
  age?: number;
}

interface RoomAssignment {
  roomNumber: string;
  roomType: string;
  occupants: { name: string; employeeId: string }[];
}

// ============================================
// Mock Data
// ============================================

const MOCK_TRIPS: WelfareTrip[] = [
  {
    id: '1', name: '2025 員工旅遊 - 東京五日', destination: '日本東京',
    date: '2025-03-15', endDate: '2025-03-19', participants: 45, maxParticipants: 60,
    status: 'open', registrationDeadline: '2025-02-28',
    subsidyType: 'fixed', subsidyAmount: 15000, maxSubsidy: 15000,
    createdAt: '2025-01-10'
  },
  {
    id: '2', name: '部門旅遊 - 峇里島四日', destination: '印尼峇里島',
    date: '2025-04-20', endDate: '2025-04-23', participants: 28, maxParticipants: 30,
    status: 'closing', registrationDeadline: '2025-03-15',
    subsidyType: 'percentage', subsidyAmount: 50, maxSubsidy: 20000,
    createdAt: '2025-01-15'
  },
  {
    id: '3', name: '家庭日 - 墾丁二日', destination: '台灣墾丁',
    date: '2025-05-01', endDate: '2025-05-02', participants: 120, maxParticipants: 150,
    status: 'confirmed', registrationDeadline: '2025-04-15',
    subsidyType: 'fixed', subsidyAmount: 3000, maxSubsidy: 3000,
    createdAt: '2025-02-01'
  },
];

const MOCK_TEMPLATES = [
  { id: 't1', name: '東京經典五日', destination: '日本東京', days: 5, basePrice: 45000 },
  { id: 't2', name: '沖繩親子四日', destination: '日本沖繩', days: 4, basePrice: 35000 },
  { id: 't3', name: '峇里島豪華五日', destination: '印尼峇里島', days: 5, basePrice: 42000 },
  { id: 't4', name: '墾丁悠活二日', destination: '台灣墾丁', days: 2, basePrice: 8000 },
];

const MOCK_SUBSIDY_RULES: SubsidyRule[] = [
  { id: 'r1', name: '滿1年員工', seniorityYears: 1, subsidyType: 'fixed', amount: 10000, maxAmount: 10000, taxExempt: true },
  { id: 'r2', name: '滿3年員工', seniorityYears: 3, subsidyType: 'fixed', amount: 15000, maxAmount: 15000, taxExempt: true },
  { id: 'r3', name: '滿5年員工', seniorityYears: 5, subsidyType: 'percentage', amount: 60, maxAmount: 25000, taxExempt: false },
  { id: 'r4', name: '滿10年員工', seniorityYears: 10, subsidyType: 'percentage', amount: 80, maxAmount: 35000, taxExempt: false },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: '王小明', department: '研發部', seniority: 5, email: 'wang@company.com', status: 'approved', registrationDate: '2025-01-15', roomType: 'double', companions: [{ id: 'c1', name: '王太太', relationship: 'spouse' }], subsidyAmount: 15000, paymentStatus: 'paid' },
  { id: 'e2', name: '李美玲', department: '行銷部', seniority: 3, email: 'lee@company.com', status: 'approved', registrationDate: '2025-01-16', roomType: 'single', companions: [], subsidyAmount: 15000, paymentStatus: 'paid' },
  { id: 'e3', name: '張大偉', department: '業務部', seniority: 2, email: 'chang@company.com', status: 'pending', registrationDate: '2025-01-18', roomType: 'family', specialNeeds: '素食', companions: [{ id: 'c2', name: '張太太', relationship: 'spouse' }, { id: 'c3', name: '張小寶', relationship: 'child', age: 5 }], subsidyAmount: 10000, paymentStatus: 'unpaid' },
  { id: 'e4', name: '陳志豪', department: '人資部', seniority: 1, email: 'chen@company.com', status: 'pending', registrationDate: '2025-01-19', roomType: 'double', companions: [{ id: 'c4', name: '陳小姐', relationship: 'other' }], subsidyAmount: 10000, paymentStatus: 'unpaid' },
  { id: 'e5', name: '林雅婷', department: '財務部', seniority: 0.5, email: 'lin@company.com', status: 'rejected', registrationDate: '2025-01-20', roomType: 'single', companions: [], subsidyAmount: 0, paymentStatus: 'unpaid' },
];

const MOCK_ROOMS: RoomAssignment[] = [
  { roomNumber: '501', roomType: '雙人房', occupants: [{ name: '王小明', employeeId: 'e1' }, { name: '王太太', employeeId: 'e1' }] },
  { roomNumber: '502', roomType: '單人房', occupants: [{ name: '李美玲', employeeId: 'e2' }] },
  { roomNumber: '503', roomType: '家庭房', occupants: [{ name: '張大偉', employeeId: 'e3' }, { name: '張太太', employeeId: 'e3' }, { name: '張小寶', employeeId: 'e3' }] },
];

// ============================================
// Helper Components
// ============================================

function StatCard({ icon, label, value, trend, trendUp }: {
  icon: React.ReactNode; label: string; value: string; trend?: string; trendUp?: boolean
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
        <span className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
          active ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
        )}>
          {badge}
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// Tab Content Components
// ============================================

// Dashboard Tab
function DashboardTab({ trips, employees, onNavigate }: {
  trips: WelfareTrip[]; employees: Employee[]; onNavigate: (tab: TabKey) => void;
}) {
  const pendingCount = employees.filter(e => e.status === 'pending').length;
  const approvedCount = employees.filter(e => e.status === 'approved').length;
  const totalParticipants = trips.reduce((sum, t) => sum + t.participants, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="w-5 h-5" />} label="進行中活動" value={trips.filter(t => t.status !== 'completed').length.toString()} />
        <StatCard icon={<Users className="w-5 h-5" />} label="總報名人數" value={totalParticipants.toString()} trend="+12%" trendUp />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="已審核通過" value={approvedCount.toString()} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="待審核申請" value={pendingCount.toString()} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('groups')}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold">建立新活動</h4>
            <p className="text-sm text-white/80">從模板建立企業專屬團體</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('registration')}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold">審核報名</h4>
            <p className="text-sm text-white/80">{pendingCount} 件待審核</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('reports')}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl text-white shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold">查看報表</h4>
            <p className="text-sm text-white/80">報名率與參與統計</p>
          </div>
        </motion.button>
      </div>

      {/* Active Trips */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">我的活動</h3>
          <button
            onClick={() => onNavigate('groups')}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {trips.slice(0, 3).map((trip) => (
            <TripRow key={trip.id} trip={trip} />
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-900">待審核名單</h4>
              <p className="text-sm text-amber-700 mt-1">
                有 {pendingCount} 位員工的報名申請等待審核
              </p>
              <button
                onClick={() => onNavigate('registration')}
                className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                立即審核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TripRow({ trip }: { trip: WelfareTrip }) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: '草稿' },
      open: { bg: 'bg-green-100', text: 'text-green-700', label: '報名中' },
      closing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '即將截止' },
      confirmed: { bg: 'bg-brand-100', text: 'text-brand-700', label: '已確認' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已結束' },
    };
    return styles[status] || styles.draft;
  };

  const status = getStatusBadge(trip.status);
  const fillRate = (trip.participants / trip.maxParticipants) * 100;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{trip.name}</h4>
            <span className={cn('px-2 py-1 rounded-full text-xs font-semibold', status.bg, status.text)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>{trip.destination}</span>
            <span>•</span>
            <span>{trip.date} ~ {trip.endDate}</span>
            <span>•</span>
            <span>截止 {trip.registrationDeadline}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${fillRate}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-16">
                {trip.participants}/{trip.maxParticipants}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">報名進度</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Groups Tab - 建立/複製團體
function GroupsTab({ trips, templates }: { trips: WelfareTrip[]; templates: typeof MOCK_TEMPLATES }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">團體活動管理</h3>
          <p className="text-sm text-gray-500 mt-1">從旅行社模板建立企業專屬團體</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          建立新活動
        </motion.button>
      </div>

      {/* Available Templates */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900">可用行程模板</h4>
          <p className="text-sm text-gray-500 mt-1">選擇旅行社提供的行程，快速建立活動</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.01 }}
              className={cn(
                'p-4 border-2 rounded-xl cursor-pointer transition-all',
                selectedTemplate === template.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-semibold text-gray-900">{template.name}</h5>
                  <p className="text-sm text-gray-500 mt-1">{template.destination} · {template.days}天</p>
                </div>
                <span className="text-lg font-bold text-brand-600">
                  NT${template.basePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  <Copy className="w-4 h-4 inline mr-1" />
                  複製建立
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Existing Trips */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900">已建立的活動</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {trips.map((trip) => (
            <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-gray-900">{trip.name}</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    {trip.destination} · {trip.date} ~ {trip.endDate}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      補助: {trip.subsidyType === 'fixed' ? `NT$${trip.subsidyAmount.toLocaleString()}` : `${trip.subsidyAmount}%`}
                    </span>
                    <span className="text-gray-500">上限: NT${trip.maxSubsidy.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Rules Tab - 資格規則設定
function RulesTab({ rules }: { rules: SubsidyRule[] }) {
  const [showAddRule, setShowAddRule] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">資格與補助規則</h3>
          <p className="text-sm text-gray-500 mt-1">設定年資門檻、補助金額與親友加購限制</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          新增規則
        </motion.button>
      </div>

      {/* Eligibility Rules */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            年資補助階梯
          </h4>
        </div>
        <div className="divide-y divide-gray-100">
          {rules.map((rule) => (
            <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{rule.name}</h5>
                    <p className="text-sm text-gray-500 mt-1">
                      年資 ≥ {rule.seniorityYears} 年
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {rule.subsidyType === 'fixed'
                        ? `NT$${rule.amount.toLocaleString()}`
                        : `${rule.amount}%`}
                    </p>
                    <p className="text-xs text-gray-500">
                      上限 NT${rule.maxAmount.toLocaleString()}
                    </p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    rule.taxExempt ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {rule.taxExempt ? '免稅' : '需申報'}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Companion Rules */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-accent-500" />
            親友加購規則
          </h4>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-gray-900">配偶</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">可加購 1 位</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                享 50% 補助
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Baby className="w-5 h-5 text-brand-500" />
              <span className="font-medium text-gray-900">子女</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">可加購 2 位</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                12歲以下半價
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">其他親友</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">可加購 1 位</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                自費全額
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Registration Tab - 報名審核
function RegistrationTab({ employees, onApprove, onReject }: {
  employees: Employee[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = employees.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (searchQuery && !e.name.includes(searchQuery) && !e.department.includes(searchQuery)) return false;
    return true;
  });

  const pendingCount = employees.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">報名審核</h3>
          <p className="text-sm text-gray-500 mt-1">審核員工報名申請，管理報名名單</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            {pendingCount} 件待審核
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋員工姓名或部門..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {status === 'all' && '全部'}
              {status === 'pending' && '待審核'}
              {status === 'approved' && '已通過'}
              {status === 'rejected' && '已駁回'}
            </button>
          ))}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">員工</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">部門</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">年資</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">房型</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">同行者</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">補助</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">狀態</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.seniority} 年</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {emp.roomType === 'single' && '單人房'}
                    {emp.roomType === 'double' && '雙人房'}
                    {emp.roomType === 'family' && '家庭房'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {emp.companions.length > 0 ? (
                      <span>{emp.companions.map(c => c.name).join(', ')}</span>
                    ) : (
                      <span className="text-gray-400">無</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    NT${emp.subsidyAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      emp.status === 'approved' && 'bg-green-100 text-green-700',
                      emp.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                      emp.status === 'rejected' && 'bg-red-100 text-red-700',
                    )}>
                      {emp.status === 'approved' && '已通過'}
                      {emp.status === 'pending' && '待審核'}
                      {emp.status === 'rejected' && '已駁回'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {emp.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApprove(emp.id)}
                          className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(emp.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {emp.status !== 'pending' && (
                      <button className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
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

// Seat Chart View Component
function SeatChartView({ employees }: { employees: Employee[] }) {
  const [totalSeats] = useState(40);
  const [seatAssignments, setSeatAssignments] = useState<Record<number, { name: string; employeeId: string }>>({});
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const assignedCount = Object.keys(seatAssignments).length;
  const availableCount = totalSeats - assignedCount;

  const handleSeatClick = (seatNum: number) => {
    if (seatAssignments[seatNum]) {
      // 取消分配
      const updated = { ...seatAssignments };
      delete updated[seatNum];
      setSeatAssignments(updated);
    } else {
      // 分配座位
      setSelectedSeat(seatNum);
      setShowAssignModal(true);
    }
  };

  const handleAssignSeat = (employeeId: string) => {
    if (selectedSeat !== null) {
      const employee = employees.find(e => e.id === employeeId);
      if (employee) {
        setSeatAssignments({
          ...seatAssignments,
          [selectedSeat]: { name: employee.name, employeeId: employee.id },
        });
      }
      setShowAssignModal(false);
      setSelectedSeat(null);
    }
  };

  const autoAssign = () => {
    const unassigned = employees.filter(e => !Object.values(seatAssignments).some(s => s.employeeId === e.id));
    const newAssignments: Record<number, { name: string; employeeId: string }> = { ...seatAssignments };
    let seatNum = 1;
    for (const emp of unassigned) {
      while (newAssignments[seatNum] && seatNum <= totalSeats) seatNum++;
      if (seatNum <= totalSeats) {
        newAssignments[seatNum] = { name: emp.name, employeeId: emp.id };
        seatNum++;
      }
    }
    setSeatAssignments(newAssignments);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">總座位數</p>
          <p className="text-2xl font-bold text-gray-900">{totalSeats}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">已分配</p>
          <p className="text-2xl font-bold text-brand-600">{assignedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">可用</p>
          <p className="text-2xl font-bold text-green-600">{availableCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span className="text-sm text-gray-600">可用</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brand-100 border border-brand-300 rounded" />
            <span className="text-sm text-gray-600">已分配</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={autoAssign}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          自動分配
        </motion.button>
      </div>

      {/* Seat Grid */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNum) => {
            const assignment = seatAssignments[seatNum];
            return (
              <motion.button
                key={seatNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSeatClick(seatNum)}
                className={cn(
                  'aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all',
                  assignment
                    ? 'bg-brand-100 border-brand-300 text-brand-700'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                )}
              >
                <span className="font-bold">{String(seatNum).padStart(2, '0')}</span>
                {assignment && (
                  <span className="text-[10px] mt-1 truncate w-full px-1">{assignment.name}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedSeat !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">分配座位 {String(selectedSeat).padStart(2, '0')}</h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedSeat(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {employees.map((emp) => {
                  const isAssigned = Object.values(seatAssignments).some(s => s.employeeId === emp.id);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => !isAssigned && handleAssignSeat(emp.id)}
                      disabled={isAssigned}
                      className={cn(
                        'w-full p-3 rounded-lg text-left transition-colors',
                        isAssigned
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                      )}
                    >
                      <p className="font-medium">{emp.name}</p>
                      {isAssigned && <p className="text-xs text-gray-400 mt-1">已分配座位</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Roster Tab - 名單管理（分房/座位）
function RosterTab({ employees, rooms }: { employees: Employee[]; rooms: RoomAssignment[] }) {
  const [viewMode, setViewMode] = useState<'room' | 'seat'>('room');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">名單管理</h3>
          <p className="text-sm text-gray-500 mt-1">自動分房配置與座位安排</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('room')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'room' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            <Bed className="w-4 h-4 inline mr-1" />
            房間配置
          </button>
          <button
            onClick={() => setViewMode('seat')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'seat' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            <Users className="w-4 h-4 inline mr-1" />
            座位表
          </button>
        </div>
      </div>

      {viewMode === 'room' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <motion.div
              key={room.roomNumber}
              whileHover={{ scale: 1.01 }}
              className="bg-white p-6 rounded-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Home className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">房號 {room.roomNumber}</h4>
                    <p className="text-xs text-gray-500">{room.roomType}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                {room.occupants.map((occupant, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {occupant.name[0]}
                    </div>
                    <span className="text-sm text-gray-700">{occupant.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.01 }}
            className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">自動分配</span>
          </motion.button>
        </div>
      )}

      {viewMode === 'seat' && (
        <SeatChartView employees={employees} />
      )}

      {/* Special Needs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900">特殊需求</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {employees.filter(e => e.specialNeeds).map((emp) => (
            <div key={emp.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{emp.name}</p>
                  <p className="text-sm text-orange-600">{emp.specialNeeds}</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                需注意
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Preparation Tab - 出團前準備
function PreparationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">出團前準備</h3>
        <p className="text-sm text-gray-500 mt-1">產生文件與發送通知</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Generation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <FileDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">個人行程表</h4>
              <p className="text-sm text-gray-500">含補助資訊的 PDF 文件</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              產生全部行程表
            </button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              預覽範本
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">通知發送</h4>
              <p className="text-sm text-gray-500">LINE 群組與 Email 通知</p>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full py-3 bg-[#00B900] text-white rounded-xl font-medium hover:bg-[#009900] transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              發送 LINE 通知
            </button>
            <button className="w-full py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              發送 Email 通知
            </button>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900">出團檢核清單</h4>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: '報名名單確認', done: true },
            { label: '房間配置完成', done: true },
            { label: '特殊需求已備註', done: true },
            { label: '行程表已產生', done: false },
            { label: '通知已發送', done: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                item.done ? 'bg-green-100' : 'bg-gray-100'
              )}>
                {item.done ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span className={cn(
                'text-sm',
                item.done ? 'text-gray-900' : 'text-gray-500'
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reports Tab - 報表與分析
function ReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">報表與分析</h3>
        <p className="text-sm text-gray-500 mt-1">報名統計與活動分析（非財務）</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="報名完成率" value="78%" trend="+5%" trendUp />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="平均參與人數" value="64" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="年度活動數" value="4" />
        <StatCard icon={<PieChart className="w-5 h-5" />} label="員工涵蓋率" value="85%" />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="font-bold text-gray-900 mb-4">報名趨勢</h4>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">圖表功能開發中</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h4 className="font-bold text-gray-900 mb-4">部門參與率</h4>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">圖表功能開發中</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 mb-4">匯出報表</h4>
        <div className="flex gap-4">
          <button className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            匯出 Excel
          </button>
          <button className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
            <FileDown className="w-4 h-4" />
            匯出 PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function WelfareDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [trips] = useState<WelfareTrip[]>(MOCK_TRIPS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [rules] = useState<SubsidyRule[]>(MOCK_SUBSIDY_RULES);
  const [rooms] = useState<RoomAssignment[]>(MOCK_ROOMS);

  const pendingCount = employees.filter(e => e.status === 'pending').length;

  const handleApprove = (id: string) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'approved' as const } : e
    ));
  };

  const handleReject = (id: string) => {
    setEmployees(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'rejected' as const } : e
    ));
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: '儀表板', icon: <Building2 className="w-4 h-4" /> },
    { key: 'groups', label: '團體管理', icon: <Calendar className="w-4 h-4" /> },
    { key: 'rules', label: '資格規則', icon: <Settings className="w-4 h-4" /> },
    { key: 'registration', label: '報名審核', icon: <UserCheck className="w-4 h-4" />, badge: pendingCount },
    { key: 'roster', label: '名單配置', icon: <Bed className="w-4 h-4" /> },
    { key: 'preparation', label: '出團準備', icon: <FileText className="w-4 h-4" /> },
    { key: 'reports', label: '報表分析', icon: <BarChart3 className="w-4 h-4" /> },
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
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">福委會專區</h1>
              <p className="text-gray-500">員工旅遊活動管理平台</p>
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
              onClick={() => setActiveTab(tab.key)}
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
            <DashboardTab trips={trips} employees={employees} onNavigate={setActiveTab} />
          )}
          {activeTab === 'groups' && (
            <GroupsTab trips={trips} templates={MOCK_TEMPLATES} />
          )}
          {activeTab === 'rules' && (
            <RulesTab rules={rules} />
          )}
          {activeTab === 'registration' && (
            <RegistrationTab
              employees={employees}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeTab === 'roster' && (
            <RosterTab employees={employees} rooms={rooms} />
          )}
          {activeTab === 'preparation' && (
            <PreparationTab />
          )}
          {activeTab === 'reports' && (
            <ReportsTab />
          )}
        </motion.div>
      </div>
    </div>
  );
}
