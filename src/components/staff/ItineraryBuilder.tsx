import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MapPin,
  Clock,
  Star,
  Search,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  ChevronDown,
  Save,
  FolderOpen,
  X,
  Utensils,
  ShoppingBag,
  Building,
  Train,
  Camera,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Navigation,
  Leaf,
  Mountain,
  Waves,
  Palette,
  Wheat,
  Building2,
  History,
  Eye,
  GanttChartSquare, // Default icon for categories if specific not available
} from "lucide-react";

import { cn } from "@/lib/utils"; // Assuming this utility remains available

// --- Type Definitions (previously from useItineraryBuilderStore) ---
// These types are now defined locally for component self-containment and clarity.

export type SpotCategory =
  | "綠色永續景點"
  | "山林秘境"
  | "海岸離島"
  | "文化深度體驗"
  | "農村慢旅"
  | "都市邊緣秘境"
  | "美食"
  | "住宿"
  | "購物"
  | "交通"
  | "體驗"
  | "其他"; // Fallback category

export type SeasonType = "春" | "夏" | "秋" | "冬";
export type AudienceType =
  | "家庭"
  | "情侶"
  | "獨行旅客"
  | "朋友"
  | "商務"
  | "文青"
  | "銀髮族"
  | "學生";

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory[];
  county: string;
  duration: number; // in minutes
  description: string;
  image: string;
  price: number;
  tags: string[];
  season: SeasonType[];
  sustainability_index: string;
  target_audience: AudienceType[];
}

export interface ScheduledSpot extends Spot {
  instanceId: string; // Unique ID for this specific instance in the itinerary
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  title: string;
  spots: ScheduledSpot[];
}

export interface PlanVersion {
  version: number;
  created_at: string; // ISO string
  created_by: string;
  changes?: string; // e.g., "新增了第3天行程", "調整了第二天景點順序"
  plan_data: { // Data for this specific version
    name: string;
    destination: string;
    days: DayPlan[];
  };
}

export interface ItineraryPlan {
  id: string;
  name: string;
  destination: string;
  days: DayPlan[];
  current_version: number;
  versions: PlanVersion[];
}

// Category Configuration definition.
// 'color' must be a Tailwind CSS class string. 'icon' is a React component.
export interface CategoryConfigItem {
  label: string;
  color: string; // e.g., "bg-blue-500", must be a valid Tailwind class
  icon: React.ElementType; // Lucide icon component, e.g., Leaf, Mountain
}

export type CategoryConfigMap = {
  [key in SpotCategory]: CategoryConfigItem;
};

// Summary for saved plans list (lighter version of ItineraryPlan)
export interface ItineraryPlanSummary {
  id: string;
  name: string;
  destination: string;
  daysCount: number;
}

// SpotRecord type from RAGEngine, defined here for ItineraryBuilderProps
export interface SpotRecord {
  id: string;
  name: string;
  region: string;
  tags: string[];
  note?: string;
  image?: string; // Added image for conversion to Spot
}

// RAG Engine type definition, used for passing the instance as a prop
export interface RAGEngineInstance {
  getRecommendations: (
    options: { currentRegion?: string; excludeIds?: string[]; tags?: string[] },
    count: number,
  ) => SpotRecord[];
}


// ItineraryBuilderProps - Defines the contract for the parent component.
// All external data and state manipulation callbacks are passed via these props.
interface ItineraryBuilderProps {
  /**
   * The full list of all available spots to be displayed in the left panel.
   */
  allAvailableSpots: Spot[];
  /**
   * The currently active itinerary plan being edited. Null if no plan is active.
   */
  currentPlan: ItineraryPlan | null;
  /**
   * A summary list of all saved plans, used for the "Load Plan" functionality.
   */
  savedPlans: ItineraryPlanSummary[];
  /**
   * Configuration map for different spot categories, including their labels and Tailwind color classes.
   */
  categoryConfig: CategoryConfigMap;
  /**
   * An instance of the RAG engine for generating AI recommendations.
   */
  ragEngine: RAGEngineInstance;

  // --- Callbacks for interacting with parent state ---

