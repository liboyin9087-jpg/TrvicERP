/**
 * Dashboard Core Types
 */

export interface Widget {
  id: string;
  type: string;
  title: string;
  config?: Record<string, unknown>;
  data?: Record<string, unknown>;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible?: boolean;
  isLocked?: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
  }>;
  isEditing?: boolean;
  updatedAt?: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  isEditing?: boolean;
}

export type WidgetType =
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'data-table'
  | 'notifications'
  | 'pending-tasks'
  | 'custom';
