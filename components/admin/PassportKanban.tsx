import React, { useState } from 'react';
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
}

interface ColumnData {
  id: string;
  title: string;
  icon: React.ElementType;
  gradient: string;
  bg: string;
  text: string;
  items: PassportItem[];
}

const INITIAL_DATA: Record<string, PassportItem[]> = {
  pending: [
    { id: '1', name: '王大明', passportNo: '3XXXXXXX1', expiry: '2028-05-15', tripName: '東京五日遊', phone: '0912-345-678', email: 'wang@email.com' },
    { id: '2', name: '李小華', passportNo: '3XXXXXXX2', expiry: '2026-08-20', tripName: '東京五日遊', phone: '0923-456-789', email: 'lee@email.com' },
    { id: '3', name: '張美玲', passportNo: '3XXXXXXX3', expiry: '2025-06-10', tripName: '北海道雪祭', phone: '0934-567-890', email: 'chang@email.com' },
    { id: '4', name: '陳志明', passportNo: '3XXXXXXX4', expiry: '2027-12-01', tripName: '首爾美食團', phone: '0945-678-901', email: 'chen@email.com' },
  ],
  reviewing: [
    { id: '5', name: '林雅婷', passportNo: '3XXXXXXX5', expiry: '2029-01-30', tripName: '東京五日遊', phone: '0956-789-012', email: 'lin@email.com', submittedAt: '2025-01-10' },
    { id: '6', name: '黃建宏', passportNo: '3XXXXXXX6', expiry: '2026-03-15', tripName: '北海道雪祭', phone: '0967-890-123', email: 'huang@email.com', submittedAt: '2025-01-09' },
    { id: '7', name: '吳淑芬', passportNo: '3XXXXXXX7', expiry: '2028-07-22', tripName: '沖繩度假', phone: '0978-901-234', email: 'wu@email.com', submittedAt: '2025-01-08' },
  ],
  completed: [
    { id: '8', name: '劉家豪', passportNo: '3XXXXXXX8', expiry: '2027-11-05', tripName: '東京五日遊', phone: '0989-012-345', email: 'liu@email.com', submittedAt: '2025-01-05' },
    { id: '9', name: '蔡怡君', passportNo: '3XXXXXXX9', expiry: '2029-04-18', tripName: '曼谷五日遊', phone: '0910-123-456', email: 'tsai@email.com', submittedAt: '2025-01-03' },
    { id: '10', name: '許志偉', passportNo: '3XXXXXXX0', expiry: '2026-09-30', tripName: '首爾美食團', phone: '0921-234-567', email: 'hsu@email.com', submittedAt: '2025-01-02' },
  ],
};

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
    gradient: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    id: 'completed',
    title: '已辦理',
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

export default function PassportKanban() {
  const [columns, setColumns] = useState<Record<string, PassportItem[]>>(INITIAL_DATA);
  const [search, setSearch] = useState('');

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

    const sourceColumn = [...columns[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId
      ? sourceColumn
      : [...columns[destination.droppableId]];

    const [movedItem] = sourceColumn.splice(source.index, 1);

    if (destination.droppableId !== source.droppableId) {
      movedItem.submittedAt = destination.droppableId !== 'pending' ? new Date().toISOString().split('T')[0] : undefined;
    }

    destColumn.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });
  };

  const getFilteredItems = (items: PassportItem[]) => {
    if (!search) return items;
    return items.filter(item =>
      item.name.includes(search) ||
      item.tripName.includes(search) ||
      item.passportNo.includes(search)
    );
  };

  const stats = {
    total: Object.values(columns).flat().length,
    pending: columns.pending.length,
    reviewing: columns.reviewing.length,
    completed: columns.completed.length,
    expiringSoon: Object.values(columns).flat().filter(p => isExpiringSoon(p.expiry)).length,
  };

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
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
        <StatCard icon={CheckCheck} label="已辦理" value={stats.completed} color="emerald" />
        <StatCard icon={AlertTriangle} label="即將到期" value={stats.expiringSoon} color="red" warning />
      </motion.div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS_CONFIG.map((column) => {
            const ColumnIcon = column.icon;
            const filteredItems = getFilteredItems(columns[column.id]);

            return (
              <div key={column.id} className="glass-card p-4 min-h-[500px] flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center',
                      column.gradient
                    )}>
                      <ColumnIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900">{column.title}</h3>
                  </div>
                  <span className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-bold',
                    column.bg, column.text
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
                        'flex-1 space-y-3 rounded-xl p-2 transition-colors min-h-[400px]',
                        snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-transparent'
                      )}
                    >
                      {filteredItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'bg-white p-4 rounded-xl border border-slate-100 cursor-grab active:cursor-grabbing group transition-all',
                                snapshot.isDragging && 'shadow-2xl rotate-2 scale-105 border-brand-300'
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="text-slate-400 text-sm">
                            {search ? '沒有符合的結果' : '目前沒有項目'}
                          </p>
                          <p className="text-slate-300 text-xs mt-1">
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
    blue: 'from-blue-500 to-indigo-500',
    emerald: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-rose-500',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'glass-card p-4',
        warning && value > 0 && 'ring-2 ring-red-200'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          color ? `bg-gradient-to-br ${colorStyles[color]}` : 'bg-slate-100'
        )}>
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
