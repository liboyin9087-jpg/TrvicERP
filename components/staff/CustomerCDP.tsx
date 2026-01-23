import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Users, User, Phone, Mail, Star, Calendar, TrendingUp,
  Tag, ChevronRight, Crown, Award, Medal, Shield, Plus, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const VIP_CONFIG: Record<string, { bg: string; text: string; gradient: string; icon: React.ElementType; label: string }> = {
  bronze: { bg: 'bg-orange-50', text: 'text-orange-700', gradient: 'from-orange-400 to-amber-500', icon: Medal, label: 'Bronze' },
  silver: { bg: 'bg-slate-100', text: 'text-slate-700', gradient: 'from-slate-400 to-slate-500', icon: Shield, label: 'Silver' },
  gold: { bg: 'bg-amber-50', text: 'text-amber-700', gradient: 'from-amber-400 to-yellow-500', icon: Award, label: 'Gold' },
  platinum: { bg: 'bg-brand-50', text: 'text-brand-700', gradient: 'from-brand-500 to-brand-700', icon: Crown, label: 'Platinum' },
};

export default function CustomerCDP() {
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selectedVip, setSelectedVip] = useState<string | null>(null);

  const filteredCustomers = customers
    .filter(c => c.name.includes(search) || c.email.includes(search) || c.phone.includes(search))
    .filter(c => !selectedVip || c.vipLevel === selectedVip);

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
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              CDP
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">客戶管理</h2>
          <p className="text-slate-500 mt-1">客戶資料平台與分析</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-pill btn-pill-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          新增客戶
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="總客戶數" value={stats.total} />
        <StatCard icon={Crown} label="白金會員" value={stats.platinum} color="purple" />
        <StatCard icon={Award} label="金卡會員" value={stats.gold} color="amber" />
        <StatCard icon={TrendingUp} label="總消費額" value={`NT$ ${(stats.totalSpend / 10000).toFixed(0)}萬`} color="emerald" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋客戶姓名、Email 或電話..."
            className="input-modern w-full pl-12 pr-4"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSelectedVip(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              !selectedVip ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            全部
          </button>
          {Object.entries(VIP_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedVip(selectedVip === key ? null : key)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                selectedVip === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div variants={itemVariants} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">客戶</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">聯絡方式</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">等級</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">消費紀錄</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">標籤</th>
                <th className="text-right px-6 py-4"></th>
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
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg',
                          vipConfig.gradient
                        )}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {customer.tripCount} 次出遊
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
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
                    <td className="px-6 py-5">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                        vipConfig.bg, vipConfig.text
                      )}>
                        <VipIcon className="w-3.5 h-3.5" />
                        {vipConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-slate-900">
                          NT$ {customer.totalSpend.toLocaleString()}
                        </p>
                        {customer.lastTrip && (
                          <p className="text-xs text-slate-400 mt-1">
                            上次出遊 {customer.lastTrip}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {customer.tags.length > 0 ? (
                          customer.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <motion.button
                        whileHover={{ scale: 1.1, x: 2 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">沒有符合條件的客戶</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: 'purple' | 'amber' | 'emerald';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorStyles = {
    purple: 'from-brand-500 to-brand-700',
    amber: 'from-amber-500 to-yellow-500',
    emerald: 'from-emerald-500 to-teal-500',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          color ? `bg-gradient-to-br ${colorStyles[color]}` : 'bg-slate-100'
        )}>
          <Icon className={cn('w-5 h-5', color ? 'text-white' : 'text-slate-600')} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
