import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  FileText, User, Clock, CheckCircle, AlertTriangle, Search,
  Calendar, MoreHorizontal, RefreshCw, Plus, Phone, Mail,
  Inbox, Eye, CheckCheck, GripVertical // Added GripVertical for drag handle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

// --- Interfaces and Theme Configurations ---

// [architect] [架構] 缺少 Config Props 介面定義
export interface PassportItem {
  id: string;
  name: string;
  passportNo: string;
  expiry: string;
  tripName: string;
  phone: string;
  email: string;
  submittedAt?: string;
}

// [architect] [架構] 樣式配置與業務邏輯混雜
// [designer] 1. [設計] 顏色使用硬編碼
// Defines the theme keys used for columns and stat cards.
type ThemeKey = 'pending' | 'reviewing' | 'completed' | 'total' | 'expiringSoon';

export interface ColumnTheme {
  gradient: string;
  bg: string;
  text: string;
  iconColor?: string; // For placeholder icon color
}

export const COLUMN_THEMES: Record<Exclude<ThemeKey, 'total' | 'expiringSoon'>, ColumnTheme> = {
  pending: {
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconColor: 'text-amber-300', // For empty state icon
  },
  reviewing: {
    gradient: 'from-blue-500 to-blue-700', // Using blue tokens as a common 'brand' alternative
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconColor: 'text-blue-300',
  },
  completed: {
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    iconColor: 'text-emerald-300',
  },
};

export interface StatCardTheme {
  gradient?: string;
  bg?: string;
  iconColor?: string;
}

export const STAT_CARD_THEMES: Record<ThemeKey, StatCardTheme> = {
  total: {
    bg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  pending: {
    gradient: 'from-amber-500 to-orange-500',
    iconColor: 'text-white',
  },
  reviewing: {
    gradient: 'from-blue-500 to-blue-700',
    iconColor: 'text-white',
  },
  completed: {
    gradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-white',
  },
  expiringSoon: {
    gradient: 'from-red-500 to-rose-500',
    iconColor: 'text-white',
  },
};

export interface KanbanColumnConfig {
  id: string; // Corresponds to key in initialItems
  title: string;
  icon: React.ElementType;
  themeKey: Exclude<ThemeKey, 'total' | 'expiringSoon'>; // Semantic key to pick styles from COLUMN_THEMES
}

// [architect] [架構] 缺少 Config Props 介面定義
// [architect] [架構] 元件直接使用硬編碼的 INITIAL_DATA 和 COLUMNS_CONFIG，應改為透過 Props 傳入
export interface PassportKanbanProps {
  initialItems: Record<string, PassportItem[]>; // Initial data for columns, from API or parent
  columnConfigs: KanbanColumnConfig[]; // Configuration for the columns themselves, from parent
  onItemsUpdate?: (updatedItems: Record<string, PassportItem[]>) => void; // Callback for when items change
  searchPlaceholder?: string; // Allow custom search placeholder
  kanbanTitle?: string;
  kanbanDescription?: string;
  widgetId?: string; // For Kintone widget uniqueness or other context
}

// --- Helper Components ---

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  themeKey: ThemeKey; // Use themeKey for styling
  warning?: boolean;
}

function StatCard({ icon: Icon, label, value, themeKey, warning }: StatCardProps) {
  const theme = STAT_CARD_THEMES[themeKey];
  const isGradient = !!theme.gradient;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'glass-card p-4 flex items-center gap-3', // Added flex for consistent layout
        warning && value > 0 && 'ring-2 ring-red-200'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        isGradient ? `bg-gradient-to-br ${theme.gradient}` : theme.bg
      )}>
        <Icon className={cn('w-5 h-5', theme.iconColor)} />
      </div>
      <div>
        <p className="text-sm text-slate-500 whitespace-nowrap">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </motion.div>
  );
}

// --- Main Component ---

