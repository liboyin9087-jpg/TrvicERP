import React, { useState, useCallback, useMemo } from 'react';
import { Search, Plus, Minus, Save, Clock, MapPin, GripVertical, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  Active,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';

// #region Interfaces and Types

interface Attraction {
  id: string;
  name: string;
  image_url: string;
  type: string;
  duration_minutes: number;
}

interface DayItem {
  instanceId: string;
  attraction: Attraction;
  time: string; // Could be improved to Date or number for better sorting/calculation
}

/**
 * @interface VisualPlannerConfig
 * Defines the configuration props for the VisualPlanner component.
 * This ensures the component is independent and configurable via props.
 */
export interface VisualPlannerConfig {
  /**
   * The list of available attractions that can be added to the itinerary.
   * This replaces the internal DEFAULT_ATTRACTIONS.
   */
  attractions: Attraction[];
  /**
   * Optional initial number of days for the planner. Defaults to 5.
   */
  initialDayCount?: number;
  /**
   * Callback function triggered when the user saves the itinerary.
   * Provides the current itinerary state and day count.
   */
  onSave?: (itinerary: Record<string, DayItem[]>, dayCount: number) => void;
  /**
   * Optional initial itinerary state to load.
   */
  initialItinerary?: Record<string, DayItem[]>;
}

/**
 * @interface VisualPlannerProps
 * Extends VisualPlannerConfig with any specific props needed directly by the VisualPlanner component itself.
 * For now, it's the same as VisualPlannerConfig.
 */
export interface VisualPlannerProps extends VisualPlannerConfig {}

// #endregion

// #region Sub-components

/**
 * @component VisualPlannerHeader
 * Handles the header section with title, day count controls, and save button.
 */
interface VisualPlannerHeaderProps {
  dayCount: number;
  onDayCountChange: (newCount: number) => void;
  onSave: () => void;
}

const VisualPlannerHeader: React.FC<VisualPlannerHeaderProps> = React.memo(({ dayCount, onDayCountChange, onSave }) => (
  <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between flex-wrap gap-2">
    <div>
      <h2 className="text-lg md:text-xl font-bold text-gray-900">行程規劃器</h2>
      <p className="text-xs md:text-sm text-gray-500">拖曳景點至每日行程</p>
    </div>
    <div className="flex items-center gap-2 md:gap-4">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onDayCountChange(Math.max(1, dayCount - 1))}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-700 hover:text-gray-900"
          aria-label="減少天數"
        >
          <Minus className="w-3 h-3 md:w-4 md:h-4" />
        </button>
        <span className="px-3 py-1 font-semibold text-sm md:text-base">{dayCount} 天</span>
        <button
          onClick={() => onDayCountChange(Math.min(14, dayCount + 1))}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-gray-700 hover:text-gray-900"
          aria-label="增加天數"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
        </button>
      </div>
      <button
        onClick={onSave}
        className="bg-primary-900 text-white px-4 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-sm md:text-base flex items-center gap-2 hover:bg-primary-800 transition-colors"
      >
        <Save className="w-3 h-3 md:w-4 md:h-4" /> 儲存
      </button>
    </div>
  </header>
));

/**
 * @component AttractionCard
 * Displays a single draggable attraction in the sidebar.
 */
interface AttractionCardProps {
  attraction: Attraction;
  dayCount: number;
  onAddToDay: (dayIndex: number, attraction: Attraction) => void;
}

