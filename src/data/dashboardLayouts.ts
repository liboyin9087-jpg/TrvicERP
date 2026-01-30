import type { DashboardRole, Widget as BaseWidget } from '../core/types/dashboard';

/**
 * @description Defines standard layout dimensions for grid items.
 */
interface LayoutDimensions {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/**
 * @description Extends the base widget configuration to include design-related properties.
 * These properties guide the rendering of the widget according to Dashtail UI standards.
 */
interface WidgetConfig extends Record<string, any> {
  cardClassName?: string;    // Tailwind classes for the widget's outer card structure (e.g., bg-white p-4 rounded-lg shadow-md)
  headerClassName?: string;  // Tailwind classes for the widget's header/title (e.g., text-lg font-semibold text-gray-800 mb-2)
  contentClassName?: string; // Tailwind classes for the widget's content area
  colorScheme?: string;      // A key for a Tailwind-based color palette (e.g., 'primary', 'blue-500', 'green')
}

/**
 * @description An extended Widget type that incorporates additional properties for
 * drag-and-drop functionality and Dashtail UI compliance.
 * It omits and redefines 'config' and 'layout' to use our enhanced interfaces.
 */
export interface FixedWidget extends Omit<BaseWidget, 'config' | 'layout'> {
  config: WidgetConfig;
  layout: LayoutDimensions;
  dragHandleClassName?: string; // Specifies the class name for the drag handle element within the widget
}

// --- Constants for standardized widget dimensions (Addressing hardcoded numerical values) ---
const KPI_CARD_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 3, h: 2, minW: 2, minH: 2 };
const CHART_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 6, h: 4, minW: 4, minH: 3 };
const DATA_TABLE_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 8, h: 4, minW: 6, minH: 3 };
const SMALL_WIDGET_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 4, h: 4, minW: 3, minH: 3 };
const MEDIUM_WIDGET_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 6, h: 4, minW: 5, minH: 3 };
const LARGE_CALENDAR_DIMENSIONS: Omit<LayoutDimensions, 'x' | 'y'> = { w: 8, h: 5, minW: 6, minH: 4 };

/**
 * @description Defines default dashboard layouts for different user roles.
 * Each widget in the layout now includes `dragHandleClassName` and enhanced `config`
 * for Dashtail UI integration.
 */
