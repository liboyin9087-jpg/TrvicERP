import React from 'react';
import type { Widget } from '@/core/types/dashboard';
import KpiCardWidget from './widgets/KpiCardWidget';
import LineChartWidget from './widgets/LineChartWidget';
import BarChartWidget from './widgets/BarChartWidget';
import PieChartWidget from './widgets/PieChartWidget';
import DataTableWidget from './widgets/DataTableWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import CalendarWidget from './widgets/CalendarWidget';
import NotificationsWidget from './widgets/NotificationsWidget';
import WeatherWidget from './widgets/WeatherWidget';
import RecentOrdersWidget from './widgets/RecentOrdersWidget';
import PendingTasksWidget from './widgets/PendingTasksWidget';
import CustomerRankingWidget from './widgets/CustomerRankingWidget';

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ widget: Widget }>> = {
  'kpi-card': KpiCardWidget,
  'chart-line': LineChartWidget,
  'chart-bar': BarChartWidget,
  'chart-pie': PieChartWidget,
  'data-table': DataTableWidget,
  'quick-actions': QuickActionsWidget,
  calendar: CalendarWidget,
  notifications: NotificationsWidget,
  weather: WeatherWidget,
  'recent-orders': RecentOrdersWidget,
  'pending-tasks': PendingTasksWidget,
  'customer-ranking': CustomerRankingWidget,
};

interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const Component = WIDGET_COMPONENTS[widget.type];

  if (!Component) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Unsupported widget
      </div>
    );
  }

  return <Component widget={widget} />;
}
