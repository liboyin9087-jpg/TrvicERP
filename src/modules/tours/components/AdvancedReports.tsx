import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, MapPin,
  Download, Filter, RefreshCw, ChevronDown, FileText, Plane,
  Building2, CreditCard, PieChart as PieChartIcon, BarChart3, Activity
} from 'lucide-react';

// Types
interface SalesData {
  month: string;
  revenue: number;
  bookings: number;
  avgPrice: number;
  target: number;
}

interface DestinationData {
  name: string;
  bookings: number;
  revenue: number;
  growth: number;
}

interface SupplierPayment {
  supplier: string;
  type: string;
  totalDue: number;
  paid: number;
  pending: number;
  dueDate: string;
}

interface GroupStats {
  status: string;
  count: number;
  percentage: number;
}

// Mock Data
const salesTrendData: SalesData[] = [
  { month: '1月', revenue: 2800000, bookings: 45, avgPrice: 62222, target: 3000000 },
  { month: '2月', revenue: 3200000, bookings: 52, avgPrice: 61538, target: 3000000 },
  { month: '3月', revenue: 4100000, bookings: 68, avgPrice: 60294, target: 3500000 },
  { month: '4月', revenue: 3800000, bookings: 58, avgPrice: 65517, target: 3500000 },
  { month: '5月', revenue: 4500000, bookings: 72, avgPrice: 62500, target: 4000000 },
  { month: '6月', revenue: 5200000, bookings: 85, avgPrice: 61176, target: 4500000 },
  { month: '7月', revenue: 6800000, bookings: 110, avgPrice: 61818, target: 5000000 },
  { month: '8月', revenue: 7200000, bookings: 118, avgPrice: 61017, target: 5500000 },
  { month: '9月', revenue: 5500000, bookings: 88, avgPrice: 62500, target: 5000000 },
  { month: '10月', revenue: 4800000, bookings: 75, avgPrice: 64000, target: 4500000 },
  { month: '11月', revenue: 4200000, bookings: 65, avgPrice: 64615, target: 4000000 },
  { month: '12月', revenue: 5800000, bookings: 92, avgPrice: 63043, target: 5000000 },
];

const destinationData: DestinationData[] = [
  { name: '日本', bookings: 320, revenue: 12800000, growth: 15.2 },
  { name: '韓國', bookings: 180, revenue: 5400000, growth: 8.5 },
  { name: '泰國', bookings: 150, revenue: 3750000, growth: -2.3 },
  { name: '越南', bookings: 95, revenue: 2375000, growth: 22.1 },
  { name: '歐洲', bookings: 45, revenue: 5850000, growth: 18.7 },
  { name: '國內', bookings: 280, revenue: 5600000, growth: 5.8 },
];

const groupStatusData: GroupStats[] = [
  { status: '已成團', count: 45, percentage: 38 },
  { status: '收客中', count: 32, percentage: 27 },
  { status: '待確認', count: 18, percentage: 15 },
  { status: '已出發', count: 12, percentage: 10 },
  { status: '已結團', count: 8, percentage: 7 },
  { status: '已取消', count: 3, percentage: 3 },
];

const supplierPayments: SupplierPayment[] = [
  { supplier: '全日空航空', type: '機票', totalDue: 2500000, paid: 1800000, pending: 700000, dueDate: '2024-03-15' },
  { supplier: '東京帝國飯店', type: '住宿', totalDue: 1200000, paid: 600000, pending: 600000, dueDate: '2024-03-10' },
  { supplier: '韓亞航空', type: '機票', totalDue: 850000, paid: 850000, pending: 0, dueDate: '2024-03-05' },
  { supplier: '首爾樂天酒店', type: '住宿', totalDue: 680000, paid: 340000, pending: 340000, dueDate: '2024-03-20' },
  { supplier: '泰國地接社', type: '地接', totalDue: 420000, paid: 210000, pending: 210000, dueDate: '2024-03-25' },
];