export const DEFAULT_LAYOUTS: Record<DashboardRole, FixedWidget[]> = {
  staff: [
    {
      id: 'staff-kpi-revenue',
      type: 'kpi-card',
      title: '本月營收',
      dragHandleClassName: 'drag-handle', // Added drag handle
      config: {
        kpiType: 'revenue',
        dateRange: 'month',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md', // Dashtail Card structure
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2', // Tailwind font/spacing
        colorScheme: 'primary', // Tailwind color system
      },
      layout: { x: 0, y: 0, ...KPI_CARD_DIMENSIONS }, // Using constants
    },
    {
      id: 'staff-kpi-orders',
      type: 'kpi-card',
      title: '待確認訂單',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'orders',
        dateRange: 'week',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'secondary',
      },
      layout: { x: 3, y: 0, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-kpi-customers',
      type: 'kpi-card',
      title: '本月新客戶',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'customers',
        dateRange: 'month',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'tertiary',
      },
      layout: { x: 6, y: 0, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-kpi-satisfaction',
      type: 'kpi-card',
      title: '客戶滿意度',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'satisfaction',
        dateRange: 'month',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'success',
      },
      layout: { x: 9, y: 0, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-chart-revenue',
      type: 'chart-line',
      title: '營收趨勢',
      dragHandleClassName: 'drag-handle',
      config: {
        chartDataSource: 'revenue_monthly',
        chartPeriod: 6,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
        colorScheme: 'primary',
      },
      layout: { x: 0, y: 2, ...CHART_DIMENSIONS },
    },
    {
      id: 'staff-chart-status',
      type: 'chart-pie',
      title: '訂單狀態分佈',
      dragHandleClassName: 'drag-handle',
      config: {
        chartDataSource: 'order_status',
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
        colorScheme: 'blue',
      },
      layout: { x: 6, y: 2, ...CHART_DIMENSIONS },
    },
    {
      id: 'staff-recent-orders',
      type: 'recent-orders',
      title: '最近簽約',
      dragHandleClassName: 'drag-handle',
      config: {
        tableRowLimit: 5,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 0, y: 6, ...DATA_TABLE_DIMENSIONS },
    },
    {
      id: 'staff-quick-actions',
      type: 'quick-actions',
      title: '快速操作',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 8, y: 6, ...SMALL_WIDGET_DIMENSIONS },
    },
    // Travel-themed widgets for staff dashboard
    {
      id: 'staff-departure-board',
      type: 'departure-board',
      title: '近期出發團期',
      dragHandleClassName: 'drag-handle',
      config: {
        maxSessions: 5,
        showAnimation: true,
        cardClassName: 'bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-yellow-500/20 shadow-lg',
      },
      layout: { x: 0, y: 10, w: 6, h: 5, minW: 4, minH: 4 },
    },
    {
      id: 'staff-passport-tracker',
      type: 'passport-tracker',
      title: '護照管理',
      dragHandleClassName: 'drag-handle',
      config: {
        showWarnings: true,
        warningMonths: 6,
        cardClassName: 'bg-gradient-to-br from-red-900 to-red-800 rounded-lg border-4 border-yellow-500 shadow-2xl',
      },
      layout: { x: 6, y: 10, w: 4, h: 5, minW: 3, minH: 4 },
    },
    {
      id: 'staff-world-map',
      type: 'world-map',
      title: '熱門目的地',
      dragHandleClassName: 'drag-handle',
      config: {
        showRanking: true,
        maxDestinations: 10,
        cardClassName: 'bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg shadow-lg',
      },
      layout: { x: 0, y: 15, w: 8, h: 6, minW: 6, minH: 5 },
    },
    // Green tourism KPI widgets
    {
      id: 'staff-kpi-carbon-footprint',
      type: 'kpi-card',
      title: '平均碳足跡',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'carbon_footprint',
        dateRange: 'month',
        showTrend: true,
        unit: 'kg CO₂e',
        cardClassName: 'bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-md border border-emerald-200',
        headerClassName: 'text-lg font-semibold text-emerald-800 mb-2',
        colorScheme: 'emerald',
      },
      layout: { x: 0, y: 21, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-kpi-green-ratio',
      type: 'kpi-card',
      title: '綠色認證比例',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'green_certification_ratio',
        dateRange: 'month',
        showTrend: true,
        unit: '%',
        cardClassName: 'bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg shadow-md border border-teal-200',
        headerClassName: 'text-lg font-semibold text-teal-800 mb-2',
        colorScheme: 'teal',
      },
      layout: { x: 3, y: 21, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-kpi-local-spend',
      type: 'kpi-card',
      title: '在地消費回饋率',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'local_spend_ratio',
        dateRange: 'month',
        showTrend: true,
        unit: '%',
        cardClassName: 'bg-gradient-to-br from-lime-50 to-green-50 rounded-lg shadow-md border border-lime-200',
        headerClassName: 'text-lg font-semibold text-lime-800 mb-2',
        colorScheme: 'lime',
      },
      layout: { x: 6, y: 21, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-kpi-green-score',
      type: 'kpi-card',
      title: '環保分數',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'green_score',
        dateRange: 'month',
        showTrend: true,
        unit: '/100',
        cardClassName: 'bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md border border-green-200',
        headerClassName: 'text-lg font-semibold text-green-800 mb-2',
        colorScheme: 'green',
      },
      layout: { x: 9, y: 21, ...KPI_CARD_DIMENSIONS },
    },
    {
      id: 'staff-chart-carbon-trend',
      type: 'chart-line',
      title: '碳足跡趨勢',
      dragHandleClassName: 'drag-handle',
      config: {
        chartDataSource: 'carbon_footprint_monthly',
        chartPeriod: 6,
        cardClassName: 'bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg shadow-md border border-emerald-200',
        headerClassName: 'text-xl font-bold text-emerald-900 mb-4',
        colorScheme: 'emerald',
      },
      layout: { x: 0, y: 23, ...CHART_DIMENSIONS },
    },
    {
      id: 'staff-chart-green-distribution',
      type: 'chart-pie',
      title: '永續認證分佈',
      dragHandleClassName: 'drag-handle',
      config: {
        chartDataSource: 'sustainability_type_distribution',
        cardClassName: 'bg-gradient-to-br from-teal-50 to-green-50 rounded-lg shadow-md border border-teal-200',
        headerClassName: 'text-xl font-bold text-teal-900 mb-4',
        colorScheme: 'teal',
      },
      layout: { x: 6, y: 23, ...CHART_DIMENSIONS },
    },
  ],
  welfare: [
    {
      id: 'welfare-kpi-budget',
      type: 'kpi-card',
      title: '年度預算餘額',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'revenue',
        dateRange: 'quarter',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'indigo',
      },
      layout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 }, // Specific dimensions
    },
    {
      id: 'welfare-kpi-trips',
      type: 'kpi-card',
      title: '已規劃行程',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'orders',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'purple',
      },
      layout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    },
    {
      id: 'welfare-kpi-participation',
      type: 'kpi-card',
      title: '員工參與率',
      dragHandleClassName: 'drag-handle',
      config: {
        kpiType: 'satisfaction',
        showTrend: true,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-lg font-semibold text-gray-800 mb-2',
        colorScheme: 'teal',
      },
      layout: { x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    },
    {
      id: 'welfare-calendar',
      type: 'calendar',
      title: '行程日曆',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 0, y: 2, ...LARGE_CALENDAR_DIMENSIONS },
    },
    {
      id: 'welfare-pending-tasks',
      type: 'pending-tasks',
      title: '待辦事項',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 3 }, // Specific dimensions
    },
    {
      id: 'welfare-chart-budget',
      type: 'chart-bar',
      title: '預算使用分析',
      dragHandleClassName: 'drag-handle',
      config: {
        chartDataSource: 'budget_usage',
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
        colorScheme: 'orange',
      },
      layout: { x: 0, y: 7, ...CHART_DIMENSIONS },
    },
    {
      id: 'welfare-notifications',
      type: 'notifications',
      title: '系統通知',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 6, y: 7, ...CHART_DIMENSIONS }, // Using CHART_DIMENSIONS as default
    },
    // Travel-themed widgets for welfare dashboard
    {
      id: 'welfare-journey-timeline',
      type: 'journey-timeline',
      title: '企劃旅程時間軸',
      dragHandleClassName: 'drag-handle',
      config: {
        maxJourneys: 5,
        showRevenue: true,
        cardClassName: 'bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg shadow-lg',
      },
      layout: { x: 0, y: 11, w: 6, h: 6, minW: 4, minH: 5 },
    },
    {
      id: 'welfare-revenue-compass',
      type: 'revenue-compass',
      title: '預算儀表板',
      dragHandleClassName: 'drag-handle',
      config: {
        showBreakdown: true,
        targetRevenue: 10000000,
        cardClassName: 'bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg shadow-lg',
      },
      layout: { x: 6, y: 11, w: 6, h: 6, minW: 4, minH: 5 },
    },
  ],
  traveler: [
    {
      id: 'traveler-upcoming',
      type: 'calendar',
      title: '即將出發的行程',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 0, y: 0, ...MEDIUM_WIDGET_DIMENSIONS }, // Using MEDIUM_WIDGET_DIMENSIONS as default
    },
    {
      id: 'traveler-weather',
      type: 'weather',
      title: '目的地天氣',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 8, y: 0, ...SMALL_WIDGET_DIMENSIONS },
    },
    {
      id: 'traveler-recent-orders',
      type: 'recent-orders',
      title: '我的行程紀錄',
      dragHandleClassName: 'drag-handle',
      config: {
        tableRowLimit: 5,
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 0, y: 4, ...MEDIUM_WIDGET_DIMENSIONS },
    },
    {
      id: 'traveler-quick-actions',
      type: 'quick-actions',
      title: '快速操作',
      dragHandleClassName: 'drag-handle',
      config: {
        cardClassName: 'bg-white p-4 rounded-lg shadow-md',
        headerClassName: 'text-xl font-bold text-gray-900 mb-4',
      },
      layout: { x: 6, y: 4, ...MEDIUM_WIDGET_DIMENSIONS },
    },
  ],
};

