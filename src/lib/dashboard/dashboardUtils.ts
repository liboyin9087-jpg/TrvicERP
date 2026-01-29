/**
 * Dashboard Utility Functions
 */

import type { Widget, WidgetLayout, WidgetLibraryItem, DashboardRole } from '@/core/types/dashboard';

/**
 * Deep clone widgets array
 */
export function cloneWidgets(widgets: Widget[]): Widget[] {
  return JSON.parse(JSON.stringify(widgets));
}

/**
 * Create a new widget instance from a library item
 */
export function createWidgetInstance(
  libraryItem: WidgetLibraryItem,
  overrides?: Partial<Widget>
): Widget {
  const id = `${libraryItem.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type: libraryItem.type,
    title: libraryItem.name,
    config: libraryItem.defaultConfig || {},
    layout: libraryItem.defaultLayout || { x: 0, y: 0, w: 4, h: 4 },
    ...overrides,
  };
}

/**
 * Check if a number is finite and valid
 */
export function isFiniteNumber(value: any): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Convert value to optional number
 */
export function toOptionalNumber(value: any): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

/**
 * Normalize widget layout
 */
export function normalizeLayout(layout: any, fallback: WidgetLayout): WidgetLayout {
  return {
    x: isFiniteNumber(layout?.x) ? layout.x : fallback.x,
    y: isFiniteNumber(layout?.y) ? layout.y : fallback.y,
    w: isFiniteNumber(layout?.w) ? layout.w : fallback.w,
    h: isFiniteNumber(layout?.h) ? layout.h : fallback.h,
    minW: toOptionalNumber(layout?.minW),
    minH: toOptionalNumber(layout?.minH),
    maxW: toOptionalNumber(layout?.maxW),
    maxH: toOptionalNumber(layout?.maxH),
  };
}

/**
 * Normalize a single widget
 */
export function normalizeWidget(
  widget: Widget,
  library: WidgetLibraryItem[],
  fallbackLayout: WidgetLayout
): Widget {
  const libraryItem = library.find(item => item.type === widget.type);
  const defaultLayout = libraryItem?.defaultLayout || fallbackLayout;
  
  return {
    ...widget,
    layout: normalizeLayout(widget.layout, defaultLayout),
    config: widget.config || {},
  };
}

/**
 * Normalize widget array
 */
export function normalizeWidgetArray(
  widgets: Widget[],
  library: WidgetLibraryItem[],
  fallbackLayout: WidgetLayout
): Widget[] {
  if (!Array.isArray(widgets)) return [];
  return widgets.map(w => normalizeWidget(w, library, fallbackLayout));
}

/**
 * Normalize layouts by role
 */
export function normalizeLayoutsByRole(
  layoutsByRole: any,
  defaultLayouts: Record<DashboardRole, Widget[]>
): Record<DashboardRole, Widget[]> {
  const result: Record<DashboardRole, Widget[]> = {
    staff: [],
    welfare: [],
    traveler: [],
  };
  
  for (const role of ['staff', 'welfare', 'traveler'] as DashboardRole[]) {
    const roleLayouts = layoutsByRole?.[role];
    result[role] = Array.isArray(roleLayouts) && roleLayouts.length > 0
      ? cloneWidgets(roleLayouts)
      : cloneWidgets(defaultLayouts[role] || []);
  }
  
  return result;
}

/**
 * Get the next available Y position for a new widget
 */
export function getNextWidgetY(widgets: Widget[]): number {
  if (!widgets || widgets.length === 0) return 0;
  
  const maxY = Math.max(...widgets.map(w => (w.layout.y || 0) + (w.layout.h || 4)));
  return maxY;
}

/**
 * Get layout from widget library item
 */
export function getWidgetLibraryItemLayout(
  item: WidgetLibraryItem,
  fallback: WidgetLayout
): WidgetLayout {
  return item.defaultLayout || fallback;
}