const monthlyComparisonData = [
  { month: '1月', thisYear: 2800000, lastYear: 2400000 },
  { month: '2月', thisYear: 3200000, lastYear: 2800000 },
  { month: '3月', thisYear: 4100000, lastYear: 3500000 },
  { month: '4月', thisYear: 3800000, lastYear: 3200000 },
  { month: '5月', thisYear: 4500000, lastYear: 4000000 },
  { month: '6月', thisYear: 5200000, lastYear: 4800000 },
];

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Components
const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
  icon: any;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-slate-200 p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        <div className={`flex items-center gap-1 mt-2 text-sm ${
          changeType === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{change} vs 上月</span>
        </div>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const ChartCard = ({
  title,
  subtitle,
  children,
  actions
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium text-slate-900">
              {typeof entry.value === 'number' && entry.value > 10000
                ? `NT$ ${(entry.value / 10000).toFixed(0)}萬`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Main Component
export default function AdvancedReports() {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sales' | 'groups' | 'suppliers'>('overview');

  const totalRevenue = salesTrendData.reduce((sum, d) => sum + d.revenue, 0);
  const totalBookings = salesTrendData.reduce((sum, d) => sum + d.bookings, 0);
  const avgOrderValue = Math.round(totalRevenue / totalBookings);
  const totalPendingPayments = supplierPayments.reduce((sum, s) => sum + s.pending, 0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">營運報表</h1>
          <p className="text-slate-500">銷售分析與財務報表</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="thisMonth">本月</option>
            <option value="lastMonth">上月</option>
            <option value="thisQuarter">本季</option>
            <option value="thisYear">今年</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            篩選
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Download className="w-4 h-4" />
            匯出報表
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-slate-200 w-fit">
        {[
          { id: 'overview', label: '總覽', icon: Activity },
          { id: 'sales', label: '銷售分析', icon: BarChart3 },
          { id: 'groups', label: '成團分析', icon: Users },
          { id: 'suppliers', label: '供應商帳款', icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedReport === tab.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="總營收"
              value={`NT$ ${(totalRevenue / 10000).toFixed(0)}萬`}
              change="+12.5%"
              changeType="up"
              icon={DollarSign}
              color="bg-indigo-500"
            />
            <StatCard
              title="總訂單數"
              value={totalBookings.toString()}
              change="+8.2%"
              changeType="up"
              icon={FileText}
              color="bg-green-500"
            />
            <StatCard
              title="平均客單價"
              value={`NT$ ${avgOrderValue.toLocaleString()}`}
              change="+3.8%"
              changeType="up"
              icon={CreditCard}
              color="bg-amber-500"
            />
            <StatCard
              title="待付供應商款"
              value={`NT$ ${(totalPendingPayments / 10000).toFixed(0)}萬`}
              change="-5.2%"
              changeType="down"
              icon={Building2}
              color="bg-red-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend */}
            <ChartCard
              title="營收趨勢"
              subtitle="每月營收與目標比較"
              actions={
                <button className="p-2 hover:bg-slate-100 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${value / 10000}萬`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="revenue" name="實際營收" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="目標"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Destination Distribution */}
            <ChartCard
              title="目的地分佈"
              subtitle="各目的地訂單佔比"
            >
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={280}>
                  <PieChart>
                    <Pie
                      data={destinationData as unknown as any[]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="bookings"
                    >
                      {destinationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {destinationData.map((dest, index) => (
                    <div key={dest.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-slate-600">{dest.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{dest.bookings}</span>
                        <span className={`text-xs ${
                          dest.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {dest.growth > 0 ? '+' : ''}{dest.growth}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Group Status */}
            <ChartCard title="團次狀態" subtitle="目前團次狀態分佈">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={groupStatusData as unknown as any[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={(props) => {
                      const payload = (props as any).payload as GroupStats;
                      return `${payload.status} ${payload.percentage}%`;
                    }}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {groupStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Year over Year */}
            <ChartCard title="年度比較" subtitle="今年 vs 去年同期">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${v / 10000}萬`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="thisYear"
                    name="今年"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="lastYear"
                    name="去年"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Booking Trend */}
            <ChartCard title="訂單趨勢" subtitle="每月訂單數量">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    name="訂單數"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* Sales Analysis */}
      {selectedReport === 'sales' && (
        <div className="space-y-6">
          <ChartCard
            title="銷售趨勢分析"
            subtitle="營收、訂單數、平均客單價"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${v / 10000}萬`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="營收" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bookings"
                  name="訂單數"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgPrice"
                  name="平均客單價"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-2 gap-6">
            <ChartCard title="目的地營收排名" subtitle="各目的地總營收">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={destinationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(v) => `${v / 10000}萬`} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" width={60} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="營收" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="目的地成長率" subtitle="各目的地同期成長">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={destinationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Bar dataKey="growth" name="成長率">
                    {destinationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.growth > 0 ? '#22c55e' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Group Analysis */}
      {selectedReport === 'groups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {groupStatusData.slice(0, 4).map((status, index) => (
              <div key={status.status} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-slate-500">{status.status}</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{status.count}</div>
                <div className="text-sm text-slate-500 mt-1">佔比 {status.percentage}%</div>
              </div>
            ))}
          </div>

          <ChartCard title="成團率趨勢" subtitle="每月成團率分析">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={[
                  { month: '1月', rate: 72, groups: 12 },
                  { month: '2月', rate: 78, groups: 15 },
                  { month: '3月', rate: 85, groups: 22 },
                  { month: '4月', rate: 80, groups: 18 },
                  { month: '5月', rate: 88, groups: 25 },
                  { month: '6月', rate: 92, groups: 30 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rate"
                  name="成團率"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 6 }}
                />
                <Bar yAxisId="right" dataKey="groups" name="成團數" fill="#22c55e" opacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Supplier Payments */}
      {selectedReport === 'suppliers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">總應付款</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                NT$ {(supplierPayments.reduce((s, p) => s + p.totalDue, 0) / 10000).toFixed(0)}萬
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">已付款</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                NT$ {(supplierPayments.reduce((s, p) => s + p.paid, 0) / 10000).toFixed(0)}萬
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">待付款</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                NT$ {(supplierPayments.reduce((s, p) => s + p.pending, 0) / 10000).toFixed(0)}萬
              </p>
            </div>
          </div>

          <ChartCard title="供應商帳款明細" subtitle="各供應商付款狀態">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">供應商</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">類型</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">總金額</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">已付</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-slate-500">待付</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">付款進度</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">到期日</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPayments.map((payment, index) => {
                    const progress = (payment.paid / payment.totalDue) * 100;
                    return (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{payment.supplier}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.type === '機票' ? 'bg-blue-100 text-blue-700' :
                            payment.type === '住宿' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {payment.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900">
                          NT$ {payment.totalDue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          NT$ {payment.paid.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">
                          NT$ {payment.pending.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  progress === 100 ? 'bg-green-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{payment.dueDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="付款狀態分佈">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierPayments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="supplier" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tickFormatter={(v) => `${v / 10000}萬`} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="paid" name="已付" stackId="a" fill="#22c55e" />
                <Bar dataKey="pending" name="待付" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
