import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DashboardRole, Widget, WidgetConfig, WidgetLayout, WidgetLibraryItem } from '@/core/types/dashboard';

// --- External utilities and data (moved/assumed to be in appropriate files) ---
// Assuming these are now imported from a dedicated utility file
import {
  cloneWidgets,
  createWidgetInstance,
  isFiniteNumber,
  toOptionalNumber,
  normalizeLayout,
  normalizeWidget,
  normalizeWidgetArray,
  normalizeLayoutsByRole as utilNormalizeLayoutsByRole, // Renamed to avoid conflict
  getNextWidgetY,
  getWidgetLibraryItemLayout
} from '@/lib/dashboard/dashboardUtils';

// Assuming default layouts and widget library are in a data file
import { DEFAULT_LAYOUTS, DEFAULT_WIDGET_LIBRARY } from '@/data/dashboardLayouts';

// --- Configuration Interface for the Dashboard Store ---
/**
 * 配置面板商店的初始狀態和行為。
 * 這允許在不同環境或特定用例中定制儀表板。
 */
export interface IDashboardStoreConfig {
  /** 預設的儀表板角色 */
  defaultRole?: DashboardRole;
  /** 預設佈局的初始映射，按角色分類 */
  initialLayoutsByRole?: Record<DashboardRole, Widget[]>;
  /** 可用的元件庫項目 */
  widgetLibrary?: WidgetLibraryItem[];
  /** 當元件沒有預設佈局時的後備佈局 */
  fallbackLayout?: WidgetLayout;
  /** 持久化儲存的名稱 */
  persistenceName?: string;
  /** 持久化儲存的版本 */
  persistenceVersion?: number;
}

// --- Dashboard State Interface ---
interface DashboardState {
  currentRole: DashboardRole;
  widgets: Widget[];
  layoutsByRole: Record<DashboardRole, Widget[]>;
  isEditMode: boolean;
  selectedWidgetId: string | null;
  availableWidgets: WidgetLibraryItem[]; // Initialized from config, but can be managed by store if dynamic
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

// --- Store Factory Function (allows for configurable store instances) ---
/**
 * 創建一個可配置的儀表板 Zustand Store。
 * 透過傳遞配置物件，可以為不同的儀表板實例或環境提供不同的預設值。
 *
 * @param config 儀表板商店的配置選項。
 * @returns Zustand 商店 Hook。
 */
export const createDashboardStore = (config?: IDashboardStoreConfig) => {
  const finalConfig: Required<IDashboardStoreConfig> = {
    defaultRole: config?.defaultRole || 'staff',
    initialLayoutsByRole: config?.initialLayoutsByRole || {
      staff: cloneWidgets(DEFAULT_LAYOUTS.staff),
      welfare: cloneWidgets(DEFAULT_LAYOUTS.welfare),
      traveler: cloneWidgets(DEFAULT_LAYOUTS.traveler),
    },
    widgetLibrary: config?.widgetLibrary || DEFAULT_WIDGET_LIBRARY,
    fallbackLayout: config?.fallbackLayout || { x: 0, y: 0, w: 4, h: 4 },
    persistenceName: config?.persistenceName || 'trvic-dashboard',
    persistenceVersion: config?.persistenceVersion || 1,
  };

  const initialWidgetsForDefaultRole = cloneWidgets(
    finalConfig.initialLayoutsByRole[finalConfig.defaultRole]
  );

  return create<DashboardState>()(
    persist(
      (set, get) => ({
        currentRole: finalConfig.defaultRole,
        widgets: initialWidgetsForDefaultRole,
        layoutsByRole: finalConfig.initialLayoutsByRole,
        isEditMode: false,
        selectedWidgetId: null,
        availableWidgets: finalConfig.widgetLibrary,
        lastSavedAt: null,

        setRole: (role) => {
          const safeLayoutsByRole = utilNormalizeLayoutsByRole(get().layoutsByRole, finalConfig.initialLayoutsByRole);
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
            const normalized = normalizeWidget(widget, finalConfig.widgetLibrary, finalConfig.fallbackLayout);
            return {
              widgets: [...state.widgets, normalized],
              selectedWidgetId: normalized.id,
            };
          }),

        addWidgetByType: (type) => {
          const { widgets, availableWidgets } = get();
          const libraryItem = availableWidgets.find((item) => item.type === type);
          if (!libraryItem) return;

          const nextY = getNextWidgetY(widgets);
          const defaultLayout = getWidgetLibraryItemLayout(libraryItem, finalConfig.fallbackLayout);

          const widget = createWidgetInstance(libraryItem, {
            layout: { ...defaultLayout, y: nextY },
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
          const normalizedWidgets = widgets.map((widget) => normalizeWidget(widget, finalConfig.widgetLibrary, finalConfig.fallbackLayout));
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
          const safeLayoutsByRole = utilNormalizeLayoutsByRole(get().layoutsByRole, finalConfig.initialLayoutsByRole);
          set({
            widgets: cloneWidgets(safeLayoutsByRole[currentRole]),
            layoutsByRole: safeLayoutsByRole,
            selectedWidgetId: null,
          });
        },

        resetToDefault: (role) => {
          const targetRole = role || get().currentRole;
          const defaultLayoutForRole = cloneWidgets(finalConfig.initialLayoutsByRole[targetRole]);
          set((state) => ({
            widgets: defaultLayoutForRole,
            layoutsByRole: {
              ...state.layoutsByRole,
              [targetRole]: defaultLayoutForRole,
            },
            selectedWidgetId: null,
          }));
        },

        loadLayout: (role) => {
          get().setRole(role);
        },
      }),
      {
        name: finalConfig.persistenceName,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          layoutsByRole: state.layoutsByRole,
          lastSavedAt: state.lastSavedAt,
        }),
        version: finalConfig.persistenceVersion,
        migrate: (persistedState: any, version: number) => {
          // Migration logic can be placed here or in a dedicated utility
          // This example re-uses `utilNormalizeLayoutsByRole` for robustness
          const lastSavedAt =
            typeof persistedState?.lastSavedAt === 'string' ? persistedState.lastSavedAt : null;

          let layoutsByRole = {};
          if (version < finalConfig.persistenceVersion || !persistedState?.layoutsByRole) {
            layoutsByRole = utilNormalizeLayoutsByRole(persistedState?.layoutsByRole, finalConfig.initialLayoutsByRole);
          } else {
            layoutsByRole = persistedState.layoutsByRole;
          }

          return {
            layoutsByRole: layoutsByRole,
            lastSavedAt,
          };
        },
      }
    )
  );
};

// --- Default Dashboard Store Export (Singleton for the application) ---
// This exports the default, configured dashboard store for use throughout the application.
// If multiple distinct dashboards with different configurations are needed,
// components can directly call `createDashboardStore` with their specific config.
export const useDashboardStore = createDashboardStore({
  defaultRole: 'staff',
  // initialLayoutsByRole: DEFAULT_LAYOUTS, // Can override or rely on internal defaults
  // widgetLibrary: DEFAULT_WIDGET_LIBRARY, // Can override or rely on internal defaults
  persistenceName: 'trvic-dashboard-v2', // Changed name due to migration/refactor
  persistenceVersion: 2, // Increment version due to refactor and new migration logic
});

// Note: The UI-specific requirements (Tailwind tokens, Card structure, drag-handle)
// are applicable to React components that *consume* this store, not this store
// definition file itself. This file solely focuses on state management.