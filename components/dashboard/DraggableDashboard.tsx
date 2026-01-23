import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactGridLayout, { Layout, WidthProvider } from 'react-grid-layout/legacy';
import { GripVertical, MoreHorizontal, Plus, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { WidgetType } from '@/core/types/dashboard';
import WidgetRenderer from './WidgetRenderer';
import WidgetToolbar from './WidgetToolbar';
import AddWidgetPanel from './AddWidgetPanel';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(ReactGridLayout);

export default function DraggableDashboard() {
  const userRole = useAppStore((state) => state.userRole);
  const userName = useAppStore((state) => state.userName);
  
  const widgets = useDashboardStore((state) => state.widgets);
  const currentRole = useDashboardStore((state) => state.currentRole);
  const isEditMode = useDashboardStore((state) => state.isEditMode);
  const selectedWidgetId = useDashboardStore((state) => state.selectedWidgetId);
  const lastSavedAt = useDashboardStore((state) => state.lastSavedAt);
  const setRole = useDashboardStore((state) => state.setRole);
  const setEditMode = useDashboardStore((state) => state.setEditMode);
  const setSelectedWidgetId = useDashboardStore((state) => state.setSelectedWidgetId);
  const applyLayout = useDashboardStore((state) => state.applyLayout);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const addWidgetByType = useDashboardStore((state) => state.addWidgetByType);
  const saveLayout = useDashboardStore((state) => state.saveLayout);
  const discardChanges = useDashboardStore((state) => state.discardChanges);
  const resetToDefault = useDashboardStore((state) => state.resetToDefault);
  
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    // Only set role once on mount or when userRole changes
    if (currentRole !== userRole) {
      setRole(userRole);
    }
  }, [userRole]);

  const layout = useMemo<Layout>(
    () =>
      widgets.map((widget) => ({
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
        minW: widget.layout.minW,
        minH: widget.layout.minH,
        maxW: widget.layout.maxW,
        maxH: widget.layout.maxH,
        static: !isEditMode,
      })),
    [widgets, isEditMode]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode) return;
      applyLayout(newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })));
    },
    [applyLayout, isEditMode]
  );

  const handleSave = () => {
    saveLayout();
    setEditMode(false);
    setShowLibrary(false);
  };

  const handleCancel = () => {
    discardChanges();
    setEditMode(false);
    setShowLibrary(false);
  };

  const handleReset = () => {
    resetToDefault(userRole);
  };

  const handleAddWidget = (type: WidgetType) => {
    addWidgetByType(type);
  };

  return (
    <div className="min-h-screen p-6 bg-surface">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back{userName ? `, ${userName}` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditMode && (
            <button
              onClick={() => {
                setEditMode(true);
                setShowLibrary(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} />
              Edit dashboard
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
            <Plus size={16} />
            New tour
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <WidgetToolbar
            onAdd={() => setShowLibrary(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onReset={handleReset}
            lastSavedAt={lastSavedAt}
          />
        </div>
      )}

      {widgets.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
            <div className="text-center text-gray-500">
              <p className="font-medium">No widgets yet</p>
              <button
                onClick={() => {
                  setEditMode(true);
                  setShowLibrary(true);
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-brand-600 hover:text-brand-700"
              >
                <Plus size={14} />
                Add widgets
              </button>
            </div>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={80}
            margin={[16, 16] as const}
            containerPadding={[0, 0] as const}
            onLayoutChange={handleLayoutChange}
            onDragStop={() => isEditMode && saveLayout()}
            onResizeStop={() => isEditMode && saveLayout()}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableHandle=".widget-drag-handle"
            useCSSTransforms
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                onClick={() => setSelectedWidgetId(widget.id)}
                className={cn(
                  'relative rounded-xl bg-white border transition-all duration-200 overflow-hidden flex flex-col',
                  isEditMode
                    ? 'border-dashed border-brand-200 shadow-lg'
                    : 'border-gray-200 shadow-sm',
                  selectedWidgetId === widget.id && 'ring-2 ring-brand-400'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between px-4 py-3 border-b border-gray-100',
                    isEditMode && 'bg-brand-50 widget-drag-handle cursor-move'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isEditMode && <GripVertical size={16} className="text-gray-400" />}
                    <h3 className="font-semibold text-gray-800 text-sm">{widget.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditMode ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeWidget(widget.id);
                        }}
                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <WidgetRenderer widget={widget} />
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}

      <AddWidgetPanel
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onAdd={(type) => {
          handleAddWidget(type);
          setShowLibrary(false);
        }}
      />
    </div>
  );
}
