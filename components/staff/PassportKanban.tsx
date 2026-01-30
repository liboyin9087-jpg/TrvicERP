import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  Announcements,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText, Calendar, MoreHorizontal, Phone, Inbox, Eye, CheckCheck, AlertTriangle, CheckCircle, Search, Plus, GripVertical // Added GripVertical for drag handle
} from 'lucide-react';
import { cn } from '../../src/lib/utils'; // Assuming this utility is available for class merging

// --- 1. Interface Definitions (Config & Data) ---

// Define PassportItem
export interface PassportItem {
  id: string;
  name: string;
  passportNo: string;
  expiry: string;
  tripName: string;
  phone: string;
  email: string;
  submittedAt?: string;
  status: 'pending' | 'reviewing' | 'completed';
}

// Configuration for a single column
export interface ColumnConfig {
  id: PassportItem['status']; // Column ID matches PassportItem status
  title: string;
  icon: React.ElementType;
  gradientFrom: string; // Tailwind token, e.g., 'from-warning-400'
  gradientTo: string;   // Tailwind token, e.g., 'to-warning-500'
  bgColor: string;      // Tailwind token, e.g., 'bg-warning-50'
  textColor: string;    // Tailwind token, e.g., 'text-warning-700'
}

// Main Config Props interface for the PassportKanban component
// Addressing [architect] [架構] 缺少 Config Props 介面定義
export interface PassportKanbanConfig {
  columnsConfig?: ColumnConfig[]; // Optional, with a default value
}

// Props for the PassportKanban component
// Addressing [architect] [架構] 元件直接使用硬編碼的假資料
// Addressing [designer] [設計] 假資料直接寫在元件中
export interface PassportKanbanProps extends PassportKanbanConfig {
  initialItems: PassportItem[];
  // Callbacks for data changes, addressing Single Responsibility and useState usage
  onItemsChange?: (newItems: PassportItem[]) => void;
  onStatusChange?: (itemId: string, newStatus: PassportItem['status'], submittedAt?: string) => void;
  onReorder?: (columnId: PassportItem['status'], newOrder: string[]) => void;
  // Kintone specific props, if any, could be added here later (e.g., `recordId`, `appId`)
}

// --- Default Data & Configuration ---

// Example default columns config, using Dashtail UI semantic tokens
// Addressing [designer] [設計] 顏色使用 Tailwind 漸變類別
const DEFAULT_COLUMNS_CONFIG: ColumnConfig[] = [
  {
    id: 'pending',
    title: '未繳交',
    icon: Inbox,
    gradientFrom: 'from-warning-400', // Replaced amber-400
    gradientTo: 'to-warning-500',     // Replaced orange-500
    bgColor: 'bg-warning-50',         // Replaced amber-50
    textColor: 'text-warning-700',    // Replaced amber-700
  },
  {
    id: 'reviewing',
    title: '審核中',
    icon: Eye,
    gradientFrom: 'from-brand-500',   // Retained brand, assuming it's a defined Dashtail token
    gradientTo: 'to-brand-700',
    bgColor: 'bg-brand-50',
    textColor: 'text-brand-700',
  },
  {
    id: 'completed',
    title: '已完成',
    icon: CheckCheck,
    gradientFrom: 'from-success-400', // Replaced emerald-400
    gradientTo: 'to-success-500',     // Replaced teal-500
    bgColor: 'bg-success-50',         // Replaced emerald-50
    textColor: 'text-success-700',    // Replaced emerald-700
  },
];

// --- Animation Variants (unchanged as they are UI specific) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// --- PassportCard Component ---
interface PassportCardProps {
  item: PassportItem;
  isDragging?: boolean;
  dragHandle?: React.ReactNode; // Refactored to accept a drag handle prop
}

