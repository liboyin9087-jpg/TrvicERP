export type WidgetType =
  | 'kpi-card'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'data-table'
  | 'quick-actions'
  | 'calendar'
  | 'notifications'
  | 'weather'
  | 'recent-orders'
  | 'pending-tasks'
  | 'customer-ranking';

export type DashboardRole = 'staff' | 'welfare' | 'traveler';

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetConfig {
  kpiType?: 'revenue' | 'orders' | 'customers' | 'satisfaction';
  dateRange?: 'today' | 'week' | 'month' | 'quarter';
  chartDataSource?: string;
  chartPeriod?: number;
  tableColumns?: string[];
  tableRowLimit?: number;
  refreshInterval?: number;
  showTrend?: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  layout: WidgetLayout;
}

export interface WidgetLibraryItem {
  type: WidgetType;
  title: string;
  description: string;
  defaultConfig?: WidgetConfig;
  defaultLayout: WidgetLayout;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  role: DashboardRole;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
