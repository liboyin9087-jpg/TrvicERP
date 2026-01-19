import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MapPin, Clock, Search, Plus, Trash2, GripVertical,
  Calendar, ChevronDown, Save, FolderOpen, X,
  Camera, ChevronRight, Sparkles, Lightbulb, Navigation,
  Leaf, Mountain, Waves, Palette, Wheat, Building2, History,
  Loader2
} from 'lucide-react';
import {
  useItineraryBuilderStore,
  CATEGORY_CONFIG,
  type Spot,
  type ScheduledSpot,
  type SpotCategory,
  type DayPlan,
} from '@/store/useItineraryBuilderStore';
import SeasonFilter from '../shared/SeasonFilter';
import AudienceSelector from '../shared/AudienceSelector';
import { cn } from '@/lib/utils';
// 引入我們剛建立的 AI 服務
import { aiService } from '@/services/aiService';
import { aiService as externalAiService } from '@/services/external/aiService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時${mins}分` : `${hours}時`;
};

const getCategoryIcon = (category: SpotCategory) => {
  switch (category) {
    case '綠色永續景點': return <Leaf className="w-4 h-4" />;
    case '山林秘境': return <Mountain className="w-4 h-4" />;
    case '海岸離島': return <Waves className="w-4 h-4" />;
    case '文化深度體驗': return <Palette className="w-4 h-4" />;
    case '農村慢旅': return <Wheat className="w-4 h-4" />;
    case '都市邊緣秘境': return <Building2 className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

// Resource Card (Left Panel)
interface ResourceCardProps {
  spot: Spot;
  isDragOverlay?: boolean;
}

function ResourceCard({ spot, isDragOverlay }: ResourceCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `resource-${spot.id}`,
    data: { type: 'resource', spot },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const primaryCategory = spot.category[0];
  const config = CATEGORY_CONFIG[primaryCategory];

  return (
    <motion.div
      ref={setNodeRef}
      style={isDragOverlay ? {} : style}
      {...attributes}
      {...listeners}
      whileHover={!isDragOverlay ? { y: -2 } : undefined}
      className={cn(
        'trvic-card overflow-hidden cursor-grab active:cursor-grabbing transition-all',
        isDragOverlay && 'shadow-2xl rotate-2 scale-105',
        isDragging && 'ring-2 ring-brand-500'
      )}
    >
      <div className="relative h-28 overflow-hidden">
        <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
        <div className={cn(
          'absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
          config?.color || 'bg-slate-500'
        )}>
          {getCategoryIcon(primaryCategory)}
          {config?.label || primaryCategory}
        </div>
        {spot.sustainability_index && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 max-w-[120px]">
            <Leaf className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{spot.sustainability_index.split('、')[0]}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-slate-900 text-sm truncate">{spot.name}</h4>
        <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{spot.county}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <Clock className="w-3 h-3" />
            {formatDuration(spot.duration || 120)}
          </div>
          {spot.price > 0 && (
            <span className="text-brand-600 font-medium text-xs">
              NT${spot.price.toLocaleString()}
            </span>
          )}
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
}

function ScheduledSpotCard({ spot, dayId, index, onRemove }: ScheduledSpotCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: spot.instanceId,
    data: { type: 'scheduled', spot, dayId, index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const primaryCategory = spot.category[0];
  const config = CATEGORY_CONFIG[primaryCategory];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      whileHover={{ x: 2 }}
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 transition-all',
        isDragging && 'ring-2 ring-brand-500 shadow-lg'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
        config?.color || 'bg-slate-500'
      )}>
        {index + 1}
      </div>

      <img
        src={spot.image}
        alt={spot.name}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-slate-900 text-sm truncate">{spot.name}</h5>
          <span className={cn('text-white px-1.5 py-0.5 rounded text-[10px]', config?.color || 'bg-slate-500')}>
            {config?.label || primaryCategory}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
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
        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
}

function DayContainer({ day, onRemoveSpot, onRemoveDay, canRemove }: DayContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: 'day', dayId: day.id },
  });

  const totalDuration = day.spots.reduce((sum, s) => sum + s.duration, 0);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'trvic-card border-2 border-dashed transition-all',
        isOver ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/25">
            {day.dayNumber}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{day.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{day.spots.length} 個行程</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
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
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <div className="p-4 space-y-3 min-h-[120px]">
        <SortableContext
          items={day.spots.map(s => s.instanceId)}
          strategy={verticalListSortingStrategy}
        >
          {day.spots.length === 0 ? (
            <div className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              isOver ? 'border-brand-400 bg-brand-100/50' : 'border-slate-200'
            )}>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-slate-400 text-sm">
                {isOver ? '放開以加入此天' : '拖曳景點到這裡'}
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
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);

  const handleCreate = () => {
    if (name.trim() && destination.trim()) {
      onCreate(name.trim(), destination.trim(), days);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div className="trvic-card w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">建立新行程</h2>
        <div className="space-y-4">
          <input type="text" placeholder="行程名稱" className="trvic-input w-full" value={name} onChange={e => setName(e.target.value)} />
          <input type="text" placeholder="目的地" className="trvic-input w-full" value={destination} onChange={e => setDestination(e.target.value)} />
          <select className="trvic-input w-full" value={days} onChange={e => setDays(Number(e.target.value))}>
            {[...Array(10)].map((_, i) => <option key={i} value={i+1}>{i+1} 天</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="trvic-btn trvic-btn-secondary">取消</button>
          <button onClick={handleCreate} className="trvic-btn trvic-btn-primary">建立</button>
        </div>
      </motion.div>
    </div>
  );
}

// Main Component
export default function ItineraryBuilder() {
  const {
    currentPlan,
    searchQuery,
    categoryFilter,
    seasonFilter,
    audienceFilter,
    savedPlans,
    createNewPlan,
    loadPlan,
    savePlan,
    loadVersion,
    addDay,
    removeDay,
    addSpotToDay,
    removeSpotFromDay,
    reorderSpots,
    moveSpot,
    setSearchQuery,
    setCategoryFilter,
    setSeasonFilter,
    setAudienceFilter,
    getFilteredSpots,
    setDragging,
    clearCurrentPlan,
  } = useItineraryBuilderStore();

  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRecommendedSpots, setAiRecommendedSpots] = useState<Spot[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saveChangesNote, setSaveChangesNote] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // 預設打開一個行程（如果沒有當前行程）
  React.useEffect(() => {
    if (!currentPlan && savedPlans.length === 0) {
      // 創建一個預設行程：台灣小眾景點深度遊
      createNewPlan('台灣小眾景點深度遊', '台灣', 3);
    }
  }, [currentPlan, savedPlans.length, createNewPlan]);

  // 🧠 整合 DeepSeek-V3 邏輯 (原有方法，保留用於彈窗顯示)
  const handleGetAiRecommendations = async () => {
    if (!currentPlan) return;
    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      // 呼叫 SiliconFlow
      const planContext = {
        destination: currentPlan.destination,
        days: currentPlan.days.map(d => ({
          day: d.dayNumber,
          spots: d.spots.map(s => s.name)
        }))
      };

      const result = await aiService.getDeepSeekSuggestions(
        planContext, 
        `請推薦適合 ${currentPlan.destination} 的景點，避開已安排的點。`
      );

      // 轉換格式
      const recommendations = result.suggestions.map((item: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        name: item.name,
        category: ['文化深度體驗'] as SpotCategory[],
        county: item.region,
        duration: item.duration || 90,
        description: item.reason,
        image: `https://picsum.photos/seed/${index + 100}/400/300`,
        price: 0,
        tags: item.tags || ['AI推薦'],
        season: ['春', '夏', '秋', '冬'],
        target_audience: ['大眾'],
      }));

      setAiRecommendations(recommendations);
    } catch (error) {
      console.error(error);
      alert("AI 思考逾時，請檢查 API Key");
    } finally {
      setAiLoading(false);
    }
  };

  // 🧠 新的 AI 推薦方法：直接將結果添加到左側列表
  const handleAIRecommend = async () => {
    if (!currentPlan?.destination) {
      alert("請先設定行程目的地！");
      return;
    }

    setIsGenerating(true);
    try {
      // 蒐集目前行程裡所有的景點
      const currentSpots = currentPlan.days.flatMap(d => d.spots);

      // 呼叫 AI
      const recommendations = await externalAiService.getRecommendations(
        currentPlan.destination, 
        currentSpots
      );

      if (recommendations.length > 0) {
        // 將 AI 推薦的結果轉換為完整的 Spot 格式並添加到狀態
        const fullSpots: Spot[] = recommendations.map((item, index) => ({
          id: item.id || `ai-rec-${Date.now()}-${index}`,
          name: item.name || '未命名景點',
          category: item.category || ['文化深度體驗'],
          county: item.county || '台灣',
          location: item.location || { lat: 0, lng: 0, address: item.county || '' },
          duration: item.duration || 60,
          description: item.description || '',
          image: item.image || `https://picsum.photos/seed/ai-${index}/400/300`,
          price: item.price || 0,
          tags: item.tags || ['AI推薦'],
          season: item.season || ['春', '夏', '秋', '冬'],
          target_audience: item.target_audience || ['大眾'],
        }));

        // 將 AI 推薦的結果直接「塞」進左側列表的最上方
        setAiRecommendedSpots(prev => [...fullSpots, ...prev]);
        alert(`AI 已為您推薦 ${recommendations.length} 個景點！請查看左側列表頂端。`);
      } else {
        alert("AI 暫時想不到推薦的景點，請稍後再試。");
      }
    } catch (e: any) {
      console.error("AI 推薦失敗:", e);
      alert(e.message || "AI 連線失敗，請檢查 API Key");
    } finally {
      setIsGenerating(false);
    }
  };

  // 👁️ 整合 Qwen2-VL 視覺辨識
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAiLoading(true);
      setShowAiPanel(true);
      try {
        const description = await aiService.analyzeImageWithQwen(
          base64, 
          "請辨識這張圖片中的景點名稱、營業時間或特色，並總結成一段簡短描述。"
        );
        alert(`視覺辨識結果：\n${description}`);
      } catch (err) {
        alert("視覺辨識失敗");
      } finally {
        setAiLoading(false);
      }
    };
  };

  const filteredSpots = getFilteredSpots();
  // 合併 AI 推薦的景點到列表最上方
  const allSpots = [...aiRecommendedSpots, ...filteredSpots];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDragging(true, active.id as string);
    if (active.data.current?.type === 'resource' || active.data.current?.type === 'scheduled') {
      setActiveSpot(active.data.current.spot);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragging(false);
    setActiveSpot(null);
    if (!over || !currentPlan) return;
    
    const activeData = active.data.current;
    const overId = over.id as string;

    if (activeData?.type === 'resource') {
      if (overId.startsWith('day-')) {
        addSpotToDay(overId.replace('day-', ''), activeData.spot);
      }
    } else if (activeData?.type === 'scheduled') {
      const fromDayId = activeData.dayId;
      const fromIndex = activeData.index;
      if (overId.startsWith('day-')) {
        moveSpot(fromDayId, overId.replace('day-', ''), activeData.spot.instanceId, 999);
      }
    }
  };

  const categories: (SpotCategory | 'all')[] = ['all', '綠色永續景點', '山林秘境', '海岸離島', '文化深度體驗', '農村慢旅', '都市邊緣秘境'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="glass-panel border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">行程配置器</h1>
              <p className="text-sm text-slate-500">DeepSeek-V3 驅動智慧排程</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentPlan && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAIRecommend}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      思考中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI 推薦
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSaveModal(true)}
                  className="trvic-btn trvic-btn-primary gap-2"
                >
                  <Save className="w-4 h-4" />
                  儲存
                </motion.button>
                <motion.button onClick={clearCurrentPlan} className="trvic-btn trvic-btn-secondary gap-2">
                  <X className="w-4 h-4" /> 關閉
                </motion.button>
              </>
            )}
            {!currentPlan && (
               <motion.button onClick={() => setShowNewPlanModal(true)} className="trvic-btn trvic-btn-primary gap-2">
                  <Plus className="w-4 h-4" /> 建立新行程
               </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      {!currentPlan ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">開始規劃</h2>
            <button onClick={() => setShowNewPlanModal(true)} className="trvic-btn trvic-btn-primary">
              <Plus className="w-5 h-5" /> 建立新行程
            </button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-80 glass-panel border-r border-slate-200 flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜尋..." className="trvic-input w-full pl-10 pr-4 text-sm" />
                   </div>
                   <label className="cursor-pointer p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title="AI 讀圖">
                      <Camera className="w-5 h-5 text-slate-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </label>
                </div>
                {/* Filters */}
                <div className="flex gap-1.5 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)} className={cn('px-2 py-1 rounded text-xs', categoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100')}>
                      {cat === 'all' ? '全部' : CATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {allSpots.map(spot => <ResourceCard key={spot.id} spot={spot} />)}
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">{currentPlan.name}</h2>
                 <button onClick={addDay} className="trvic-btn trvic-btn-secondary"><Plus className="w-4 h-4"/> 新增天數</button>
              </div>
              {currentPlan.days.map(day => (
                <DayContainer key={day.id} day={day} onRemoveSpot={(id) => removeSpotFromDay(day.id, id)} onRemoveDay={() => removeDay(day.id)} canRemove={currentPlan.days.length > 1} />
              ))}
            </div>
          </div>
          <DragOverlay>{activeSpot && <ResourceCard spot={activeSpot} isDragOverlay />}</DragOverlay>
        </DndContext>
      )}

      {/* AI Panel Modal */}
      <AnimatePresence>
        {showAiPanel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="trvic-card w-full max-w-2xl max-h-[80vh] flex flex-col bg-white">
              <div className="p-4 border-b flex justify-between items-center">
                 <h2 className="font-bold">AI 智慧推薦</h2>
                 <button onClick={() => setShowAiPanel(false)}><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                 {aiLoading ? (
                    <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"/>AI 思考中...</div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                       {aiRecommendations.map((rec: any) => (
                          <div key={rec.id} className="border rounded-lg p-3">
                             <img src={rec.image} className="w-full h-32 object-cover rounded mb-2"/>
                             <h4 className="font-bold">{rec.name}</h4>
                             <p className="text-sm text-gray-500">{rec.description}</p>
                             <button onClick={() => { 
                                 if (currentPlan) addSpotToDay(currentPlan.days[0].id, rec); 
                                 setShowAiPanel(false); 
                             }} className="w-full mt-2 bg-purple-500 text-white py-1 rounded text-sm">加入行程</button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <NewPlanModal isOpen={showNewPlanModal} onClose={() => setShowNewPlanModal(false)} onCreate={createNewPlan} />
      {showSaveModal && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96">
               <h2 className="font-bold mb-4">儲存行程</h2>
               <textarea className="w-full border p-2 rounded mb-4" placeholder="備註..." value={saveChangesNote} onChange={e => setSaveChangesNote(e.target.value)}/>
               <div className="flex justify-end gap-2">
                  <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 border rounded">取消</button>
                  <button onClick={() => { savePlan(saveChangesNote); setShowSaveModal(false); }} className="px-4 py-2 bg-brand-500 text-white rounded">確認</button>
               </div>
            </div>
         </div>
      )}
    </motion.div>
  );
}