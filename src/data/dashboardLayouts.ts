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
];