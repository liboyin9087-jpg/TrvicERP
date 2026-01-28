import React, { useCallback, useEffect, useMemo, useState, Component, ReactNode } from 'react';
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
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
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

  // Determine if the current user has permission to edit
  // Assuming 'ADMIN' is the role with full edit permissions for editing the dashboard layout and widgets.
  const canEdit = useMemo(() => userRole === 'ADMIN', [userRole]);

  useEffect(() => {
    // Only set role once on mount or when userRole changes, if different from currentRole in store and userRole is defined
    if (userRole && currentRole !== userRole) {
      setRole(userRole);
    }
  }, [userRole, currentRole, setRole]);

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
      if (!isEditMode || !canEdit) return; // Only allow layout changes in edit mode and if user has edit permission
      applyLayout(newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })));
    },
    [applyLayout, isEditMode, canEdit]
  );

  // Debounced saveLayout for drag/resize stop events to prevent excessive updates
  const debouncedSaveLayout = useMemo(() => debounce(saveLayout, 300), [saveLayout]);

  const handleSave = () => {
    if (!canEdit) return; // Prevent saving if user doesn't have permission
    saveLayout();
    setEditMode(false);
    setShowLibrary(false);
  };

  const handleCancel = () => {
    if (!canEdit) return; // Prevent discarding if user doesn't have permission
    discardChanges();
    setEditMode(false);
    setShowLibrary(false);
  };

  const handleReset = () => {
    if (!canEdit) return; // Prevent resetting if user doesn't have permission
    resetToDefault(userRole);
  };

  const handleAddWidget = (type: WidgetType) => {
    if (!canEdit) return; // Prevent adding if user doesn't have permission
    addWidgetByType(type);
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
            {!isEditMode && canEdit && ( // Only show edit button if not in edit mode AND user has edit permission
              <button
                onClick={() => {
                  setEditMode(true);
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

        {isEditMode && canEdit && ( // Only show toolbar if in edit mode AND user has edit permission
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
            <div className="flex flex-col items-center justify-center h-96 bg-card rounded-lg border border-border
                            focus-within:ring-2 focus-within:ring-primary-300"> {/* Added focus-within for accessibility */}
              <div className="text-center text-muted-foreground">
                <p className="font-medium">No widgets yet</p>
                {canEdit && ( // Only show add widgets button if user has edit permission
                  <button
                    onClick={() => {
                      setEditMode(true);
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
              onDragStop={() => isEditMode && canEdit && debouncedSaveLayout()} // Apply permission and debounce
              onResizeStop={() => isEditMode && canEdit && debouncedSaveLayout()} // Apply permission and debounce
              isDraggable={isEditMode && canEdit} // Only draggable if in edit mode AND user has edit permission
              isResizable={isEditMode && canEdit} // Only resizable if in edit mode AND user has edit permission
              draggableHandle=".widget-drag-handle"
              useCSSTransforms
            >
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  onClick={() => setSelectedWidgetId(widget.id)}
                  className={cn(
                    'relative rounded-lg bg-card border transition-all duration-200 overflow-hidden flex flex-col',
                    isEditMode && canEdit // Check canEdit for edit mode styling
                      ? 'border-dashed border-primary shadow-lg' // Use border-primary token
                      : 'border-border shadow-sm',
                    selectedWidgetId === widget.id && 'ring-2 ring-primary-400'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between px-4 py-3 border-b border-border',
                      isEditMode && canEdit && 'bg-primary/5 widget-drag-handle cursor-move' // Use bg-primary/5 token
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isEditMode && canEdit && <GripVertical size={16} className="text-muted-foreground" />}
                      <h3 className="font-semibold text-foreground text-sm">{widget.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditMode && canEdit ? ( // Only show remove button if user has edit permission
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeWidget(widget.id);
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

        {/* AddWidgetPanel only shown if user has edit permissions */}
        <AddWidgetPanel
          isOpen={showLibrary && canEdit} // Only open if showLibrary is true AND user has edit permission
          onClose={() => setShowLibrary(false)}
          onAdd={(type) => {
            if (!canEdit) return; // Guard against adding if no permission
            handleAddWidget(type);
            setShowLibrary(false);
          }}
        />
      </div>
    </ErrorBoundary>
  );
}