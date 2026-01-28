interface IKPIItem {
  value: number;
  trend: number;
  label: string;
}

interface IKPIData {
  revenue: IKPIItem;
  orders: IKPIItem;
  customers: IKPIItem;
  satisfaction: IKPIItem;
}

interface IBarChartDataItem {
  label: string;
  value: number;
}

interface IPieChartDataItem {
  label: string;
  value: number;
  color: string; // Tailwind CSS utility class, e.g., 'bg-emerald-500'
}

interface IRecentOrderItem {
  id: string;
  company: string;
  trip: string;
  amount: number;
  status: 'pending' | 'paid' | 'quoted' | 'draft';
  pax: number;
  date: string; // ISO date string, e.g., 'YYYY-MM-DD'
}

interface IQuickActionItem {
  id: string;
  label: string;
  color: string; // Tailwind CSS utility class, e.g., 'bg-brand-500'
}

interface ICalendarEventItem {
  id: string;
  title: string;
  date: string; // ISO date string
  company: string;
  pax: number;
}

interface INotificationItem {
  id: string;
  title: string;
  time: string; // Relative time, e.g., '5 min ago'
  level: 'info' | 'warning' | 'success';
}

interface IWeatherData {
  location: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  note?: string;
}

interface IPendingTaskItem {
  id: string;
  title: string;
  due: string; // Relative time or date string
  done: boolean;
}

interface ICustomerRankingItem {
  id: string;
  name: string;
  revenue: number;
  orders: number;
}

/**
 * Encapsulated functions to retrieve static dashboard data.
 * This provides type safety, encapsulation, and adheres to SRP for data provision.
 * Components consuming this data would call these functions directly or receive data via props,
 * ensuring independence from global stores.
 */
export const getKPIData = (): IKPIData => ({
  revenue: { value: 3200000, trend: 12.4, label: 'Revenue' },
  orders: { value: 12, trend: 3.2, label: 'Orders' },
  customers: { value: 8, trend: 25.1, label: 'Customers' },
  satisfaction: { value: 4.8, trend: 0.2, label: 'Satisfaction' },
});

export const getLineChartData = (): number[] => [32, 28, 36, 42, 38, 47, 52, 48, 60, 58, 66, 72];

export const getBarChartData = (): IBarChartDataItem[] => [
  { label: 'Draft', value: 12 },
  { label: 'Quoted', value: 18 },
  { label: 'Pending', value: 26 },
  { label: 'Confirmed', value: 20 },
  { label: 'Paid', value: 34 },
];

export const getPieChartData = (): IPieChartDataItem[] => [
  // Hardcoded hex colors are replaced with Tailwind utility classes as per design guidelines.
  { label: 'Paid', value: 45, color: 'bg-emerald-500' },   // Original: #10B981
  { label: 'Pending', value: 30, color: 'bg-amber-500' },   // Original: #F59E0B
  { label: 'Draft', value: 25, color: 'bg-slate-400' },     // Original: #94A3B8
];

export const getRecentOrders = (): IRecentOrderItem[] => [
  { id: 'ORD-001', company: 'Acme Tech', trip: 'Spring Retreat', amount: 135000, status: 'pending', pax: 45, date: '2025-03-15' },
  { id: 'ORD-002', company: 'MediaLab', trip: 'Q1 Incentive', amount: 450000, status: 'paid', pax: 120, date: '2025-03-22' },
  { id: 'ORD-003', company: 'Nova Systems', trip: 'Team Offsite', amount: 320000, status: 'quoted', pax: 85, date: '2025-04-05' },
  { id: 'ORD-004', company: 'Orion Group', trip: 'Annual Summit', amount: 240000, status: 'draft', pax: 60, date: '2025-04-12' },
  { id: 'ORD-005', company: 'Pioneer Inc', trip: 'Spring Tour', amount: 800000, status: 'pending', pax: 200, date: '2025-04-18' },
];

export const getQuickActions = (): IQuickActionItem[] => [
  // Colors already followed guidelines, retained.
  { id: 'new-tour', label: 'Create Tour', color: 'bg-brand-500' },
  { id: 'new-quote', label: 'Create Quote', color: 'bg-emerald-500' },
  { id: 'manage-customers', label: 'Customer CRM', color: 'bg-accent-500' },
  { id: 'export-report', label: 'Export Report', color: 'bg-amber-500' },
];

export const getCalendarEvents = (): ICalendarEventItem[] => [
  { id: 'evt-1', title: 'Spring Retreat', date: '2025-03-15', company: 'Acme Tech', pax: 45 },
  { id: 'evt-2', title: 'Q1 Incentive', date: '2025-03-22', company: 'MediaLab', pax: 120 },
  { id: 'evt-3', title: 'Team Offsite', date: '2025-04-05', company: 'Nova Systems', pax: 85 },
];

export const getNotifications = (): INotificationItem[] => [
  { id: 'ntf-1', title: 'Order confirmed for Acme Tech', time: '5 min ago', level: 'info' },
  { id: 'ntf-2', title: 'Quotation awaiting approval', time: '2 hours ago', level: 'warning' },
  { id: 'ntf-3', title: 'Payment received from MediaLab', time: 'Yesterday', level: 'success' },
];

export const getWeatherData = (): IWeatherData => ({
  location: 'Alishan',
  temperature: 26,
  condition: 'sunny',
  note: 'High UV, consider sun protection.',
});

export const getPendingTasks = (): IPendingTaskItem[] => [
  { id: 'task-1', title: 'Confirm hotel allocation', due: 'Today', done: false },
  { id: 'task-2', title: 'Send quotation reminder', due: 'Tomorrow', done: false },
  { id: 'task-3', title: 'Review supplier contracts', due: 'Fri', done: true },
];

export const getCustomerRanking = (): ICustomerRankingItem[] => [
  { id: 'cust-1', name: 'Acme Tech', revenue: 185000, orders: 6 },
  { id: 'cust-2', name: 'MediaLab', revenue: 92400, orders: 3 },
  { id: 'cust-3', name: 'Nova Systems', revenue: 62000, orders: 2 },
];