import React, { useCallback, useEffect, useMemo, useState, Component, ReactNode } from 'react';
import ReactGridLayout, { Layout, WidthProvider } from 'react-grid-layout/legacy';
import { GripVertical, MoreHorizontal, Plus, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetType, Widget } from '@/core/types/dashboard';
import WidgetRenderer from './WidgetRenderer';
import WidgetToolbar from './WidgetToolbar';
import AddWidgetPanel from './AddWidgetPanel';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error in DraggableDashboard:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-80 p-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
          <p className="text-lg font-semibold">Oops! Something went wrong.</p>
          <p className="text-sm mt-2 text-destructive/90">We're working to fix it. Please try refreshing.</p>
          {this.state.error && (
            <details className="mt-4 text-sm text-destructive/90 cursor-pointer">
              <summary className="font-medium hover:underline">Error Details</summary>
              <pre className="mt-2 p-3 bg-destructive/5 rounded-md whitespace-pre-wrap break-all text-left max-w-lg overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Debounce Utility ---
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, delay);
  };
}

const ResponsiveGridLayout = WidthProvider(ReactGridLayout);

// --- DraggableDashboardConfig Interface ---
interface DraggableDashboardConfig {
  userRole: string | null;
  userName: string | null;
  widgets: Widget[];
  isEditMode: boolean;
  selectedWidgetId: string | null;
  lastSavedAt: Date | null;
  canEdit: boolean; // Derived in parent and passed down
  availableWidgets: Array<{
    type: WidgetType;
    title: string;
    description: string;
  }>;

  // Actions as callbacks from the parent component
  onSetEditMode: (mode: boolean) => void;
  onSetSelectedWidgetId: (id: string | null) => void;
  onApplyLayout: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => void;
  onRemoveWidget: (id: string) => void;
  onAddWidgetByType: (type: WidgetType) => void;
  onSaveLayout: () => void;
  onDiscardChanges: () => void;
  onResetToDefault: (role: string | null) => void;
}

export default function DraggableDashboard(props: DraggableDashboardConfig) {
  const {
    userRole,
    userName,
    widgets,
    isEditMode,
    selectedWidgetId,
    lastSavedAt,
    canEdit,
    availableWidgets,
    onSetEditMode,
    onSetSelectedWidgetId,
    onApplyLayout,
    onRemoveWidget,
    onAddWidgetByType,
    onSaveLayout,
    onDiscardChanges,
    onResetToDefault,
  } = props;
  
  const [showLibrary, setShowLibrary] = useState(false);

  // Removed useEffect for setting role as DraggableDashboard is now independent of global store state management.
  // The parent component is responsible for orchestrating global state sync if needed.

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
        // Widgets are static (not draggable/resizable) unless in edit mode AND user has permission
        static: !(isEditMode && canEdit),
      })),
    [widgets, isEditMode, canEdit]
  );

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditMode || !canEdit) return;
      onApplyLayout(newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })));
    },
    [onApplyLayout, isEditMode, canEdit]
  );

  // Debounced onSaveLayout for drag/resize stop events to prevent excessive updates
  const debouncedSaveLayout = useMemo(() => debounce(onSaveLayout, 300), [onSaveLayout]);

  const handleSave = () => {
    if (!canEdit) return;
    onSaveLayout();
    onSetEditMode(false);
    setShowLibrary(false);
  };

  const handleCancel = () => {
    if (!canEdit) return;
    onDiscardChanges();
    onSetEditMode(false);
    setShowLibrary(false);
  };

  const handleReset = () => {
    if (!canEdit) return;
    onResetToDefault(userRole);
  };

  const handleAddWidget = (type: WidgetType) => {
    if (!canEdit) return;
    onAddWidgetByType(type);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-6 bg-surface">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back{userName ? `, ${userName}` : ''}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditMode && canEdit && (
              <button
                onClick={() => {
                  onSetEditMode(true);
                  setShowLibrary(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg
                           hover:bg-secondary transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
              >
                <Settings size={16} />
                Edit dashboard
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg
                               hover:bg-primary/90 transition-colors shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
              <Plus size={16} />
              New tour
            </button>
          </div>
        </div>

        {isEditMode && canEdit && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <WidgetToolbar
              onAdd={() => setShowLibrary(true)}
              onSave={handleSave}
              onCancel={handleCancel}
              onReset={handleReset}
              lastSavedAt={lastSavedAt ? lastSavedAt.toISOString() : null}
            />
          </div>
        )}

        {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-card rounded-lg border border-border
                            focus-within:ring-2 focus-within:ring-primary-300">
              <div className="text-center text-muted-foreground">
                <p className="font-medium">No widgets yet</p>
                {canEdit && (
                  <button
                    onClick={() => {
                      onSetEditMode(true);
                      setShowLibrary(true);
                    }}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:text-primary/90 transition-colors
                               focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800 rounded-md"
                  >
                    <Plus size={14} />
                    Add widgets
                  </button>
                )}
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
              onDragStop={() => isEditMode && canEdit && debouncedSaveLayout()}
              onResizeStop={() => isEditMode && canEdit && debouncedSaveLayout()}
              isDraggable={isEditMode && canEdit}
              isResizable={isEditMode && canEdit}
              draggableHandle=".widget-drag-handle"
              useCSSTransforms
            >
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => onSetSelectedWidgetId(widget.id)}
                  className={cn(
                    'relative rounded-lg bg-card border transition-all duration-200 overflow-hidden flex flex-col',
                    isEditMode && canEdit
                      ? 'border-dashed border-primary shadow-lg'
                      : 'border-border shadow-sm',
                    selectedWidgetId === widget.id && 'ring-2 ring-primary-400'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between px-4 py-3 border-b border-border',
                      isEditMode && canEdit && 'bg-primary/5 cursor-move widget-drag-handle'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isEditMode && canEdit && <GripVertical size={16} className="text-muted-foreground" />}
                      <h3 className="font-semibold text-foreground text-sm">{widget.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditMode && canEdit ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onRemoveWidget(widget.id);
                          }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors
                                     focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        <button className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors
                                           focus:outline-none focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
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
          isOpen={showLibrary && canEdit}
          onClose={() => setShowLibrary(false)}
          onAdd={(type) => {
            if (!canEdit) return;
            handleAddWidget(type);
            setShowLibrary(false);
          }}
          availableWidgets={availableWidgets}
        />
      </div>
    </ErrorBoundary>
  );
}