const AttractionCard: React.FC<AttractionCardProps> = React.memo(({ attraction, dayCount, onAddToDay }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: `draggable-attraction-${attraction.id}`,
    data: { type: 'Attraction', attraction: attraction },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border border-gray-100 rounded-lg p-3 transition-all cursor-grab group ${isDragging ? 'shadow-lg ring-2 ring-primary-500' : 'hover:shadow-md'}`}
    >
      <div className="flex gap-3 items-center">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {attraction.image_url && <img src={attraction.image_url} alt={attraction.name} className="w-full h-full object-cover" loading="lazy" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">{attraction.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs md:text-sm bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{attraction.type}</span>
            <span className="text-xs md:text-sm text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {attraction.duration_minutes}分鐘</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {Array.from({ length: Math.min(dayCount, 5) }).map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); onAddToDay(idx + 1, attraction); }}
            className="flex-1 py-1.5 bg-gray-100 hover:bg-primary-900 hover:text-white rounded-lg text-xs md:text-sm font-semibold transition-colors"
            title={`加入 Day ${idx + 1}`}
          >
            D{idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
});

/**
 * @component AttractionSidebar
 * Displays the search bar and the list of draggable attractions.
 */
interface AttractionSidebarProps {
  attractions: Attraction[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dayCount: number;
  onAttractionAddToDay: (dayIndex: number, attraction: Attraction) => void;
}

const AttractionSidebar: React.FC<AttractionSidebarProps> = React.memo(({
  attractions,
  searchTerm,
  onSearchTermChange,
  dayCount,
  onAttractionAddToDay,
}) => {
  const filteredAttractions = useMemo(() => {
    return (attractions || []).filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attractions, searchTerm]);

  return (
    <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 md:flex-shrink">
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="搜尋景點..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="搜尋景點"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAttractions.length > 0 ? (
          filteredAttractions.map((attraction) => (
            <AttractionCard
              key={attraction.id}
              attraction={attraction}
              dayCount={dayCount}
              onAddToDay={onAttractionAddToDay}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">找不到符合的景點。</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-brand-50 border-t border-brand-100 text-center">
        <p className="text-sm text-brand-700 font-semibold">💡 點擊 D1-D5 或拖曳景點至行程</p>
      </div>
    </aside>
  );
});

/**
 * @component ItineraryItemCard
 * Displays a single item within an itinerary day.
 * Includes drag handle for future sorting.
 */
interface ItineraryItemCardProps {
  item: DayItem;
  dayKey: string;
  onRemove: (dayKey: string, instanceId: string) => void;
  // dnd-kit properties for sortable context
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  setNodeRef?: ReturnType<typeof useSortable>['setNodeRef'];
  style?: React.CSSProperties;
  isDragging?: boolean;
}

const ItineraryItemCard: React.FC<ItineraryItemCardProps> = React.memo(({
  item,
  dayKey,
  onRemove,
  listeners,
  attributes,
  setNodeRef,
  style,
  isDragging,
}) => {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-3 group flex items-start gap-3 ${isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
    >
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        {item.attraction.image_url && <img src={item.attraction.image_url} alt={item.attraction.name} className="w-full h-full object-cover" loading="lazy" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.attraction.name}</h4>
          <div className="flex items-center gap-1">
            <button
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => onRemove(dayKey, item.instanceId)}
              aria-label="移除景點"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <button
              {...listeners}
              {...attributes}
              className="drag-handle p-1 text-gray-400 hover:text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition-all"
              aria-label="拖曳排序"
            >
              <GripVertical className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs md:text-sm bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{item.attraction.type}</span>
          <span className="text-xs md:text-sm text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {item.time}</span>
        </div>
      </div>
    </div>
  );
});


// Wrapper for ItineraryItemCard to integrate with SortableContext
interface SortableItineraryItemProps {
  item: DayItem;
  dayKey: string;
  onRemove: (dayKey: string, instanceId: string) => void;
}

const SortableItineraryItem: React.FC<SortableItineraryItemProps> = ({ item, dayKey, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.instanceId}`, data: { type: 'ItineraryItem', item: item, dayKey: dayKey } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <ItineraryItemCard
      item={item}
      dayKey={dayKey}
      onRemove={onRemove}
      setNodeRef={setNodeRef}
      style={style}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
    />
  );
};

/**
 * @component ItineraryDayColumn
 * Represents a single day in the itinerary, showing its items and acting as a drop target.
 */
interface ItineraryDayColumnProps {
  dayKey: string;
  dayNumber: number;
  items: DayItem[];
  onRemoveItem: (dayKey: string, instanceId: string) => void;
}