  /**
   * Callback to create a new itinerary plan.
   * @param name The name of the new plan.
   * @param destination The destination of the new plan.
   * @param days The number of days for the new plan.
   */
  onCreateNewPlan: (name: string, destination: string, days: number) => void;
  /**
   * Callback to load an existing itinerary plan by its ID.
   * @param planId The ID of the plan to load.
   */
  onLoadPlan: (planId: string) => void;
  /**
   * Callback to save the current itinerary plan.
   * @param plan The full ItineraryPlan object to save.
   * @param changesNote Optional note describing the changes for version history.
   */
  onSavePlan: (plan: ItineraryPlan, changesNote?: string) => void;
  /**
   * Callback to load a specific version of the current plan.
   * @param plan The current ItineraryPlan (or its ID)
   * @param versionNumber The version number to load.
   */
  onLoadVersion: (plan: ItineraryPlan, versionNumber: number) => void;
  /**
   * Callback to clear the currently active itinerary plan.
   */
  onClearCurrentPlan: () => void;

  /**
   * Callback to add a new day to the current plan.
   * @param plan The current ItineraryPlan object.
   */
  onAddDay: (plan: ItineraryPlan) => void;
  /**
   * Callback to remove a day from the current plan.
   * @param plan The current ItineraryPlan object.
   * @param dayId The ID of the day to remove.
   */
  onRemoveDay: (plan: ItineraryPlan, dayId: string) => void;

