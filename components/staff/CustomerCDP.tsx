import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, User, Phone, Mail, Star, Calendar, TrendingUp,
  Tag, ChevronRight, Crown, Award, Medal, Shield, Plus, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types & Mock Data
// ============================================

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vipLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpend: number;
  tripCount: number;
  lastTrip?: string;
  tags: string[];
  joinDate: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: '王大明', email: 'wang@example.com', phone: '0912-345-678', vipLevel: 'gold', totalSpend: 245000, tripCount: 5, lastTrip: '2024-12-15', tags: ['日本控', '美食家'], joinDate: '2022-03-15' },
  { id: '2', name: '李小華', email: 'lee@example.com', phone: '0923-456-789', vipLevel: 'platinum', totalSpend: 520000, tripCount: 12, lastTrip: '2025-01-05', tags: ['歐洲通', 'VIP'], joinDate: '2020-08-20' },
  { id: '3', name: '張美玲', email: 'chang@example.com', phone: '0934-567-890', vipLevel: 'silver', totalSpend: 98000, tripCount: 2, lastTrip: '2024-08-20', tags: ['親子遊'], joinDate: '2024-01-10' },
  { id: '4', name: '陳志明', email: 'chen@example.com', phone: '0945-678-901', vipLevel: 'bronze', totalSpend: 45000, tripCount: 1, lastTrip: '2024-11-30', tags: [], joinDate: '2024-11-01' },
  { id: '5', name: '林雅婷', email: 'lin@example.com', phone: '0956-789-012', vipLevel: 'gold', totalSpend: 180000, tripCount: 4, lastTrip: '2025-01-02', tags: ['蜜月', '海島控'], joinDate: '2023-05-20' },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// VIP Configuration
const VIP_CONFIG = {
  bronze: { 
    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600', 
    icon: Medal, label: 'Bronze' 
  },
  silver: { 
    bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200',
    iconBg: 'bg-slate-200', iconColor: 'text-slate-600',
    icon: Shield, label: 'Silver' 
  },
  gold: { 
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    icon: Award, label: 'Gold' 
  },
  platinum: { 
    bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100',
    iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
    icon: Crown, label: 'Platinum' 
  },
} as const;

export default function CustomerCDP() {
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selectedVip, setSelectedVip] = useState<string | null>(null);

  // Filtering Logic
  const filteredCustomers = customers
    .filter(c => c.name.includes(search) || c.email.includes(search) || c.phone.includes(search))
    .filter(c => !selectedVip || c.vipLevel === selectedVip);

  // Stats Calculation
  const stats = {
    total: customers.length,
    platinum: customers.filter(c => c.vipLevel === 'platinum').length,
    gold: customers.filter(c => c.vipLevel === 'gold').length,
    totalSpend: customers.reduce((sum, c) => sum + c.totalSpend, 0),
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              CRM Platform
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">客戶資料平台 (CDP)</h2>
          <p className="text-slate-500 mt-1 text-sm">全方位管理客戶關係與消費歷程</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增客戶
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="總客戶數" value={stats.total} color="blue" />
        <StatCard icon={Crown} label="白金會員" value={stats.platinum} color="indigo" />
        <StatCard icon={Award} label="金卡會員" value={stats.gold} color="amber" />
        <StatCard icon={TrendingUp} label="總消費額" value={`NT$ ${(stats.totalSpend / 10000).toFixed(0)}萬`} color="emerald" />
      </motion.div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋客戶姓名、Email 或電話..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <button
            onClick={() => setSelectedVip(null)}
            className={cn(
              'px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              !selectedVip 
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            全部
          </button>
          {Object.entries(VIP_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedVip(selectedVip === key ? key : null)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border',
                selectedVip === key 
                  ? cn(config.bg, config.text, config.border, 'shadow-sm') 
                  : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">客戶資料</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">聯絡方式</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">會員等級</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">消費概況</th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">標籤</th>
                <th className="text-right px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer, index) => {
                const vipConfig = VIP_CONFIG[customer.vipLevel];
                const VipIcon = vipConfig.icon;

                return (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm',
                          vipConfig.iconBg, vipConfig.iconColor
                        )}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {customer.tripCount} 次出遊
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {customer.email}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        vipConfig.bg, vipConfig.text, vipConfig.border
                      )}>
                        <VipIcon className="w-3.5 h-3.5" />
                        {vipConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 font-mono text-sm">
                          NT$ {customer.totalSpend.toLocaleString()}
                        </p>
                        {customer.lastTrip && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Last: {customer.lastTrip}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {customer.tags.length > 0 ? (
                          customer.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-600"
                            >
                              <Tag className="w-3 h-3 text-slate-400" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <motion.button
                        whileHover={{ x: 2 }}
                        className="p-1.5 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="py-20 text-center bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium text-sm">找不到客戶</h3>
            <p className="text-slate-500 text-xs mt-1">請嘗試調整搜尋條件或 VIP 篩選器</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Sub Component: Stat Card
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: number | string, color: 'blue' | 'indigo' | 'amber' | 'emerald' }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-slate-900 font-mono tracking-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}