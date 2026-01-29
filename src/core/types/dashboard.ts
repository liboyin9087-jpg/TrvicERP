/**
 * @file Type definitions for dashboard elements and configurations within TrvicERP.
 *
 * This file defines the core types used to describe widgets, their layouts,
 * configurations, and dashboard structures. It addresses architectural concerns
 * by providing detailed, type-safe configurations for individual widget types
 * through discriminated unions and ensures comprehensive documentation via JSDoc.
 */

/**
 * Defines the possible types of widgets that can be displayed on a dashboard.
 * Each type corresponds to a specific functional component or data visualization.
 */
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

/**
 * Defines the roles for which a dashboard layout can be configured.
 * This allows for role-specific dashboard experiences.
 */
export type DashboardRole = 'staff' | 'welfare' | 'traveler';

/**
 * Defines the layout properties for a widget on the dashboard grid.
 * Uses a grid system with x, y coordinates and width (w), height (h).
 */
export interface WidgetLayout {
  /** The x-coordinate (column) of the widget on the grid. */
  x: number;
  /** The y-coordinate (row) of the widget on the grid. */
  y: number;
  /** The width of the widget in grid units. */
  w: number;
  /** The height of the widget in grid units. */
  h: number;
  /** Optional minimum width for the widget in grid units. */
  minW?: number;
  /** Optional minimum height for the widget in grid units. */
  minH?: number;
  /** Optional maximum width for the widget in grid units. */
  maxW?: number;
  /** Optional maximum height for the widget in grid units. */
  maxH?: number;
}

/**
 * Base configuration properties common to many widgets.
 * Allows for standardizing common behaviors like data refresh.
 */
interface BaseWidgetConfig {
  /**
   * Data refresh interval in milliseconds.
   * If set, the widget's data will automatically refresh after this period.
   */
  refreshInterval?: number;
}

/**
 * Specific configuration for a Key Performance Indicator (KPI) Card widget.
 */
export interface KpiCardWidgetConfig extends BaseWidgetConfig {
  /** The type of KPI to display (e.g., total revenue, number of orders). */
  kpiType?: 'revenue' | 'orders' | 'customers' | 'satisfaction';
  /** The date range for aggregating the KPI data. */
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  /** Whether to display a trend indicator (e.g., arrow showing up/down change). */
  showTrend?: boolean;
  /** Optional identifier for the specific data source if multiple KPIs of the same type exist. */
  dataSourceId?: string;
}

/**
 * Base configuration properties common to all chart widgets.
 */
interface ChartBaseWidgetConfig extends BaseWidgetConfig {
  /** Identifier for the primary data source used by the chart. */
  chartDataSource?: string;
  /** Period for chart data aggregation (e.g., number of days, weeks, months). */
  chartPeriod?: number;
  /** Optional labels for the chart's x-axis or categories. */
  labels?: string[];
  /** Optional keys from the data source to be used for chart values. */
  dataKeys?: string[];
  /** Whether to display a legend for the chart. */
  showLegend?: boolean;
}

/**
 * Specific configuration for a Line Chart widget.
 */
export interface ChartLineWidgetConfig extends ChartBaseWidgetConfig {
  /** The specific chart type, explicitly set to 'line'. */
  chartType: 'line';
  /** The line tension (bezier curve tension) for smoother lines. */
  lineTension?: number;
  /** Whether to fill the area under the line with color. */
  fillArea?: boolean;
}

/**
 * Specific configuration for a Bar Chart widget.
 */
export interface ChartBarWidgetConfig extends ChartBaseWidgetConfig {
  /** The specific chart type, explicitly set to 'bar'. */
  chartType: 'bar';
  /** The thickness of the bars, can be 'flex' or a numeric value. */
  barThickness?: 'flex' | number;
  /** Whether the bars should be stacked for multiple datasets. */
  stacked?: boolean;
}

/**
 * Specific configuration for a Pie Chart widget.
 */