  /**
   * Callback to add a spot to a specific day in the plan.
   * @param plan The current ItineraryPlan object.
   * @param dayId The ID of the day to add the spot to.
   * @param spot The Spot object to add.
   * @param index Optional index at which to add the spot.
   */
  onAddSpotToDay: (
    plan: ItineraryPlan,
    dayId: string,
    spot: Spot,
    index?: number,
  ) => void;
  /**
   * Callback to remove a spot from a specific day in the plan.
   * @param plan The current ItineraryPlan object.
   * @param dayId The ID of the day from which to remove the spot.
   * @param instanceId The instance ID of the ScheduledSpot to remove.
   */
  onRemoveSpotFromDay: (
    plan: ItineraryPlan,
    dayId: string,
    instanceId: string,
  ) => void;
  /**
   * Callback to reorder spots within a single day.
   * @param plan The current ItineraryPlan object.
   * @param dayId The ID of the day.
   * @param oldIndex The original index of the spot.
   * @param newIndex The new index for the spot.
   */
  onReorderSpots: (
    plan: ItineraryPlan,
    dayId: string,
    oldIndex: number,
    newIndex: number,
  ) => void;
  /**
   * Callback to move a spot from one day to another, or within the same day but across lists.
   * @param plan The current ItineraryPlan object.
   * @param fromDayId The ID of the source day.
   * @param toDayId The ID of the target day.
   * @param spotInstanceId The instance ID of the ScheduledSpot to move.
   * @param toIndex The target index in the destination day.
   */
  onMoveSpot: (
    plan: ItineraryPlan,
    fromDayId: string,
    toDayId: string,
    spotInstanceId: string,
    toIndex: number,
  ) => void;
}
// --- End Type Definitions ---


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時${mins}分` : `${hours}時`;
};

// Resource Card (Left Panel)
interface ResourceCardProps {
  spot: Spot;
  isDragOverlay?: boolean;
  categoryConfig: CategoryConfigMap;
}

function ResourceCard({ spot, isDragOverlay, categoryConfig }: ResourceCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `resource-${spot.id}`,
      data: { type: "resource", spot },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const primaryCategory = spot.category[0] || "其他";
  const config = categoryConfig[primaryCategory] || { label: primaryCategory, color: "bg-slate-500", icon: MapPin };
  const CategoryIcon = config.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      {...attributes}
      {...listeners}
      whileHover={!isDragOverlay ? { y: -2 } : undefined}
      className={cn(
        "glass-card overflow-hidden cursor-grab active:cursor-grabbing transition-all",
        isDragOverlay && "shadow-2xl rotate-2 scale-105",
        isDragging && "ring-2 ring-brand-500",
      )}
    >
      <div className="relative h-28 overflow-hidden">
        <img
          src={spot.image}
          alt={spot.name}
          className="w-full h-full object-cover"
        />
        <div
          className={cn(
            "absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-sm font-medium flex items-center gap-1",
            config.color,
          )}
        >
          <CategoryIcon className="w-4 h-4" />
          {config.label}
        </div>
        {/* Sustainability Index Badge */}
        {spot.sustainability_index && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 max-w-[120px] focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
            <Leaf className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {spot.sustainability_index.split("、")[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-slate-900 text-sm truncate">
          {spot.name}
        </h4>
        <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{spot.county}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-slate-600 text-sm">
            <Clock className="w-3 h-3" />
            {formatDuration(spot.duration || 120)}
          </div>
          {spot.price > 0 && (
            <span className="text-brand-600 font-medium text-sm">
              NT${spot.price.toLocaleString()}
            </span>
          )}
        </div>
        {/* Target Audience Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {spot.target_audience.slice(0, 3).map((audience, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
            >
              {audience}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Scheduled Spot Card (Right Panel)
interface ScheduledSpotCardProps {
  spot: ScheduledSpot;
  dayId: string;
  index: number;
  onRemove: () => void;
  categoryConfig: CategoryConfigMap;
}

function ScheduledSpotCard({
  spot,
  dayId,
  index,
  onRemove,
  categoryConfig,
}: ScheduledSpotCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: spot.instanceId,
    data: { type: "scheduled", spot, dayId, index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const primaryCategory = spot.category[0] || "其他";
  const config = categoryConfig[primaryCategory] || { label: primaryCategory, color: "bg-slate-500", icon: MapPin };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ x: 2 }}
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3 transition-all",
        isDragging && "ring-2 ring-brand-500 shadow-lg",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
          config.color,
        )}
      >
        {index + 1}
      </div>

      <img
        src={spot.image}
        alt={spot.name}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-slate-900 text-sm truncate">
            {spot.name}
          </h5>
          <span
            className={cn(
              "text-white px-1.5 py-0.5 rounded text-[10px]",
              config.color,
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(spot.duration || 120)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {spot.county}
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}

// Day Container (Droppable)
interface DayContainerProps {
  day: DayPlan;
  onRemoveSpot: (instanceId: string) => void;
  onRemoveDay: () => void;
  canRemove: boolean;
  categoryConfig: CategoryConfigMap;
}

function DayContainer({
  day,
  onRemoveSpot,
  onRemoveDay,
  canRemove,
  categoryConfig,
}: DayContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: "day", dayId: day.id },
  });

  const totalDuration = day.spots.reduce((sum, s) => sum + s.duration, 0);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card border-2 border-dashed transition-all",
        isOver ? "border-brand-500 bg-brand-50/50" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
            {day.dayNumber}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{day.title}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
              <span>{day.spots.length} 個行程</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full focus:ring-2 focus:ring-brand-300 active:bg-brand-800" />
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(totalDuration)}
              </span>
            </div>
          </div>
        </div>
        {canRemove && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemoveDay}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="p-4 space-y-3 min-h-[120px]">
        <SortableContext
          items={day.spots.map((s) => s.instanceId)}
          strategy={verticalListSortingStrategy}
        >
          {day.spots.length === 0 ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isOver
                  ? "border-brand-400 bg-brand-100/50"
                  : "border-slate-200",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-slate-400 text-sm">
                {isOver ? "放開以加入此天" : "拖曳景點到這裡"}
              </div>
            </div>
          ) : (
            day.spots.map((spot, index) => (
              <ScheduledSpotCard
                key={spot.instanceId}
                spot={spot}
                dayId={day.id}
                index={index}
                onRemove={() => onRemoveSpot(spot.instanceId)}
                categoryConfig={categoryConfig}
              />
            ))
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}

// New Plan Modal
interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, destination: string, days: number) => void;
}

function NewPlanModal({ isOpen, onClose, onCreate }: NewPlanModalProps) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim() && destination.trim()) {
      onCreate(name.trim(), destination.trim(), days);
      setName("");
      setDestination("");
      setDays(3);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">建立新行程</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              行程名稱
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：北海道五日遊"
              className="input-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              目的地
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例：日本北海道"
              className="input-modern w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              天數
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-modern w-full"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} 天
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="btn-pill btn-pill-secondary flex-1"
          >
            取消
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={!name.trim() || !destination.trim()}
            className="btn-pill btn-pill-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            建立
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Main Component
export default function ItineraryBuilder({
  allAvailableSpots,
  currentPlan,
  savedPlans,
  categoryConfig,
  ragEngine,
  onCreateNewPlan,
  onLoadPlan,
  onSavePlan,
  onLoadVersion,
  onClearCurrentPlan,
  onAddDay,
  onRemoveDay,
  onAddSpotToDay,
  onRemoveSpotFromDay,
  onReorderSpots,
  onMoveSpot,
}: ItineraryBuilderProps) {
  // Internal UI states for filtering, modals, etc.
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SpotCategory | "all">(
    "all",
  );
  const [seasonFilter, setSeasonFilter] = useState<SeasonType | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<AudienceType | "all">(
    "all",
  );

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null); // For DragOverlay
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<SpotRecord[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saveChangesNote, setSaveChangesNote] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleGetAiRecommendations = useCallback(async () => {
    if (!currentPlan) return;
    setAiLoading(true);
    setShowAiPanel(true);
    await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate AI processing time

    const allScheduledSpots = currentPlan.days.flatMap((d) => d.spots);
    const scheduledIds = allScheduledSpots.map((s) => s.id);
    let currentRegion = currentPlan.destination;
    if (allScheduledSpots.length > 0) {
      currentRegion = allScheduledSpots[0].county;
    }

    const recommendations = ragEngine.getRecommendations(
      {
        currentRegion,
        excludeIds: scheduledIds,
        tags: ["觀光", "景點", "美食"],
      },
      6,
    );

    setAiRecommendations(recommendations);
    setAiLoading(false);
  }, [currentPlan, ragEngine]);

  const convertToSpot = useCallback(
    (record: SpotRecord): Spot => ({
      id: record.id,
      name: record.name,
      category: (record.tags.includes("美食") ? ["美食"] : ["文化深度體驗"]) as SpotCategory[], // Example dynamic category
      county: record.region,
      duration: 90, // Default duration
      description: record.note || `${record.region}的${record.tags[0] || "景點"}`,
      image: record.image || `https://picsum.photos/seed/${record.id}/400/300`,
      price: 0,
      tags: record.tags,
      season: ["春", "夏", "秋", "冬"], // Default seasons
      sustainability_index: "",
      target_audience: ["文青", "情侶"], // Default audience
    }),
    [],
  );

  // Filter available spots based on internal UI states
  const filteredSpots = useMemo(() => {
    return allAvailableSpots.filter((spot) => {
      const matchesSearch = searchQuery
        ? spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          spot.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesCategory =
        categoryFilter === "all" || spot.category.includes(categoryFilter);

      const matchesSeason =
        seasonFilter === "all" || spot.season.includes(seasonFilter);

      const matchesAudience =
        audienceFilter === "all" || spot.target_audience.includes(audienceFilter);

      return matchesSearch && matchesCategory && matchesSeason && matchesAudience;
    });
  }, [allAvailableSpots, searchQuery, categoryFilter, seasonFilter, audienceFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "resource") {
      setActiveSpot(active.data.current.spot);
    } else if (active.data.current?.type === "scheduled") {
      setActiveSpot(active.data.current.spot);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveSpot(null); // Clear active spot for drag overlay

      if (!over || !currentPlan) return;

      const activeData = active.data.current;
      const overId = over.id as string;

      if (activeData?.type === "resource") {
        const spotToAdd: Spot = activeData.spot;
        if (overId.startsWith("day-")) {
          const dayId = overId.replace("day-", "");
          onAddSpotToDay(currentPlan, dayId, spotToAdd);
        } else if (over.data.current?.type === "scheduled") {
          const dayId = over.data.current.dayId;
          const index = over.data.current.index;
          onAddSpotToDay(currentPlan, dayId, spotToAdd, index);
        }
      } else if (activeData?.type === "scheduled") {
        const fromDayId = activeData.dayId;
        const fromIndex = activeData.index;

        if (overId.startsWith("day-")) {
          const toDayId = overId.replace("day-", "");
          if (fromDayId !== toDayId) {
            const toDay = currentPlan.days.find((d) => d.id === toDayId);
            const toIndex = toDay?.spots.length ?? 0;
            onMoveSpot(currentPlan, fromDayId, toDayId, activeData.spot.instanceId, toIndex);
          }
        } else if (over.data.current?.type === "scheduled") {
          const toDayId = over.data.current.dayId;
          const toIndex = over.data.current.index;

          if (fromDayId === toDayId) {
            if (fromIndex !== toIndex) {
              onReorderSpots(currentPlan, fromDayId, fromIndex, toIndex);
            }
          } else {
            onMoveSpot(currentPlan, fromDayId, toDayId, activeData.spot.instanceId, toIndex);
          }
        }
      }
    },
    [currentPlan, onAddSpotToDay, onMoveSpot, onReorderSpots],
  );

  // Derive categories from categoryConfig for filter buttons
  const categories: (SpotCategory | "all")[] = useMemo(() => {
    return ["all" as const, ...Object.keys(categoryConfig).filter(k => k !== '其他') as SpotCategory[]].sort();
  }, [categoryConfig]);


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Added glass-card for root component as per Kintone widget design guidelines
      className="glass-card h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="glass-panel border-b border-slate-200 px-6 py-4"
      >
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">行程配置器</h1>
              <p className="text-sm text-slate-500">拖曳景點建立您的完美旅程</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentPlan && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGetAiRecommendations}
                  className="btn-pill gap-2 bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25 focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 推薦
                </motion.button>
                {currentPlan.versions && currentPlan.versions.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowVersionHistory(true)}
                    className="btn-pill btn-pill-secondary gap-2"
                  >
                    <History className="w-4 h-4" />
                    版本歷史
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSaveModal(true)}
                  className="btn-pill btn-pill-primary gap-2"
                >
                  <Save className="w-4 h-4" />
                  儲存
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClearCurrentPlan}
                  className="btn-pill btn-pill-secondary gap-2"
                >
                  <X className="w-4 h-4" />
                  關閉
                </motion.button>
              </>
            )}
            {!currentPlan && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewPlanModal(true)}
                  className="btn-pill btn-pill-primary gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新建行程
                </motion.button>
                {savedPlans.length > 0 && (
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSavedPlans(!showSavedPlans)}
                      className="btn-pill btn-pill-secondary gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      載入行程
                      <ChevronDown className="w-4 h-4" />
                    </motion.button>
                    <AnimatePresence>
                      {showSavedPlans && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-64 glass-card py-2 z-10"
                        >
                          {savedPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => {
                                onLoadPlan(plan.id);
                                setShowSavedPlans(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                            >
                              <div>
                                <div className="font-medium text-slate-900">
                                  {plan.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {plan.destination} · {plan.daysCount} 天
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {!currentPlan ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
              <Calendar className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              開始規劃您的旅程
            </h2>
            <p className="text-slate-500 mb-6">建立新行程或載入已儲存的行程</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewPlanModal(true)}
              className="btn-pill btn-pill-primary gap-2"
            >
              <Plus className="w-5 h-5" />
              建立新行程
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-80 glass-panel border-r border-slate-200 flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋景點、餐廳..."
                    className="input-modern w-full pl-10 pr-4 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        categoryFilter === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {cat === "all" ? "全部" : categoryConfig[cat]?.label || cat}
                    </button>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <span className="text-sm text-slate-500 mb-1.5 block">
                    季節篩選
                  </span>
                  <SeasonFilter
                    value={seasonFilter}
                    onChange={setSeasonFilter}
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <AudienceSelector
                    value={audienceFilter}
                    onChange={setAudienceFilter}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                  {filteredSpots.map((spot) => (
                    <ResourceCard key={spot.id} spot={spot} categoryConfig={categoryConfig} />
                  ))}
                </div>
                {filteredSpots.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    找不到符合條件的景點
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 overflow-y-auto p-6">
              <motion.div
                variants={itemVariants}
                className="glass-card p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentPlan.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {currentPlan.destination} · {currentPlan.days.length}{" "}
                      天行程
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddDay(currentPlan)}
                    className="btn-pill btn-pill-secondary gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    新增天數
                  </motion.button>
                </div>
              </motion.div>

              <div className="space-y-6">
                {currentPlan.days.map((day) => (
                  <DayContainer
                    key={day.id}
                    day={day}
                    onRemoveSpot={(instanceId) =>
                      onRemoveSpotFromDay(currentPlan, day.id, instanceId)
                    }
                    onRemoveDay={() => onRemoveDay(currentPlan, day.id)}
                    canRemove={currentPlan.days.length > 1}
                    categoryConfig={categoryConfig}
                  />
                ))}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeSpot && <ResourceCard spot={activeSpot} isDragOverlay categoryConfig={categoryConfig} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* AI Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-brand-700 rounded-lg flex items-center justify-center focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      AI 智慧推薦
                    </h2>
                    <p className="text-sm text-slate-500">
                      根據您的行程推薦相近景點
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAiPanel(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-600">AI 正在分析您的行程...</p>
                  </div>
                ) : aiRecommendations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {aiRecommendations.map((rec) => (
                      <motion.div
                        key={rec.id}
                        whileHover={{ y: -2 }}
                        className="glass-card overflow-hidden"
                      >
                        <div className="relative h-32">
                          <img
                            src={rec.image || `https://picsum.photos/seed/${rec.id}/400/300`}
                            alt={rec.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-brand-500 text-white px-2 py-0.5 rounded-full text-sm font-medium flex items-center gap-1 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
                            <Lightbulb className="w-3 h-3" />
                            推薦
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {rec.name}
                          </h4>
                          <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                            <MapPin className="w-3 h-3" />
                            {rec.region}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {rec.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (currentPlan && currentPlan.days.length > 0) {
                                onAddSpotToDay(
                                  currentPlan,
                                  currentPlan.days[0].id,
                                  convertToSpot(rec),
                                );
                                setAiRecommendations((prev) =>
                                  prev.filter((r) => r.id !== rec.id),
                                );
                              }
                            }}
                            className="w-full py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                          >
                            <Plus className="w-4 h-4" />
                            加入第一天
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
                      <Lightbulb className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-2">
                      目前沒有符合條件的推薦
                    </p>
                    <p className="text-slate-400 text-sm">
                      試著加入一些景點後再取得推薦
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                <p className="text-sm text-slate-500">
                  {aiRecommendations.length > 0 &&
                    `找到 ${aiRecommendations.length} 個推薦景點`}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAiPanel(false)}
                  className="btn-pill btn-pill-secondary"
                >
                  關閉
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NewPlanModal
        isOpen={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        onCreate={onCreateNewPlan}
      />

      {/* Save Modal with Changes Note */}
      <AnimatePresence>
        {showSaveModal && currentPlan && (
          <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">儲存行程</h2>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveChangesNote("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    變更說明（選填）
                  </label>
                  <textarea
                    value={saveChangesNote}
                    onChange={(e) => setSaveChangesNote(e.target.value)}
                    placeholder="請簡述本次變更內容..."
                    rows={3}
                    className="input-modern w-full resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSaveModal(false);
                      setSaveChangesNote("");
                    }}
                    className="btn-pill btn-pill-secondary flex-1"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      onSavePlan(currentPlan, saveChangesNote || undefined);
                      setShowSaveModal(false);
                      setSaveChangesNote("");
                    }}
                    className="btn-pill btn-pill-primary flex-1 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    儲存
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version History Modal */}
      <AnimatePresence>
        {showVersionHistory && currentPlan && (
          <div className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-brand-600" />
                  <h2 className="text-lg font-bold text-gray-900">版本歷史</h2>
                  <span className="text-sm text-gray-500">
                    目前版本：v{currentPlan.current_version || 1}
                  </span>
                </div>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {currentPlan.versions && currentPlan.versions.length > 0 ? (
                  <div className="space-y-3">
                    {[...currentPlan.versions].reverse().map((version) => (
                      <motion.div
                        key={version.version}
                        whileHover={{ x: 2 }}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all",
                          version.version === currentPlan.current_version
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 bg-white hover:border-gray-300",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-gray-900">
                                版本 {version.version}
                              </span>
                              {version.version ===
                                currentPlan.current_version && (
                                <span className="px-2 py-0.5 bg-brand-500 text-white text-sm rounded-full focus:ring-2 focus:ring-brand-300 active:bg-brand-800">
                                  目前版本
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {version.changes || "無說明"}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              <span>建立者：{version.created_by}</span>
                              <span>
                                時間：
                                {new Date(version.created_at).toLocaleString(
                                  "zh-TW",
                                )}
                              </span>
                            </div>
                          </div>
                          {version.version !== currentPlan.current_version && (
                            <button
                              onClick={() => {
                                onLoadVersion(currentPlan, version.version);
                                setShowVersionHistory(false);
                              }}
                              className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-200 transition-colors flex items-center gap-1 focus:ring-2 focus:ring-brand-300 active:bg-brand-800"
                            >
                              <Eye className="w-4 h-4" />
                              載入
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">尚無版本記錄</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}