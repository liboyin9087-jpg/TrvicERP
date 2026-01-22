import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DashboardRole, Widget, WidgetConfig, WidgetLibraryItem } from '@/core/types/dashboard';
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
        const { layoutsByRole } = get();
        const nextWidgets =
          layoutsByRole[role] && layoutsByRole[role].length > 0
            ? cloneWidgets(layoutsByRole[role])
            : cloneWidgets(DEFAULT_LAYOUTS[role]);
        set({
          currentRole: role,
          widgets: nextWidgets,
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
        set((state) => ({
          widgets: [...state.widgets, widget],
          selectedWidgetId: widget.id,
        })),

      addWidgetByType: (type) => {
        const { availableWidgets } = get();
        const libraryItem = availableWidgets.find((item) => item.type === type);
        if (!libraryItem) return;
        const widget = createWidgetInstance(libraryItem, {
          layout: { ...libraryItem.defaultLayout, y: Infinity },
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
        set((state) => ({
          layoutsByRole: {
            ...state.layoutsByRole,
            [currentRole]: cloneWidgets(widgets),
          },
          lastSavedAt: new Date().toISOString(),
        }));
      },

      discardChanges: () => {
        const { currentRole, layoutsByRole } = get();
        set({
          widgets: cloneWidgets(layoutsByRole[currentRole] || DEFAULT_LAYOUTS[currentRole]),
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
    }
  )
);
