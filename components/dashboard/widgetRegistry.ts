/**
 * Widget Registry
 * Centralizes widget type definitions and component mappings
 */

import React from 'react';
import type { Widget, GenericWidget, WidgetConfig } from '@/core/types/dashboard';

export type WidgetType =
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'data-table'
  | 'notifications'
  | 'pending-tasks'
  | 'custom';

export const WIDGET_TYPES: WidgetType[] = [
  'kpi-card',
  'line-chart',
  'bar-chart',
  'pie-chart',
  'data-table',
  'notifications',
  'pending-tasks',
  'custom',
];

export interface GenericWidgetComponentProps {
  widget: GenericWidget<any>;
  onUpdate?: (widget: Widget) => void;
  onRemove?: () => void;
  isEditing?: boolean;
}

// Stub components for lazy loading
const CustomWidgetComponent: React.ComponentType<GenericWidgetComponentProps> = () => {
  return React.createElement('div', null, 'Custom Widget');
};

export const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<GenericWidgetComponentProps>> = {
  'kpi-card': React.lazy(() => import('./widgets/KpiCardWidget')),
  'line-chart': React.lazy(() => import('./widgets/LineChartWidget')),
  'bar-chart': React.lazy(() => import('./widgets/BarChartWidget')),
  'pie-chart': React.lazy(() => import('./widgets/PieChartWidget')),
  'data-table': React.lazy(() => import('./widgets/DataTableWidget')),
  'notifications': React.lazy(() => import('./widgets/NotificationsWidget')),
  'pending-tasks': React.lazy(() => import('./widgets/PendingTasksWidget')),
  'custom': CustomWidgetComponent,
};

/**
 * Get available widgets for a specific role or context
 */
export function getAvailableWidgets(role?: string): WidgetType[] {
  if (role === 'admin') {
    return WIDGET_TYPES;
  }
  return ['kpi-card', 'line-chart', 'data-table', 'notifications'];
}

/**
 * Get widget metadata
 */
export function getWidgetMetadata(type: WidgetType) {
  const metadata: Record<WidgetType, { label: string; description: string }> = {
    'kpi-card': { label: 'KPI Card', description: 'Display key performance indicators' },
    'line-chart': { label: 'Line Chart', description: 'Display trend data over time' },
    'bar-chart': { label: 'Bar Chart', description: 'Compare categorical data' },
    'pie-chart': { label: 'Pie Chart', description: 'Show data distribution' },
    'data-table': { label: 'Data Table', description: 'Display tabular data' },
    'notifications': { label: 'Notifications', description: 'Show system notifications' },
    'pending-tasks': { label: 'Pending Tasks', description: 'Display pending action items' },
    'custom': { label: 'Custom', description: 'Custom widget content' },
  };

  return metadata[type];
}
