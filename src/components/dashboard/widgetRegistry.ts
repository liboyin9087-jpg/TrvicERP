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
  | 'custom'
  // Travel theme widgets
  | 'departure-board'
  | 'passport-tracker'
  | 'journey-timeline'
  | 'world-map'
  | 'revenue-compass';

export const WIDGET_TYPES: WidgetType[] = [
  'kpi-card',
  'line-chart',
  'bar-chart',
  'pie-chart',
  'data-table',
  'notifications',
  'pending-tasks',
  'custom',
  // Travel theme widgets
  'departure-board',
  'passport-tracker',
  'journey-timeline',
  'world-map',
  'revenue-compass',
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
  // Travel theme widgets
  'departure-board': React.lazy(() => import('./widgets/DepartureBoardWidget')),
  'passport-tracker': React.lazy(() => import('./widgets/PassportTrackerWidget')),
  'journey-timeline': React.lazy(() => import('./widgets/JourneyTimelineWidget')),
  'world-map': React.lazy(() => import('./widgets/WorldMapWidget')),
  'revenue-compass': React.lazy(() => import('./widgets/RevenueCompassWidget')),
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
    // Travel theme widgets
    'departure-board': { label: 'Departure Board', description: 'Airport-style departure information' },
    'passport-tracker': { label: 'Passport Tracker', description: 'Track passport expiry dates' },
    'journey-timeline': { label: 'Journey Timeline', description: 'Visual journey timeline' },
    'world-map': { label: 'World Map', description: 'Interactive destination map' },
    'revenue-compass': { label: 'Revenue Compass', description: 'Circular revenue dashboard' },
  };

  return metadata[type];
}
