import type { Widget, WidgetLibraryItem } from '../core/types/dashboard';

/**
 * Configuration interface for the `createWidgetInstance` function.
 * This local type definition encapsulates the parameters required to create a new widget instance,
 * promoting type independence for the function's input signature and adhering to the
 * principle of defining local types for function configurations.
 */
interface DashboardUtilsCreateWidgetConfig {
  /** The library item from which the widget instance is to be created. */
  libraryItem: WidgetLibraryItem;
  /** Optional overrides for the new widget instance's properties. */
  overrides?: Partial<Widget>;
}

/**
 * Creates a new widget instance based on a library item and optional overrides.
 * A unique ID is generated if not provided in the overrides.
 *
 * @param config - The configuration object containing the library item and overrides.
 * @returns A new Widget instance.
 */
export function createWidgetInstance(
  config: DashboardUtilsCreateWidgetConfig
): Widget {
  const timestamp = Date.now();
  const id = config.overrides?.id ?? `${config.libraryItem.type}-${timestamp}`;
  return {
    id,
    type: config.libraryItem.type,
    title: config.overrides?.title ?? config.libraryItem.title,
    config: {
      ...(config.libraryItem.defaultConfig || {}),
      ...(config.overrides?.config || {}),
    },
    layout: {
      ...config.libraryItem.defaultLayout,
      ...(config.overrides?.layout || {}),
    },
  };
}

/**
 * Creates deep clones of an array of widgets.
 * This ensures that when widgets are modified, the original array or its contained
 * widget objects are not inadvertently mutated.
 *
 * @param widgets - An array of Widget objects to clone.
 * @returns A new array containing deep clones of the original widgets.
 */
export function cloneWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => ({
    ...widget,
    // Deep clone nested objects to prevent unintended mutations
    config: { ...widget.config },
    layout: { ...widget.layout },
  }));
}