export interface ChartPieWidgetConfig extends ChartBaseWidgetConfig {
  /** The specific chart type, explicitly set to 'pie'. */
  chartType: 'pie';
  /** The percentage of the chart's radius to cut out, creating a doughnut chart. */
  cutoutPercentage?: number;
  /** Whether to display labels directly on the pie slices. */
  showLabels?: boolean;
}

/**
 * Specific configuration for a Data Table widget.
 */
export interface DataTableWidgetConfig extends BaseWidgetConfig {
  /** Identifier for the data source used by the table (e.g., 'products', 'employees'). */
  tableDataSource?: string;
  /** List of columns to display in the table, specified by their data keys. */
  tableColumns?: string[];
  /** Maximum number of rows to display in the table. */
  tableRowLimit?: number;
  /** Whether to enable pagination controls for the table. */
  enablePagination?: boolean;
  /** Whether to enable search functionality for the table. */
  enableSearch?: boolean;
  /** Whether to allow column sorting in the table. */
  enableSorting?: boolean;
}

/**
 * Specific configuration for a Quick Actions widget.
 * Provides a set of clickable buttons or links for common tasks.
 */
export interface QuickActionsWidgetConfig {
  /** A list of action items, each with a label, icon, and optional link or handler. */
  actions: {
    /** Unique identifier for the action. */
    id: string;
    /** The display label for the action button. */
    label: string;
    /** Optional icon name or path to display with the action. */
    icon?: string;
    /** Optional URL to navigate to when the action is clicked. */
    link?: string;
    /** Optional identifier for a client-side function to execute when the action is clicked. */
    onClickHandlerId?: string;
    /** Optional color for the action button. */
    color?: string; // e.g., 'primary', 'secondary'
  }[];
}

/**
 * Specific configuration for a Calendar widget.
 */
export interface CalendarWidgetConfig {
  /** The default view mode for the calendar (e.g., day, week, month). */
  defaultView?: 'day' | 'week' | 'month' | 'agenda';
  /** Whether to display weekend days in the calendar view. */
  showWeekends?: boolean;
  /** Whether to allow users to create new events directly from the widget. */
  enableEventCreation?: boolean;
  /** Optional identifier for an event source. */
  eventDataSource?: string;
}

/**
 * Specific configuration for a Notifications widget.
 */
export interface NotificationsWidgetConfig extends BaseWidgetConfig {
  /** Maximum number of notifications to display in the widget. */
  maxNotifications?: number;
  /** Filter notifications by their status (e.g., 'unread', 'all', 'archived'). */
  filterStatus?: 'unread' | 'all' | 'archived';
  /** Whether to show a 'Mark All as Read' button. */
  showMarkAllRead?: boolean;
}

/**
 * Specific configuration for a Weather widget.
 */
export interface WeatherWidgetConfig extends BaseWidgetConfig {
  /** Geographic location for which to display weather data (e.g., 'Taipei', 'Tokyo'). */
  location?: string;
  /** The temperature unit to use ('celsius' or 'fahrenheit'). */
  unit?: 'celsius' | 'fahrenheit';
  /** Whether to display an extended forecast (e.g., 3-day or 5-day). */
  showForecast?: boolean;
}

/**
 * Specific configuration for a Recent Orders widget.
 * Extends DataTableWidgetConfig as it essentially displays a table of recent orders.
 */
export interface RecentOrdersWidgetConfig extends DataTableWidgetConfig {
  /** The data source is explicitly set for recent orders. */
  tableDataSource: 'recent-orders';
  /** Optional filter for order status (e.g., 'pending', 'shipped'). */
  orderStatusFilter?: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'all';
}

/**
 * Specific configuration for a Pending Tasks widget.
 * Extends DataTableWidgetConfig as it displays a table of pending tasks.
 */
export interface PendingTasksWidgetConfig extends DataTableWidgetConfig {
  /** The data source is explicitly set for pending tasks. */
  tableDataSource: 'pending-tasks';
  /** Optional filter for task priority. */
  priorityFilter?: 'high' | 'medium' | 'low' | 'all';
  /** Optional filter for task assignee. */
  assigneeFilter?: string;
}

