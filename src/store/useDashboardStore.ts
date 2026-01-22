import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DashboardRole, Widget, WidgetConfig, WidgetLibraryItem, WidgetLayout } from '@/core/types/dashboard';
import { DEFAULT_LAYOUTS, DEFAULT_WIDGET_LIBRARY } from '@/data/dashboardLayouts';
import { cloneWidgets, createWidgetInstance } from '@/lib/dashboardUtils';

interface DashboardState {
  currentRole: DashboardRole;
  widgets: Widget[];
  layoutsByRole: Record<DashboardRole, Widget[]>;
  isEditMode: boolean;
  selectedWidgetId: string | null;
  availableWidgets: WidgetLibraryItem[];
  lastSavedAt: string | null;

  setRole: (role: DashboardRole) => void;
  setEditMode: (mode: boolean) => void;
  setSelectedWidgetId: (id: string | null) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, w: number, h: number) => void;
  applyLayout: (items: Array<{ i: string; x: number; y: number; w: number; h: number }>) => void;
  updateWidgetLayout: (id: string, layout: Partial<Widget['layout']>) => void;
  updateWidgetTitle: (id: string, title: string) => void;
  addWidget: (widget: Widget) => void;
  addWidgetByType: (type: Widget['type']) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void;
  saveLayout: () => void;
  discardChanges: () => void;
  resetToDefault: (role?: DashboardRole) => void;
  loadLayout: (role: DashboardRole) => void;
}

const initialLayoutsByRole: Record<DashboardRole, Widget[]> = {
  staff: cloneWidgets(DEFAULT_LAYOUTS.staff),
  welfare: cloneWidgets(DEFAULT_LAYOUTS.welfare),
  traveler: cloneWidgets(DEFAULT_LAYOUTS.traveler),
};

const FALLBACK_LAYOUT: WidgetLayout = { x: 0, y: 0, w: 4, h: 4 };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toOptionalNumber = (value: unknown): number | undefined =>
  isFiniteNumber(value) ? value : undefined;

const getFallbackLayout = (type: Widget['type']): WidgetLayout => {
  const libraryItem = DEFAULT_WIDGET_LIBRARY.find((item) => item.type === type);
  return libraryItem?.defaultLayout ?? FALLBACK_LAYOUT;
};

const normalizeLayout = (layout: Partial<WidgetLayout> | undefined, fallback: WidgetLayout): WidgetLayout => {
  const x = isFiniteNumber(layout?.x) ? layout!.x : fallback.x;
  const y = isFiniteNumber(layout?.y) ? layout!.y : fallback.y;
  const w = Math.max(1, isFiniteNumber(layout?.w) ? layout!.w : fallback.w);
  const h = Math.max(1, isFiniteNumber(layout?.h) ? layout!.h : fallback.h);
  const minW = toOptionalNumber(layout?.minW) ?? fallback.minW;
  const minH = toOptionalNumber(layout?.minH) ?? fallback.minH;
  const maxW = toOptionalNumber(layout?.maxW) ?? fallback.maxW;
  const maxH = toOptionalNumber(layout?.maxH) ?? fallback.maxH;

  return {
    x,
    y,
    w,
    h,
    ...(minW !== undefined ? { minW } : {}),
    ...(minH !== undefined ? { minH } : {}),
    ...(maxW !== undefined ? { maxW } : {}),
    ...(maxH !== undefined ? { maxH } : {}),
  };
};

const normalizeWidget = (widget: Widget): Widget => {
  const fallbackLayout = getFallbackLayout(widget.type);
  return {
    ...widget,
    config: widget.config ?? {},
    layout: normalizeLayout(widget.layout, fallbackLayout),
  };
};

const normalizeWidgetArray = (widgets: unknown, role: DashboardRole): Widget[] => {
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return cloneWidgets(DEFAULT_LAYOUTS[role]);
  }

  const filtered = widgets.filter(
    (widget): widget is Widget =>
      widget &&
      typeof widget.id === 'string' &&
      typeof widget.type === 'string' &&
      widget.layout
  );

  if (filtered.length === 0) {
    return cloneWidgets(DEFAULT_LAYOUTS[role]);
  }

  return filtered.map((widget) => normalizeWidget(widget));
};

const normalizeLayoutsByRole = (layouts: unknown): Record<DashboardRole, Widget[]> => {
  const raw =
    layouts && typeof layouts === 'object'
      ? (layouts as Partial<Record<DashboardRole, Widget[]>>)
      : {};
  return {
    staff: normalizeWidgetArray(raw.staff, 'staff'),
    welfare: normalizeWidgetArray(raw.welfare, 'welfare'),
    traveler: normalizeWidgetArray(raw.traveler, 'traveler'),
  };
};

