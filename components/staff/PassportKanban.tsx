import React, { useState } from 'react';
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
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText, User, Clock, CheckCircle, AlertTriangle, Search,
  Calendar, MoreHorizontal, RefreshCw, Plus, Phone, Mail,
  Inbox, Eye, CheckCheck
} from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface PassportItem {
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

// 8 筆假資料 (User A, User B, ...)
const INITIAL_ITEMS: PassportItem[] = [
  { id: '1', name: 'User A', passportNo: 'PA1234567', expiry: '2028-05-15', tripName: 'Tokyo 5D', phone: '0912-111-111', email: 'usera@email.com', status: 'pending' },
  { id: '2', name: 'User B', passportNo: 'PB2345678', expiry: '2026-08-20', tripName: 'Tokyo 5D', phone: '0912-222-222', email: 'userb@email.com', status: 'pending' },
  { id: '3', name: 'User C', passportNo: 'PC3456789', expiry: '2025-06-10', tripName: 'Hokkaido', phone: '0912-333-333', email: 'userc@email.com', status: 'pending' },
  { id: '4', name: 'User D', passportNo: 'PD4567890', expiry: '2027-12-01', tripName: 'Seoul Food', phone: '0912-444-444', email: 'userd@email.com', status: 'reviewing', submittedAt: '2025-01-10' },
  { id: '5', name: 'User E', passportNo: 'PE5678901', expiry: '2029-01-30', tripName: 'Tokyo 5D', phone: '0912-555-555', email: 'usere@email.com', status: 'reviewing', submittedAt: '2025-01-09' },
  { id: '6', name: 'User F', passportNo: 'PF6789012', expiry: '2026-03-15', tripName: 'Hokkaido', phone: '0912-666-666', email: 'userf@email.com', status: 'reviewing', submittedAt: '2025-01-08' },
  { id: '7', name: 'User G', passportNo: 'PG7890123', expiry: '2028-07-22', tripName: 'Okinawa', phone: '0912-777-777', email: 'userg@email.com', status: 'completed', submittedAt: '2025-01-05' },
  { id: '8', name: 'User H', passportNo: 'PH8901234', expiry: '2027-11-05', tripName: 'Bangkok 5D', phone: '0912-888-888', email: 'userh@email.com', status: 'completed', submittedAt: '2025-01-03' },
];

const COLUMNS_CONFIG = [
  {
    id: 'pending',
    title: '未繳交',
    icon: Inbox,
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  {
    id: 'reviewing',
    title: '審核中',
    icon: Eye,
    gradient: 'from-brand-500 to-brand-700',
    bg: 'bg-brand-50',
    text: 'text-brand-700',
  },
  {
    id: 'completed',
    title: '已完成',
    icon: CheckCheck,
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

interface PassportCardProps {
  item: PassportItem;
  isDragging?: boolean;
}

function PassportCard({ item, isDragging }: PassportCardProps) {
  const isExpiringSoon = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiryDate < sixMonthsFromNow;
  };

  return (
    <div
      className={cn(
        'bg-white p-4 rounded-xl border border-slate-100 group transition-all',
        isDragging && 'shadow-2xl rotate-2 scale-105 border-brand-300 opacity-50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-400 font-mono">{item.passportNo}</p>
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
          <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
            {item.tripName}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>效期 {item.expiry}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" />
            <span>{item.phone}</span>
          </div>
        </div>

        {item.submittedAt && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle className="w-3 h-3" />
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
  );
}

function SortablePassportCard({ item }: { item: PassportItem }) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <PassportCard item={item} isDragging={isDragging} />
    </div>
  );
}

export default function PassportKanban() {
  const [items, setItems] = useState<PassportItem[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeItem = items.find((item) => item.id === active.id);
    const overContainer = over.id as string;

    if (!activeItem) {
      setActiveId(null);
      return;
    }

    // Check if dropped over a column
    const isOverColumn = ['pending', 'reviewing', 'completed'].includes(overContainer);

    if (isOverColumn) {
      // Update status
      const newStatus = overContainer as 'pending' | 'reviewing' | 'completed';
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === activeItem.id
            ? {
                ...item,
                status: newStatus,
                submittedAt: newStatus !== 'pending' ? new Date().toISOString().split('T')[0] : undefined,
              }
            : item
        )
      );
    } else {
      // Reorder within the same column
      const activeIndex = items.findIndex((item) => item.id === active.id);
      const overIndex = items.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex) {
        setItems((prevItems) => arrayMove(prevItems, activeIndex, overIndex));
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getFilteredItems = (status: 'pending' | 'reviewing' | 'completed') => {
    const filtered = items.filter((item) => item.status === status);
    if (!search) return filtered;
    return filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.tripName.toLowerCase().includes(search.toLowerCase()) ||
        item.passportNo.toLowerCase().includes(search.toLowerCase())
    );
  };

  const stats = {
    total: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    reviewing: items.filter((item) => item.status === 'reviewing').length,
    completed: items.filter((item) => item.status === 'completed').length,
    expiringSoon: items.filter((item) => {
      const expiryDate = new Date(item.expiry);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return expiryDate < sixMonthsFromNow;
    }).length,
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 max-w-full mx-auto space-y-6 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Passport Kanban
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">團員護照管理</h2>
          <p className="text-slate-500 mt-1">拖曳卡片更新護照繳交狀態</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋姓名或團名..."
              className="input-modern pl-10 pr-4 w-64"
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
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={FileText} label="總團員數" value={stats.total} />
        <StatCard icon={Inbox} label="未繳交" value={stats.pending} color="amber" />
        <StatCard icon={Eye} label="審核中" value={stats.reviewing} color="blue" />
        <StatCard icon={CheckCheck} label="已完成" value={stats.completed} color="emerald" />
        <StatCard icon={AlertTriangle} label="即將到期" value={stats.expiringSoon} color="red" warning />
      </motion.div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS_CONFIG.map((column) => {
            const ColumnIcon = column.icon;
            const filteredItems = getFilteredItems(column.id as any);
            const itemIds = filteredItems.map((item) => item.id);

            return (
              <SortableContext key={column.id} items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="glass-card p-4 min-h-[500px] flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center',
                          column.gradient
                        )}
                      >
                        <ColumnIcon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900">{column.title}</h3>
                    </div>
                    <span className={cn('px-3 py-1.5 rounded-lg text-sm font-bold', column.bg, column.text)}>
                      {filteredItems.length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  <div
                    id={column.id}
                    className="flex-1 space-y-3 rounded-xl p-2 transition-colors min-h-[400px]"
                  >
                    {filteredItems.map((item) => (
                      <SortablePassportCard key={item.id} item={item} />
                    ))}

                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-sm">{search ? '沒有符合的結果' : '目前沒有項目'}</p>
                        <p className="text-slate-300 text-xs mt-1">拖曳卡片到這裡</p>
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

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: 'amber' | 'blue' | 'emerald' | 'red';
  warning?: boolean;
}

function StatCard({ icon: Icon, label, value, color, warning }: StatCardProps) {
  const colorStyles = {
    amber: 'from-amber-500 to-orange-500',
    blue: 'from-brand-500 to-brand-700',
    emerald: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-rose-500',
  };

  return (
    <motion.div whileHover={{ y: -2 }} className={cn('glass-card p-4', warning && value > 0 && 'ring-2 ring-red-200')}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            color ? `bg-gradient-to-br ${colorStyles[color]}` : 'bg-slate-100'
          )}
        >
          <Icon className={cn('w-5 h-5', color ? 'text-white' : 'text-slate-600')} />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
