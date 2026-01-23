export const KPI_DATA = {
  revenue: { value: 3200000, trend: 12.4, label: 'Revenue' },
  orders: { value: 12, trend: 3.2, label: 'Orders' },
  customers: { value: 8, trend: 25.1, label: 'Customers' },
  satisfaction: { value: 4.8, trend: 0.2, label: 'Satisfaction' },
};

export const LINE_CHART_DATA = [32, 28, 36, 42, 38, 47, 52, 48, 60, 58, 66, 72];

export const BAR_CHART_DATA = [
  { label: 'Draft', value: 12 },
  { label: 'Quoted', value: 18 },
  { label: 'Pending', value: 26 },
  { label: 'Confirmed', value: 20 },
  { label: 'Paid', value: 34 },
];

export const PIE_CHART_DATA = [
  { label: 'Paid', value: 45, color: '#10B981' },
  { label: 'Pending', value: 30, color: '#F59E0B' },
  { label: 'Draft', value: 25, color: '#94A3B8' },
];

export const RECENT_ORDERS = [
  { id: 'ORD-001', company: 'Acme Tech', trip: 'Spring Retreat', amount: 135000, status: 'pending', pax: 45, date: '2025-03-15' },
  { id: 'ORD-002', company: 'MediaLab', trip: 'Q1 Incentive', amount: 450000, status: 'paid', pax: 120, date: '2025-03-22' },
  { id: 'ORD-003', company: 'Nova Systems', trip: 'Team Offsite', amount: 320000, status: 'quoted', pax: 85, date: '2025-04-05' },
  { id: 'ORD-004', company: 'Orion Group', trip: 'Annual Summit', amount: 240000, status: 'draft', pax: 60, date: '2025-04-12' },
  { id: 'ORD-005', company: 'Pioneer Inc', trip: 'Spring Tour', amount: 800000, status: 'pending', pax: 200, date: '2025-04-18' },
];

export const QUICK_ACTIONS = [
  { id: 'new-tour', label: 'Create Tour', color: 'bg-brand-500' },
  { id: 'new-quote', label: 'Create Quote', color: 'bg-emerald-500' },
  { id: 'manage-customers', label: 'Customer CRM', color: 'bg-accent-500' },
  { id: 'export-report', label: 'Export Report', color: 'bg-amber-500' },
];

export const CALENDAR_EVENTS = [
  { id: 'evt-1', title: 'Spring Retreat', date: '2025-03-15', company: 'Acme Tech', pax: 45 },
  { id: 'evt-2', title: 'Q1 Incentive', date: '2025-03-22', company: 'MediaLab', pax: 120 },
  { id: 'evt-3', title: 'Team Offsite', date: '2025-04-05', company: 'Nova Systems', pax: 85 },
];

export const NOTIFICATIONS = [
  { id: 'ntf-1', title: 'Order confirmed for Acme Tech', time: '5 min ago', level: 'info' },
  { id: 'ntf-2', title: 'Quotation awaiting approval', time: '2 hours ago', level: 'warning' },
  { id: 'ntf-3', title: 'Payment received from MediaLab', time: 'Yesterday', level: 'success' },
];

export const WEATHER_DATA = {
  location: 'Alishan',
  temperature: 26,
  condition: 'sunny' as const,
  note: 'High UV, consider sun protection.',
};

export const PENDING_TASKS = [
  { id: 'task-1', title: 'Confirm hotel allocation', due: 'Today', done: false },
  { id: 'task-2', title: 'Send quotation reminder', due: 'Tomorrow', done: false },
  { id: 'task-3', title: 'Review supplier contracts', due: 'Fri', done: true },
];

export const CUSTOMER_RANKING = [
  { id: 'cust-1', name: 'Acme Tech', revenue: 185000, orders: 6 },
  { id: 'cust-2', name: 'MediaLab', revenue: 92400, orders: 3 },
  { id: 'cust-3', name: 'Nova Systems', revenue: 62000, orders: 2 },
];
