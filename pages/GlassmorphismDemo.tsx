import React, { useState } from 'react';
import {
  Plane,
  Users,
  Wallet,
  TrendingUp,
  Calendar,
  Globe,
  MapPin,
  Settings,
  Home,
  FileText,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';

import GlassmorphismDashboard, {
  SidebarNavItem,
  GlassCard,
  SectionTitle,
} from '../components/shared/GlassmorphismDashboard';
import PremiumKpiCard from '../components/shared/PremiumKpiCard';
import FloatingCopilot from '../components/shared/FloatingCopilot';
import { cn } from '../src/lib/utils';

/**
 * Glassmorphism UI Demo Page
 *
 * 展示 TripERP 的高級 Vision Pro 風格介面
 */
const GlassmorphismDemo: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');

  // KPI 數據
  const kpiData = [
    { title: '當前團體', value: '24', trend: 12, icon: Plane, variant: 'default' as const },
    { title: '本月營收', value: '$2.4M', trend: 8, icon: Wallet, variant: 'success' as const },
    { title: '活躍客戶', value: '1,847', trend: 15, icon: Users, variant: 'purple' as const },
    { title: '平均利潤率', value: '18.5%', trend: -2, icon: TrendingUp, variant: 'warning' as const },
  ];

  // 近期團體數據
  const recentGroups = [
    { name: '東京賞櫻團', date: '2024.04.05 - 04.12', pax: 32, status: 'confirmed', profit: '+12%' },
    { name: '峇里島蜜月團', date: '2024.04.10 - 04.16', pax: 18, status: 'pending', profit: '+8%' },
    { name: '歐洲12日遊', date: '2024.05.01 - 05.12', pax: 28, status: 'confirmed', profit: '+15%' },
    { name: '北海道滑雪團', date: '2024.12.20 - 12.27', pax: 24, status: 'draft', profit: '+10%' },
  ];

  const statusColors = {
    confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusLabels = {
    confirmed: '已確認',
    pending: '待確認',
    draft: '草稿',
  };

  // 側邊欄
  const Sidebar = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TripERP</h1>
            <p className="text-xs text-gray-500">旅遊管理系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <SidebarNavItem
          icon={<Home size={18} />}
          label="儀表板"
          isActive={activeNav === 'dashboard'}
          onClick={() => setActiveNav('dashboard')}
        />
        <SidebarNavItem
          icon={<Plane size={18} />}
          label="團體管理"
          isActive={activeNav === 'groups'}
          onClick={() => setActiveNav('groups')}
        />
        <SidebarNavItem
          icon={<Users size={18} />}
          label="客戶中心"
          isActive={activeNav === 'customers'}
          onClick={() => setActiveNav('customers')}
        />
        <SidebarNavItem
          icon={<FileText size={18} />}
          label="報價系統"
          isActive={activeNav === 'quotes'}
          onClick={() => setActiveNav('quotes')}
        />
        <SidebarNavItem
          icon={<BarChart3 size={18} />}
          label="財務報表"
          isActive={activeNav === 'finance'}
          onClick={() => setActiveNav('finance')}
        />
        <SidebarNavItem
          icon={<Calendar size={18} />}
          label="行程規劃"
          isActive={activeNav === 'itinerary'}
          onClick={() => setActiveNav('itinerary')}
        />
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/[0.05]">
        <SidebarNavItem
          icon={<Settings size={18} />}
          label="系統設定"
          isActive={activeNav === 'settings'}
          onClick={() => setActiveNav('settings')}
        />
      </div>
    </div>
  );

  // Header
  const Header = (
    <div className="px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">儀表板</h2>
        <span className="text-sm text-gray-500">歡迎回來，柏穎</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜尋..."
            className="w-64 bg-white/[0.03] border border-white/[0.08] rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
          BY
        </div>
      </div>
    </div>
  );

  return (
    <GlassmorphismDashboard sidebar={Sidebar} header={Header}>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => (
          <PremiumKpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            icon={kpi.icon}
            variant={kpi.variant}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Groups - Takes 2 columns */}
        <GlassCard className="lg:col-span-2 p-6">
          <SectionTitle
            title="近期團體"
            subtitle="最新的團體行程"
            action={
              <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                查看全部 <ChevronRight size={16} />
              </button>
            }
          />

          <div className="space-y-3">
            {recentGroups.map((group, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer sweep-light"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/[0.05]">
                    <MapPin size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                      {group.name}
                    </h4>
                    <p className="text-sm text-gray-500">{group.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-white font-medium">{group.pax} 人</p>
                    <p className="text-sm text-emerald-400">{group.profit}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      statusColors[group.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[group.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <SectionTitle title="快速操作" />

          <div className="space-y-3">
            {[
              { icon: Plane, label: '新增團體', color: 'from-blue-600 to-indigo-700' },
              { icon: FileText, label: '建立報價', color: 'from-emerald-600 to-teal-700' },
              { icon: Users, label: '新增客戶', color: 'from-purple-600 to-pink-700' },
              { icon: MessageSquare, label: '發送通知', color: 'from-amber-600 to-orange-700' },
            ].map((action, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <action.icon size={18} className="text-white" />
                </div>
                <span className="text-white font-medium">{action.label}</span>
                <ChevronRight
                  size={16}
                  className="ml-auto text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Activity Chart Placeholder */}
      <GlassCard className="mt-6 p-6">
        <SectionTitle
          title="營收趨勢"
          subtitle="過去 30 天的營收變化"
          action={
            <select className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500/50">
              <option>過去 30 天</option>
              <option>過去 90 天</option>
              <option>今年</option>
            </select>
          }
        />

        {/* Chart Placeholder */}
        <div className="h-64 flex items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04]">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-500">圖表區域</p>
            <p className="text-sm text-gray-600">整合您喜愛的圖表庫</p>
          </div>
        </div>
      </GlassCard>

      {/* Floating Copilot */}
      <FloatingCopilot />
    </GlassmorphismDashboard>
  );
};

export default GlassmorphismDemo;
