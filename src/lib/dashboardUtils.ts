import type { Widget, WidgetLibraryItem } from '../core/types/dashboard';

export function createWidgetInstance(
  libraryItem: WidgetLibraryItem,
  overrides?: Partial<Widget>
): Widget {
  const timestamp = Date.now();
  const id = overrides?.id ?? `${libraryItem.type}-${timestamp}`;
  return {
    id,
    type: libraryItem.type,
    title: overrides?.title ?? libraryItem.title,
    config: { ...(libraryItem.defaultConfig || {}), ...(overrides?.config || {}) },
    layout: { ...libraryItem.defaultLayout, ...(overrides?.layout || {}) },
  };
}

export function cloneWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => ({
    ...widget,
    config: { ...widget.config },
    layout: { ...widget.layout },
  }));
}