const getNextWidgetY = (widgets: Widget[]): number =>
  widgets.reduce((maxY, widget) => {
    const { layout } = widget;
    if (!layout || !isFiniteNumber(layout.y) || !isFiniteNumber(layout.h)) {
      return maxY;
    }
    return Math.max(maxY, layout.y + layout.h);
  }, 0);

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      currentRole: 'staff',
      widgets: cloneWidgets(DEFAULT_LAYOUTS.staff),
      layoutsByRole: initialLayoutsByRole,
      isEditMode: false,
      selectedWidgetId: null,
      availableWidgets: DEFAULT_WIDGET_LIBRARY,
      lastSavedAt: null,

      setRole: (role) => {
        const safeLayoutsByRole = normalizeLayoutsByRole(get().layoutsByRole);
        const nextWidgets = safeLayoutsByRole[role];
        set({
          currentRole: role,
          widgets: cloneWidgets(nextWidgets),
          layoutsByRole: safeLayoutsByRole,
          selectedWidgetId: null,
          isEditMode: false,
        });
      },

      setEditMode: (mode) => set({ isEditMode: mode }),

      setSelectedWidgetId: (id) => set({ selectedWidgetId: id }),

      updateWidgetPosition: (id, x, y) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, layout: { ...widget.layout, x, y } } : widget
          ),
        })),

      updateWidgetSize: (id, w, h) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, layout: { ...widget.layout, w, h } } : widget
          ),
        })),

      applyLayout: (items) => {
        const layoutMap = new Map(items.map((item) => [item.i, item]));
        set((state) => ({
          widgets: state.widgets.map((widget) => {
            const layout = layoutMap.get(widget.id);
            if (!layout) return widget;
            const nextLayout = {
              ...widget.layout,
              x: layout.x,
              y: layout.y,
              w: layout.w,
              h: layout.h,
            };
            return { ...widget, layout: nextLayout };
          }),
        }));
      },

      updateWidgetLayout: (id, layout) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, layout: { ...widget.layout, ...layout } } : widget
          ),
        })),

      updateWidgetTitle: (id, title) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, title } : widget
          ),
        })),

      addWidget: (widget) =>
        set((state) => {
          const normalized = normalizeWidget(widget);
          return {
            widgets: [...state.widgets, normalized],
            selectedWidgetId: normalized.id,
          };
        }),

      addWidgetByType: (type) => {
        const { availableWidgets, widgets } = get();
        const libraryItem = availableWidgets.find((item) => item.type === type);
        if (!libraryItem) return;
        const nextY = getNextWidgetY(widgets);
        const widget = createWidgetInstance(libraryItem, {
          layout: { ...libraryItem.defaultLayout, y: nextY },
        });
        get().addWidget(widget);
      },

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
          selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
        })),

      updateWidgetConfig: (id, config) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, config: { ...widget.config, ...config } } : widget
          ),
        })),

      saveLayout: () => {
        const { widgets, currentRole } = get();
        const normalizedWidgets = widgets.map((widget) => normalizeWidget(widget));
        set((state) => ({
          widgets: normalizedWidgets,
          layoutsByRole: {
            ...state.layoutsByRole,
            [currentRole]: cloneWidgets(normalizedWidgets),
          },
          lastSavedAt: new Date().toISOString(),
        }));
      },

      discardChanges: () => {
        const { currentRole } = get();
        const safeLayoutsByRole = normalizeLayoutsByRole(get().layoutsByRole);
        set({
          widgets: cloneWidgets(safeLayoutsByRole[currentRole]),
          layoutsByRole: safeLayoutsByRole,
          selectedWidgetId: null,
        });
      },

      resetToDefault: (role) => {
        const targetRole = role || get().currentRole;
        set((state) => ({
          widgets: cloneWidgets(DEFAULT_LAYOUTS[targetRole]),
          layoutsByRole: {
            ...state.layoutsByRole,
            [targetRole]: cloneWidgets(DEFAULT_LAYOUTS[targetRole]),
          },
          selectedWidgetId: null,
        }));
      },

      loadLayout: (role) => {
        get().setRole(role);
      },
    }),
    {
      name: 'trvic-dashboard',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layoutsByRole: state.layoutsByRole,
        lastSavedAt: state.lastSavedAt,
      }),
      version: 1,
      migrate: (persistedState: any) => {
        const lastSavedAt =
          typeof persistedState?.lastSavedAt === 'string' ? persistedState.lastSavedAt : null;
        return {
          layoutsByRole: normalizeLayoutsByRole(persistedState?.layoutsByRole),
          lastSavedAt,
        };
      },
    }
  )
);