const ItineraryDayColumn: React.FC<ItineraryDayColumnProps> = React.memo(({
  dayKey,
  dayNumber,
  items,
  onRemoveItem,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-day-${dayNumber}`,
    data: { type: 'DayColumn', dayNumber: dayNumber, dayKey: dayKey },
  });

  const itemIds = useMemo(() => items.map(item => `item-${item.instanceId}`), [items]);

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden flex flex-col ${isOver ? 'ring-2 ring-primary-300 ring-offset-2' : ''}`}
    >
      <div className="bg-primary-900 text-white p-4">
        <h3 className="font-bold text-base md:text-lg">Day {dayNumber}</h3>
        <p className="text-sm text-primary-200">{items.length} 個景點</p>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {items.length > 0 ? (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItineraryItem key={item.instanceId} item={item} dayKey={dayKey} onRemove={onRemoveItem} />
            ))}
          </SortableContext>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg py-8 md:py-12">
            <Plus className="w-6 h-6 md:w-8 md:h-8 mb-2" />
            <p className="text-sm md:text-base">從左側加入景點或拖曳至此</p>
          </div>
        )}
      </div>
    </div>
  );
});

// #endregion

/**
 * @component VisualPlanner
 * Main component for the itinerary planner.
 * Manages global state and orchestrates sub-components.
 */