/**
 * @description Widget library containing all available widget types
 */
import type { WidgetLibraryItem } from '../core/types/dashboard';

export const DEFAULT_WIDGET_LIBRARY: WidgetLibraryItem[] = [
  {
    type: 'kpi-card',
    name: 'KPI Card',
    description: 'Display key performance indicators',
    category: 'metrics',
    defaultLayout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: {},
  },
  {
    type: 'chart-line',
    name: 'Line Chart',
    description: 'Display data trends over time',
    category: 'charts',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'chart-bar',
    name: 'Bar Chart',
    description: 'Display comparative data',
    category: 'charts',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'chart-pie',
    name: 'Pie Chart',
    description: 'Display proportional data',
    category: 'charts',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'recent-orders',
    name: 'Recent Orders',
    description: 'Display recent order list',
    category: 'data',
    defaultLayout: { x: 0, y: 0, w: 8, h: 4, minW: 6, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'quick-actions',
    name: 'Quick Actions',
    description: 'Quick access buttons',
    category: 'actions',
    defaultLayout: { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'calendar',
    name: 'Calendar',
    description: 'Display calendar events',
    category: 'planning',
    defaultLayout: { x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
    defaultConfig: {},
  },
  {
    type: 'pending-tasks',
    name: 'Pending Tasks',
    description: 'Display pending tasks list',
    category: 'tasks',
    defaultLayout: { x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'notifications',
    name: 'Notifications',
    description: 'Display system notifications',
    category: 'notifications',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {},
  },
  {
    type: 'weather',
    name: 'Weather',
    description: 'Display weather information',
    category: 'info',
    defaultLayout: { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {},
  },
  // Travel-themed widgets
  {
    type: 'departure-board',
    name: 'Departure Board',
    description: 'Airport-style departure information',
    category: 'travel',
    defaultLayout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 4 },
    defaultConfig: {
      maxSessions: 5,
      showAnimation: true,
    },
  },
  {
    type: 'passport-tracker',
    name: 'Passport Tracker',
    description: 'Track passport expiry dates',
    category: 'travel',
    defaultLayout: { x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
    defaultConfig: {
      showWarnings: true,
      warningMonths: 6,
    },
  },
  {
    type: 'journey-timeline',
    name: 'Journey Timeline',
    description: 'Visual journey timeline',
    category: 'travel',
    defaultLayout: { x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
    defaultConfig: {
      maxJourneys: 5,
      showRevenue: true,
    },
  },
  {
    type: 'world-map',
    name: 'World Map',
    description: 'Interactive destination map',
    category: 'travel',
    defaultLayout: { x: 0, y: 0, w: 8, h: 6, minW: 6, minH: 5 },
    defaultConfig: {
      showRanking: true,
      maxDestinations: 10,
    },
  },
  {
    type: 'revenue-compass',
    name: 'Revenue Compass',
    description: 'Circular revenue dashboard',
    category: 'travel',
    defaultLayout: { x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
    defaultConfig: {
      showBreakdown: true,
      targetRevenue: 10000000,
    },
  },
  // Green tourism widgets
  {
    type: 'kpi-card',
    name: 'Carbon Footprint KPI',
    description: 'Average carbon footprint per trip',
    category: 'green',
    defaultLayout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: {
      kpiType: 'carbon_footprint',
      unit: 'kg CO₂e',
    },
  },
  {
    type: 'kpi-card',
    name: 'Green Certification Ratio',
    description: 'Percentage of green-certified itineraries',
    category: 'green',
    defaultLayout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: {
      kpiType: 'green_certification_ratio',
      unit: '%',
    },
  },
  {
    type: 'kpi-card',
    name: 'Green Score',
    description: 'Average sustainability score across trips',
    category: 'green',
    defaultLayout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    defaultConfig: {
      kpiType: 'green_score',
      unit: '/100',
    },
  },
  {
    type: 'chart-line',
    name: 'Carbon Trend',
    description: 'Monthly carbon footprint trend',
    category: 'green',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {
      chartDataSource: 'carbon_footprint_monthly',
    },
  },
  {
    type: 'chart-pie',
    name: 'Sustainability Distribution',
    description: 'Distribution of sustainability certifications',
    category: 'green',
    defaultLayout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {
      chartDataSource: 'sustainability_type_distribution',
    },
  },
];