/**
 * Specific configuration for a Customer Ranking widget.
 * Extends DataTableWidgetConfig to display a ranked list of customers.
 */
export interface CustomerRankingWidgetConfig extends DataTableWidgetConfig {
  /** The data source is explicitly set for customer ranking. */
  tableDataSource: 'customer-ranking';
  /** The metric by which customers are ranked (e.g., by revenue, by number of orders). */
  rankingType?: 'revenue' | 'orders';
  /** The date range for aggregating data used in customer ranking. */
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * A union type representing the configuration for any possible widget type.
 * This allows `WidgetConfig` to be flexible while still providing strong type-checking
 * when used with a specific `WidgetType` via discriminated unions.
 */
export type WidgetConfig =
  | KpiCardWidgetConfig
  | ChartLineWidgetConfig
  | ChartBarWidgetConfig
  | ChartPieWidgetConfig
  | DataTableWidgetConfig
  | QuickActionsWidgetConfig
  | CalendarWidgetConfig
  | NotificationsWidgetConfig
  | WeatherWidgetConfig
  | RecentOrdersWidgetConfig
  | PendingTasksWidgetConfig
  | CustomerRankingWidgetConfig;

/**
 * Generic Widget type for components that need flexible config types.
 * Use this when building reusable widget components that accept any config.
 */
export interface GenericWidget<TConfig = WidgetConfig> {
  id: string;
  type: string;
  title: string;
  config: TConfig;
  layout: WidgetLayout;
}

/**
 * Represents a single widget instance with its specific type, configuration, and layout.
 * This is a discriminated union, ensuring that the `config` property's type
 * is strictly coupled with the `type` property.
 */
export type Widget =
  | { id: string; type: 'kpi-card'; title: string; config: KpiCardWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'chart-line'; title: string; config: ChartLineWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'chart-bar'; title: string; config: ChartBarWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'chart-pie'; title: string; config: ChartPieWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'data-table'; title: string; config: DataTableWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'quick-actions'; title: string; config: QuickActionsWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'calendar'; title: string; config: CalendarWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'notifications'; title: string; config: NotificationsWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'weather'; title: string; config: WeatherWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'recent-orders'; title: string; config: RecentOrdersWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'pending-tasks'; title: string; config: PendingTasksWidgetConfig; layout: WidgetLayout; }
  | { id: string; type: 'customer-ranking'; title: string; config: CustomerRankingWidgetConfig; layout: WidgetLayout; };

/**
 * Defines an item in the widget library, describing a widget type available for use.
 * This includes metadata and default configuration/layout.
 */
export interface WidgetLibraryItem {
  /** The type of widget this library item represents. */
  type: WidgetType;
  /** A user-friendly title for the widget. */
  title: string;
  /** A brief description of what the widget does. */
  description: string;
  /** Optional default configuration for the widget when it's added to a dashboard. */
  defaultConfig?: WidgetConfig;
  /** The default layout properties for the widget when it's initially added. */
  defaultLayout: WidgetLayout;
  /** Optional icon name or path for displaying in the widget library. */
  icon?: string;
  /** Optional category for grouping widgets in the library (e.g., 'Data', 'Tools'). */
  category?: string;
}

/**
 * Represents a complete dashboard layout, including its metadata and the collection of widgets it contains.
 */
export interface DashboardLayout {
  /** Unique identifier for the dashboard layout. */
  id: string;
  /** The ID of the user to whom this dashboard layout belongs. */
  userId: string;
  /** The role for which this dashboard layout is intended. */
  role: DashboardRole;
  /** A user-friendly name for the dashboard layout. */
  name: string;
  /** An array of widgets arranged on this dashboard. */
  widgets: Widget[];
  /** Indicates if this is the default layout for the specified user and role. */
  isDefault: boolean;
  /** Timestamp when the dashboard layout was created. */
  createdAt: string;
  /** Timestamp when the dashboard layout was last updated. */
  updatedAt: string;
}