export default function PassportKanban({
  initialItems,
  columnConfigs,
  onItemsUpdate,
  searchPlaceholder = '搜尋姓名、團名或護照號碼...',
  kanbanTitle = '團員護照管理',
  kanbanDescription = '拖曳卡片更新護照繳交狀態',
  widgetId, // Not directly used in UI, but good for context
}: PassportKanbanProps) {
  const [columns, setColumns] = useState<Record<string, PassportItem[]>>(initialItems);
  const [search, setSearch] = useState('');

  // Sync initial data from props
  useEffect(() => {
    setColumns(initialItems);
  }, [initialItems]);

  const isExpiringSoon = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiryDate < sixMonthsFromNow;
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumnItems = [...columns[source.droppableId]];
    let destColumnItems = source.droppableId === destination.droppableId
      ? sourceColumnItems
      : [...columns[destination.droppableId]];

    const [movedItem] = sourceColumnItems.splice(source.index, 1);

    if (destination.droppableId !== source.droppableId) {
      // Update submittedAt based on destination column
      movedItem.submittedAt = destination.droppableId !== 'pending' ? new Date().toISOString().split('T')[0] : undefined;
    }

    destColumnItems.splice(destination.index, 0, movedItem);

    const newColumns = {
      ...columns,
      [source.droppableId]: sourceColumnItems,
      [destination.droppableId]: destColumnItems,
    };

    setColumns(newColumns);
    onItemsUpdate?.(newColumns); // Notify parent of changes
  };

  const getFilteredItems = (items: PassportItem[]) => {
    if (!search) return items;
    const lowerCaseSearch = search.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(lowerCaseSearch) ||
      item.tripName.toLowerCase().includes(lowerCaseSearch) ||
      item.passportNo.toLowerCase().includes(lowerCaseSearch)
    );
  };

  const stats = {
    total: Object.values(columns).flat().length,
    pending: columns.pending?.length || 0, // Handle cases where column might be missing
    reviewing: columns.reviewing?.length || 0,
    completed: columns.completed?.length || 0,
    expiringSoon: Object.values(columns).flat().filter(p => isExpiringSoon(p.expiry)).length,
  };

  // [designer] 4. [設計] 元件結構缺少響應式設計考量 (Added glass-card wrapper for Kintone widget, refined responsive classes)
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card p-4 md:p-6 lg:p-8 max-w-full mx-auto space-y-6" // Added glass-card as per Kintone widget requirement, removed min-h-screen
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Passport Kanban
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">{kanbanTitle}</h2>
          <p className="text-slate-500 mt-1">{kanbanDescription}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end"> {/* Added flex-wrap for responsiveness */}
          <div className="relative w-full sm:w-auto"> {/* Added w-full sm:w-auto for responsive search */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-modern pl-10 pr-4 w-full sm:w-64" // Responsive width for search input
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-pill btn-pill-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            新增團員
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"> {/* Increased responsiveness for stats */}
        <StatCard icon={FileText} label="總團員數" value={stats.total} themeKey="total" />
        <StatCard icon={Inbox} label="未繳交" value={stats.pending} themeKey="pending" />
        <StatCard icon={Eye} label="審核中" value={stats.reviewing} themeKey="reviewing" />
        <StatCard icon={CheckCheck} label="已辦理" value={stats.completed} themeKey="completed" />
        <StatCard icon={AlertTriangle} label="即將到期" value={stats.expiringSoon} themeKey="expiringSoon" warning />
      </motion.div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive grid */}
          {columnConfigs.map((column) => { // Use props.columnConfigs
            const ColumnIcon = column.icon;
            const theme = COLUMN_THEMES[column.themeKey]; // Get theme based on key
            const filteredItems = getFilteredItems(columns[column.id] || []); // Handle potential undefined column

            return (
              <div key={column.id} className="glass-card p-4 flex flex-col"> {/* Removed min-h-[500px] as it's often not good for dynamic content */}
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center',
                      theme.gradient
                    )}>
                      <ColumnIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900">{column.title}</h3>
                  </div>
                  <span className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-bold',
                    theme.bg, theme.text
                  )}>
                    {filteredItems.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 space-y-3 rounded-lg p-2 transition-colors min-h-[100px]', // Reduced min-h to allow for smaller columns
                        snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-transparent'
                      )}
                    >
                      {filteredItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              // dragHandleProps will be applied to a specific inner element
                              className={cn(
                                'bg-white p-4 rounded-lg border border-slate-100 relative group transition-all', // Added relative for positioning drag-handle
                                snapshot.isDragging && 'shadow-2xl rotate-2 scale-105 border-blue-300 cursor-grabbing' // Using blue for consistency
                              )}
                            >
                              {/* [designer] 2. [設計] 缺少 drag-handle 結構 */}
                              {/* Specific drag handle area */}
                              <div
                                {...provided.dragHandleProps}
                                className="drag-handle absolute top-0 right-0 p-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10"
                                aria-label="Drag to reorder or move item"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold">
                                    {item.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                    <p className="text-sm text-slate-400 font-mono">{item.passportNo}</p>
                                  </div>
                                </div>
                                {isExpiringSoon(item.expiry) && (
                                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center" title="護照即將到期">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                                    {item.tripName}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>效期 {item.expiry}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.phone}</span>
                                  </div>
                                </div>

                                {item.submittedAt && (
                                  <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>繳交於 {item.submittedAt}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-100">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                          <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3',
                            theme.bg
                          )}>
                            <FileText className={cn('w-6 h-6', theme.iconColor)} />
                          </div>
                          <p className="text-slate-400 text-sm">
                            {search ? '沒有符合的結果' : '目前沒有項目'}
                          </p>
                          <p className="text-slate-300 text-sm mt-1">
                            拖曳卡片到這裡
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </motion.div>
      </DragDropContext>
    </motion.div>
  );
}

// Framer Motion variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};