export default function VisualPlanner({
  attractions: initialAttractions = [],
  initialDayCount = 5,
  onSave,
  initialItinerary = {},
}: VisualPlannerProps) {
  const [dayCount, setDayCount] = useState(initialDayCount);
  const [searchTerm, setSearchTerm] = useState('');
  const [itinerary, setItinerary] = useState<Record<string, DayItem[]>>(() => {
    // Ensure all initial days are present in the itinerary object and initialize with provided data
    const initial = { ...initialItinerary };
    for (let i = 1; i <= initialDayCount; i++) {
      const dayKey = `day-${i}`;
      if (!initial[dayKey]) {
        initial[dayKey] = [];
      }
    }
    return initial;
  });

  const [activeDraggable, setActiveDraggable] = useState<Active | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: ({ current }) => current.rect })
  );

  const handleDayCountChange = useCallback((newCount: number) => {
    setDayCount(prevCount => {
      // Remove excess days from itinerary if dayCount decreases
      if (newCount < prevCount) {
        setItinerary(prevItinerary => {
          const newItinerary = { ...prevItinerary };
          for (let i = newCount + 1; i <= prevCount; i++) {
            delete newItinerary[`day-${i}`];
          }
          return newItinerary;
        });
      } else if (newCount > prevCount) {
        // Add new days if dayCount increases
        setItinerary(prevItinerary => {
          const newItinerary = { ...prevItinerary };
          for (let i = prevCount + 1; i <= newCount; i++) {
            const dayKey = `day-${i}`;
            if (!newItinerary[dayKey]) {
              newItinerary[dayKey] = [];
            }
          }
          return newItinerary;
        });
      }
      return newCount;
    });
  }, []);

  const addToDay = useCallback((dayIndex: number, attraction: Attraction) => {
    const dayKey = `day-${dayIndex}`;
    const newItem: DayItem = { instanceId: `${attraction.id}-${Date.now()}`, attraction, time: '09:00' }; // Default time, could be editable
    setItinerary(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), newItem],
    }));
  }, []);

  const removeFromDay = useCallback((dayKey: string, instanceId: string) => {
    setItinerary(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter(item => item.instanceId !== instanceId),
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(itinerary, dayCount);
    // Optionally show a confirmation message
  }, [itinerary, dayCount, onSave]);

  const onDragStart = useCallback((event: { active: Active }) => {
    setActiveDraggable(event.active);
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveDraggable(null);
      return;
    }

    // Scenario 1: Dragging an AttractionCard from sidebar to an ItineraryDayColumn
    if (active.data.current?.type === 'Attraction' && over.data.current?.type === 'DayColumn') {
      const attraction: Attraction = active.data.current.attraction;
      const dayNumber: number = over.data.current.dayNumber;
      addToDay(dayNumber, attraction);
    }

    // Scenario 2: Reordering an ItineraryItemCard within the same ItineraryDayColumn
    // Scenario 3: Moving an ItineraryItemCard from one ItineraryDayColumn to another
    if (active.data.current?.type === 'ItineraryItem') {
      const sourceDayKey: string = active.data.current.dayKey;
      const movedItem: DayItem = active.data.current.item;

      let targetDayKey: string | undefined;
      let newIndex: number | undefined;

      // Determine targetDayKey and newIndex based on where it's dropped
      if (over.data.current?.type === 'DayColumn') {
        // Dropped directly onto a day column
        targetDayKey = over.data.current.dayKey;
        newIndex = itinerary[targetDayKey]?.length || 0; // Add to end
      } else if (over.data.current?.type === 'ItineraryItem') {
        // Dropped onto another itinerary item
        targetDayKey = over.data.current.dayKey;
        const overItemId = (over.id as string).replace('item-', '');
        newIndex = itinerary[targetDayKey].findIndex(item => item.instanceId === overItemId);
        if (newIndex === -1) newIndex = itinerary[targetDayKey].length; // Fallback to end if item not found (shouldn't happen with correct IDs)
      }

      if (sourceDayKey && targetDayKey) {
        setItinerary(prev => {
          const newItinerary = { ...prev };
          const sourceItems = [...(newItinerary[sourceDayKey] || [])];
          const targetItems = [...(newItinerary[targetDayKey] || [])];

          const oldIndex = sourceItems.findIndex(item => item.instanceId === movedItem.instanceId);

          if (sourceDayKey === targetDayKey) {
            // Reorder within the same day
            if (oldIndex !== -1 && newIndex !== undefined) {
              newItinerary[sourceDayKey] = arrayMove(sourceItems, oldIndex, newIndex);
            }
          } else {
            // Move between different days
            if (oldIndex !== -1) {
              const [removed] = sourceItems.splice(oldIndex, 1);
              if (removed) {
                targetItems.splice(newIndex !== undefined ? newIndex : targetItems.length, 0, removed);
                newItinerary[sourceDayKey] = sourceItems;
                newItinerary[targetDayKey] = targetItems;
              }
            }
          }
          return newItinerary;
        });
      }
    }

    setActiveDraggable(null);
  }, [addToDay, itinerary]);

  // Create a portal for the DragOverlay to ensure it renders above everything else
  const dragOverlayPortal = activeDraggable ? (
    createPortal(
      <DragOverlay dropAnimation={{ duration: 0, easing: 'ease' }}>
        {activeDraggable.data.current?.type === 'Attraction' && (
          <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-lg ring-2 ring-primary-500 cursor-grabbing opacity-90 w-72">
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {activeDraggable.data.current.attraction.image_url && (
                  <img src={activeDraggable.data.current.attraction.image_url} alt={activeDraggable.data.current.attraction.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{activeDraggable.data.current.attraction.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{activeDraggable.data.current.attraction.type}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {activeDraggable.data.current.attraction.duration_minutes}分鐘</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeDraggable.data.current?.type === 'ItineraryItem' && (
          <div className="bg-gray-50 rounded-lg p-3 group flex items-start gap-3 shadow-lg ring-2 ring-primary-500 opacity-90 w-72">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {activeDraggable.data.current.item.attraction.image_url && (
                <img src={activeDraggable.data.current.item.attraction.image_url} alt={activeDraggable.data.current.item.attraction.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{activeDraggable.data.current.item.attraction.name}</h4>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{activeDraggable.data.current.item.attraction.type}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {activeDraggable.data.current.item.time}</span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>,
      document.body // Render overlay directly in body
    )
  ) : null;

  return (
    // Outer widget card structure with responsive padding and overflow handling
    <div className="w-full h-full p-4 md:p-6 bg-white shadow-md rounded-lg flex flex-col overflow-hidden animate-fade-in">
      <VisualPlannerHeader dayCount={dayCount} onDayCountChange={handleDayCountChange} onSave={handleSave} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden mt-4">
          <AttractionSidebar
            attractions={initialAttractions}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            dayCount={dayCount}
            onAttractionAddToDay={addToDay}
          />

          <main className="flex-1 overflow-x-auto p-4 md:p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 -mx-4 md:-ml-6 mt-4 md:mt-0 pt-4 md:pt-0">
            <div className="flex flex-col md:flex-row gap-4 h-full">
              {Array.from({ length: dayCount }).map((_, idx) => {
                const dayNumber = idx + 1;
                const dayKey = `day-${dayNumber}`;
                const dayItems = itinerary[dayKey] || [];
                return (
                  <ItineraryDayColumn
                    key={dayKey}
                    dayKey={dayKey}
                    dayNumber={dayNumber}
                    items={dayItems}
                    onRemoveItem={removeFromDay}
                  />
                );
              })}
            </div>
          </main>
        </div>
        {dragOverlayPortal}
      </DndContext>
    </div>
  );
}