function PassportCard({ item, isDragging, dragHandle }: PassportCardProps) {
  const isExpiringSoon = useCallback((expiry: string) => {
    const expiryDate = new Date(expiry);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiryDate < sixMonthsFromNow;
  }, []);

  return (
    <div
      className={cn(
        'bg-white p-4 rounded-lg border border-border-light shadow-sm transition-all relative', // Using semantic border color and shadow
        isDragging && 'shadow-lg rotate-1 scale-105 border-brand-300 opacity-70', // Adjusted opacity for better visibility
        'focus-within:ring-2 focus-within:ring-brand-200 focus-within:ring-offset-1' // Added focus style for accessibility
      )}
    >
      {dragHandle && (
        // Drag handle positioning
        <div className="absolute top-2 right-2 text-neutral-300 hover:text-neutral-500 transition-colors z-10">
          {dragHandle}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-white font-bold">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{item.name}</p> {/* Using semantic text color */}
            <p className="text-sm text-text-secondary font-mono">{item.passportNo}</p> {/* Using semantic text color */}
          </div>
        </div>
        {isExpiringSoon(item.expiry) && (
          <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center" title="護照即將到期">
            <AlertTriangle className="w-3.5 h-3.5 text-danger-500" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm bg-neutral-100 px-2.5 py-1 rounded-lg text-neutral-600 font-medium">
            {item.tripName}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>效期 {item.expiry}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>{item.phone}</span>
          </div>
        </div>

        {item.submittedAt && (
          <div className="flex items-center gap-1.5 text-sm text-success-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>繳交於 {item.submittedAt}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mt-3 pt-3 border-t border-border-light">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors focus:ring-2 focus:ring-brand-300"
          aria-label={`更多關於 ${item.name} 的選項`} // Added accessibility label
        >
          <MoreHorizontal className="w-4 h-4 text-text-secondary" />
        </motion.button>
      </div>
    </div>
  );
}

// --- SortablePassportCard Component (with drag handle) ---
interface SortablePassportCardProps {
  item: PassportItem;
}

function SortablePassportCard({ item }: SortablePassportCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Add a specific drag handle
  // Addressing [designer] [設計] 缺少 drag-handle 的明確結構
  const dragHandle = (
    <div className="drag-handle p-1.5 rounded-md hover:bg-neutral-200" {...listeners}>
      <GripVertical className="w-4 h-4" />
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PassportCard item={item} isDragging={isDragging} dragHandle={dragHandle} />
    </div>
  );
}

// --- StatCard Component ---
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  colorPreset?: 'warning' | 'brand' | 'success' | 'danger' | 'neutral'; // Using semantic presets
  isWarning?: boolean; // Renamed from 'warning' to avoid conflict with colorPreset
}

function StatCard({ icon: Icon, label, value, colorPreset = 'neutral', isWarning }: StatCardProps) {
  // Using explicit Tailwind classes based on semantic color presets
  const colorStyles = {
    warning: {
      gradient: 'from-warning-500 to-warning-600',
      text: 'text-white',
      ring: 'ring-warning-200',
    },
    brand: {
      gradient: 'from-brand-500 to-brand-700',
      text: 'text-white',
      ring: 'ring-brand-200',
    },
    success: {
      gradient: 'from-success-500 to-success-600',
      text: 'text-white',
      ring: 'ring-success-200',
    },
    danger: {
      gradient: 'from-danger-500 to-danger-600',
      text: 'text-white',
      ring: 'ring-danger-200',
    },
    neutral: {
      gradient: 'bg-neutral-100', // For neutral, it's a solid background
      text: 'text-neutral-600',
      ring: 'ring-neutral-200',
    },
  };

  const currentStyles = colorStyles[colorPreset];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'dashtail-card p-4 flex items-center gap-3', // Assumed 'dashtail-card' for consistency
        isWarning && value > 0 && `ring-2 ${colorStyles.danger.ring}` // Apply danger ring for warning
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          colorPreset !== 'neutral' ? `bg-gradient-to-br ${currentStyles.gradient}` : currentStyles.gradient
        )}
      >
        <Icon className={cn('w-5 h-5', colorPreset !== 'neutral' ? currentStyles.text : 'text-neutral-600')} />
      </div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
      </div>
    </motion.div>
  );
}

// --- Main PassportKanban Component ---
export default function PassportKanban({
  initialItems,
  columnsConfig = DEFAULT_COLUMNS_CONFIG, // Use default if not provided
  onItemsChange,
  onStatusChange,
  onReorder,
}: PassportKanbanProps) {
  // Internal state for items, initialized from props
  // Addressing [designer] [設計] 狀態管理直接使用 useState by making data source external
  const [items, setItems] = useState<PassportItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync internal state if initialItems prop changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null); // Always clear activeId after drag ends

    // [architect] [架構] 缺少對外部依賴 (如 @dnd-kit) 的錯誤邊界處理 - Defensive checks
    if (!active || !over) {
      console.warn('Drag end event received without active or over element.');
      return;
    }

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) {
      console.error(`Dragged item with ID ${active.id} not found.`);
      return;
    }

    const overContainerId = over.id as string;
    // Check if the over target is one of our column IDs
    const isOverColumn = columnsConfig.some(col => col.id === overContainerId);

    if (isOverColumn) {
      // Logic for changing status (moving between columns)
      const newStatus = overContainerId as PassportItem['status'];
      if (activeItem.status === newStatus) {
        // If dropped into the same column, it's either no change or a reorder within the column.
        // We handle reorder separately in the `else` block if `over.id` is not a column ID.
        // If `over.id` *is* a column ID, and the status hasn't changed, it means the item
        // was dropped on the column header/background, and no action is needed.
        return;
      }

      const updatedItems = items.map((item) =>
        item.id === activeItem.id
          ? {
              ...item,
              status: newStatus,
              // Update submittedAt based on new status
              submittedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : (newStatus === 'pending' ? undefined : item.submittedAt),
            }
          : item
      );
      setItems(updatedItems);
      // Notify parent about status change
      onStatusChange?.(activeItem.id, newStatus, newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined);
      onItemsChange?.(updatedItems); // Also notify about overall item change
    } else {
      // Logic for reordering within the same column
      const activeIndex = items.findIndex((item) => item.id === active.id);
      const overIndex = items.findIndex((item) => item.id === over.id);

      // Check if active or over item is not found, or if they are the same
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
        return;
      }

      const newItems = arrayMove(items, activeIndex, overIndex);
      setItems(newItems);
      // Notify parent about reorder
      onReorder?.(activeItem.status, newItems.filter(i => i.status === activeItem.status).map(i => i.id));
      onItemsChange?.(newItems); // Also notify about overall item change
    }
  }, [items, columnsConfig, onItemsChange, onStatusChange, onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Memoize filtered items for performance
  const getFilteredItems = useCallback((status: PassportItem['status']) => {
    const filtered = items.filter((item) => item.status === status);
    if (!search) return filtered;
    return filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.tripName.toLowerCase().includes(search.toLowerCase()) ||
        item.passportNo.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Memoize stats calculation
  const stats = useMemo(() => {
    const isExpiringSoon = (expiry: string) => {
      const expiryDate = new Date(expiry);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return expiryDate < sixMonthsFromNow;
    };

    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      reviewing: items.filter((item) => item.status === 'reviewing').length,
      completed: items.filter((item) => item.status === 'completed').length,
      expiringSoon: items.filter(isExpiringSoon).length,
    };
  }, [items]);

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  // Accessibility announcements for Dnd-kit
  const liveAnnouncements: Announcements = useMemo(() => ({
    onDragStart: ({ active }) => {
      const item = items.find((i) => i.id === active.id);
      if (item) return `Dragging item ${item.name}.`;
      return 'Dragging item.';
    },
    onDragOver: ({ active, over }) => {
      const item = items.find((i) => i.id === active.id);
      const overContainer = columnsConfig.find(col => col.id === over?.id);
      if (item && overContainer) return `Item ${item.name} is over column ${overContainer.title}.`;
      if (item) return `Item ${item.name} is over droppable area.`;
      return 'Dragging over droppable area.';
    },
    onDragEnd: ({ active, over }) => {
      const item = items.find((i) => i.id === active.id);
      const overContainer = columnsConfig.find(col => col.id === over?.id);
      if (item && overContainer) return `Item ${item.name} dropped into column ${overContainer.title}.`;
      if (item) return `Item ${item.name} dropped.`;
      return 'Item dropped.';
    },
    onDragCancel: () => 'Drag cancelled.',
  }), [items, columnsConfig]);


  return (
    // [designer] [設計] 結構: 如果是 Widget，確保外層有標準 Card 結構
    // Assumed 'dashtail-card' is a predefined class for a standard Dashtail UI card structure
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="dashtail-card p-6 lg:p-8 max-w-full mx-auto space-y-6" // Using dashtail-card for outer structure
      // Removed min-h-screen as it's not typical for a widget's inner content
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-secondary bg-neutral-100 px-2 py-1 rounded-full">
              Passport Kanban
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary">團員護照管理</h2>
          <p className="text-text-secondary mt-1">拖曳卡片更新護照繳交狀態</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"> {/* Added responsiveness */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋姓名或團名..."
              className="input-modern pl-10 pr-4 w-full sm:w-64" // Added w-full for responsiveness
              aria-label="搜尋護照資料"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-pill btn-pill-primary gap-2 w-full sm:w-auto" // Added w-full for responsiveness
            aria-label="新增團員"
          >
            <Plus className="w-4 h-4" />
            新增團員
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      {/* Addressing [designer] [設計] 元件缺少響應式設計處理 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={FileText} label="總團員數" value={stats.total} colorPreset="neutral" />
        <StatCard icon={Inbox} label="未繳交" value={stats.pending} colorPreset="warning" />
        <StatCard icon={Eye} label="審核中" value={stats.reviewing} colorPreset="brand" />
        <StatCard icon={CheckCheck} label="已完成" value={stats.completed} colorPreset="success" />
        <StatCard icon={AlertTriangle} label="即將到期" value={stats.expiringSoon} colorPreset="danger" isWarning />
      </motion.div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={liveAnnouncements} // Added accessibility for screen readers
      >
        {/* Addressing [designer] [設計] 元件缺少響應式設計處理 */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {columnsConfig.map((column) => {
            const ColumnIcon = column.icon;
            const filteredItems = getFilteredItems(column.id);
            const itemIds = filteredItems.map((item) => item.id);

            return (
              <SortableContext key={column.id} items={itemIds} strategy={verticalListSortingStrategy}>
                <div
                  className="dashtail-card p-4 min-h-[400px] flex flex-col" // Using dashtail-card for column structure
                  aria-label={`${column.title} 護照列表`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center',
                          column.gradientFrom,
                          column.gradientTo
                        )}
                      >
                        <ColumnIcon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <h3 className="font-bold text-text-primary">{column.title}</h3>
                    </div>
                    <span className={cn('px-3 py-1.5 rounded-lg text-sm font-bold', column.bgColor, column.textColor)}>
                      {filteredItems.length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  {/* The id here is important for DndContext to recognize the column as a droppable container */}
                  <div
                    id={column.id}
                    className="flex-1 space-y-3 rounded-lg p-2 transition-colors border border-dashed border-transparent hover:border-neutral-200 focus-within:border-brand-300 min-h-[120px]" // Min-height for empty columns to drop items
                    aria-label={`${column.title} 拖曳區，目前有 ${filteredItems.length} 個項目`}
                  >
                    {filteredItems.map((item) => (
                      <SortablePassportCard key={item.id} item={item} />
                    ))}

                    {filteredItems.length === 0 && (
                      <div className="text-center py-6 sm:py-12"> {/* Adjusted vertical padding for responsiveness */}
                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 text-neutral-300" />
                        </div>
                        <p className="text-text-secondary text-sm">{search ? '沒有符合的結果' : '目前沒有項目'}</p>
                        <p className="text-text-tertiary text-sm mt-1">拖曳卡片到這裡</p>
                      </div>
                    )}
                  </div>
                </div>
              </SortableContext>
            );
          })}
        </motion.div>

        {/* Drag Overlay */}
        <DragOverlay>{activeItem ? <PassportCard item={activeItem} isDragging /> : null}</DragOverlay>
      </DndContext>
    </motion.div>
  );
}