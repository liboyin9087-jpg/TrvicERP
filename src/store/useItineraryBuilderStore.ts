import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// 1. Types
// ============================================

export type SpotCategory = 
  | '綠色永續景點' 
  | '山林秘境' 
  | '海岸離島' 
  | '文化深度體驗' 
  | '農村慢旅' 
  | '都市邊緣秘境';

export const CATEGORY_CONFIG: Record<SpotCategory, { label: string; color: string }> = {
  '綠色永續景點': { label: '永續', color: 'bg-emerald-500' },
  '山林秘境': { label: '山林', color: 'bg-green-600' },
  '海岸離島': { label: '海島', color: 'bg-blue-500' },
  '文化深度體驗': { label: '文化', color: 'bg-purple-500' },
  '農村慢旅': { label: '農村', color: 'bg-amber-500' },
  '都市邊緣秘境': { label: '秘境', color: 'bg-slate-500' },
};

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory[];
  county: string;
  // 地理資訊物件
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  duration: number; // minutes
  description?: string;
  image: string;
  price: number;
  tags: string[];
  season: string[];
  sustainability_index?: string;
  target_audience: string[];
}

export interface ScheduledSpot extends Spot {
  instanceId: string; // 在行程中的唯一 ID
  startTime?: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  title: string;
  spots: ScheduledSpot[];
}

export interface TravelPlan {
  id: string;
  name: string;
  destination: string;
  days: DayPlan[];
  versions?: any[];
  current_version?: number;
}

// ============================================
// 2. Mock Data
// ============================================

// 導入轉換函數（動態導入以避免循環依賴）
let convertedSpots: Spot[] | null = null;

function getMockSpots(): Spot[] {
  if (convertedSpots) return convertedSpots;
  
  try {
    // 動態導入轉換函數
    const { convertSpotsData } = require('../utils/convertSpotsData');
    convertedSpots = convertSpotsData();
    return convertedSpots;
  } catch (error) {
    console.warn('無法載入完整景點數據，使用預設數據', error);
    // 降級到預設數據
    return [
      {
        id: 'spot-1',
        name: '阿里山森林遊樂區',
        category: ['山林秘境', '綠色永續景點'],
        county: '嘉義縣',
        location: {
          lat: 23.509,
          lng: 120.803,
          address: '嘉義縣阿里山鄉中正村59號'
        },
        duration: 180,
        price: 300,
        description: '欣賞日出、雲海、晚霞、森林與高山鐵路。',
        image: 'https://images.unsplash.com/photo-1549655848-f60897b777a8?auto=format&fit=crop&w=400&q=80',
        tags: ['日出', '神木', '小火車', '適合團體', '有停車場', '有導覽服務', '適合拍照'],
        season: ['春', '夏', '秋', '冬'],
        target_audience: ['家庭', '長輩', '攝影'],
        sustainability_index: '碳足跡認證、無痕山林'
      },
      {
        id: 'spot-2',
        name: '九份老街',
        category: ['文化深度體驗'],
        county: '新北市',
        location: {
          lat: 25.109,
          lng: 121.845,
          address: '新北市瑞芳區基山街'
        },
        duration: 120,
        price: 0,
        description: '懷舊氣息濃厚的山城，品嚐芋圓與茶樓文化。',
        image: 'https://images.unsplash.com/photo-1599558503838-89218698c923?auto=format&fit=crop&w=400&q=80',
        tags: ['老街', '美食', '夜景', '適合團體', '有停車場', '適合拍照', '有紀念品'],
        season: ['春', '夏', '秋', '冬'],
        target_audience: ['情侶', '學生', '外國遊客'],
      }
    ];
  }
}

const MOCK_SPOTS: Spot[] = getMockSpots();

// ============================================
// 3. Store Implementation
// ============================================

interface ItineraryBuilderState {
  currentPlan: TravelPlan | null;
  savedPlans: TravelPlan[];
  searchQuery: string;
  categoryFilter: SpotCategory | 'all';
  seasonFilter: string[];
  audienceFilter: string[];
  isDragging: boolean;
  activeDragId?: string;

  createNewPlan: (name: string, destination: string, daysCount: number) => void;
  loadPlan: (id: string) => void;
  savePlan: (note?: string) => void;
  loadVersion: (version: number) => void;
  clearCurrentPlan: () => void;
  addDay: () => void;
  removeDay: (dayId: string) => void;
  addSpotToDay: (dayId: string, spot: Spot, index?: number) => void;
  removeSpotFromDay: (dayId: string, instanceId: string) => void;
  moveSpot: (fromDayId: string, toDayId: string, instanceId: string, newIndex: number) => void;
  reorderSpots: (dayId: string, oldIndex: number, newIndex: number) => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: SpotCategory | 'all') => void;
  setSeasonFilter: (s: string[]) => void;
  setAudienceFilter: (a: string[]) => void;
  getFilteredSpots: () => Spot[];
  setDragging: (isDragging: boolean, activeId?: string) => void;
}

export const useItineraryBuilderStore = create<ItineraryBuilderState>((set, get) => ({
  currentPlan: null,
  savedPlans: [],
  searchQuery: '',
  categoryFilter: 'all',
  seasonFilter: [],
  audienceFilter: [],
  isDragging: false,

  createNewPlan: (name, destination, daysCount) => {
    const days: DayPlan[] = Array.from({ length: daysCount }, (_, i) => ({
      id: uuidv4(),
      dayNumber: i + 1,
      title: `Day ${i + 1}`,
      spots: []
    }));
    set({ currentPlan: { id: uuidv4(), name, destination, days, versions: [], current_version: 1 } });
  },

  loadPlan: (id) => {
    const plan = get().savedPlans.find(p => p.id === id);
    if (plan) set({ currentPlan: JSON.parse(JSON.stringify(plan)) });
  },
  
  clearCurrentPlan: () => set({ currentPlan: null }),

  savePlan: (note) => {
    const { currentPlan, savedPlans } = get();
    if (!currentPlan) return;
    const newVersion = {
      version: (currentPlan.current_version || 0) + 1,
      changes: note || '手動儲存',
      created_at: new Date().toISOString(),
      created_by: '系統管理員',
      data: JSON.parse(JSON.stringify(currentPlan))
    };
    const updatedPlan = {
      ...currentPlan,
      current_version: newVersion.version,
      versions: [...(currentPlan.versions || []), newVersion]
    };
    set({ savedPlans: [updatedPlan, ...savedPlans.filter(p => p.id !== currentPlan.id)], currentPlan: updatedPlan });
    alert('行程儲存成功！');
  },

  loadVersion: (v) => console.log(v),

  addDay: () => {
    set(state => {
      if (!state.currentPlan) return state;
      const nextNum = state.currentPlan.days.length + 1;
      return {
        currentPlan: {
          ...state.currentPlan,
          days: [...state.currentPlan.days, { id: uuidv4(), dayNumber: nextNum, title: `Day ${nextNum}`, spots: [] }]
        }
      };
    });
  },

  removeDay: (id) => {
    set(state => ({
      currentPlan: state.currentPlan ? { ...state.currentPlan, days: state.currentPlan.days.filter(d => d.id !== id) } : null
    }));
  },

  addSpotToDay: (dayId, spot, index) => {
    set(state => {
      if (!state.currentPlan) return state;
      const newDays = state.currentPlan.days.map(day => {
        if (day.id !== dayId) return day;
        const newSpot = { ...spot, instanceId: uuidv4(), startTime: '09:00' };
        const newSpots = [...day.spots];
        if (typeof index === 'number') newSpots.splice(index, 0, newSpot);
        else newSpots.push(newSpot);
        return { ...day, spots: newSpots };
      });
      return { currentPlan: { ...state.currentPlan, days: newDays } };
    });
  },

  removeSpotFromDay: (dayId, instanceId) => {
    set(state => {
      if (!state.currentPlan) return state;
      const newDays = state.currentPlan.days.map(day => {
        if (day.id !== dayId) return day;
        return { ...day, spots: day.spots.filter(s => s.instanceId !== instanceId) };
      });
      return { currentPlan: { ...state.currentPlan, days: newDays } };
    });
  },

  moveSpot: (fromDayId, toDayId, instanceId, newIndex) => {
    set(state => {
      if (!state.currentPlan) return state;
      let spot: any;
      const daysAfterRemove = state.currentPlan.days.map(d => {
        if (d.id === fromDayId) {
          spot = d.spots.find(s => s.instanceId === instanceId);
          return { ...d, spots: d.spots.filter(s => s.instanceId !== instanceId) };
        }
        return d;
      });
      if (!spot) return state;
      const finalDays = daysAfterRemove.map(d => {
        if (d.id === toDayId) {
          const newSpots = [...d.spots];
          newSpots.splice(Math.min(newIndex, newSpots.length), 0, spot);
          return { ...d, spots: newSpots };
        }
        return d;
      });
      return { currentPlan: { ...state.currentPlan, days: finalDays } };
    });
  },
reorderSpots: (dayId, oldIdx, newIdx) => {
    set(state => {
      if (!state.currentPlan) return state;
      const newDays = state.currentPlan.days.map(d => {
        if (d.id !== dayId) return d;
        const newSpots = [...d.spots];
        const [moved] = newSpots.splice(oldIdx, 1);
        newSpots.splice(newIdx, 0, moved);
        return { ...d, spots: newSpots };
      });
      return { currentPlan: { ...state.currentPlan, days: newDays } };
    });
  },

  // ✨ 補齊以下漏掉的 Actions
  setSearchQuery: (q) => set({ searchQuery: q }),
  
  setCategoryFilter: (c) => set({ categoryFilter: c }),
  
  setSeasonFilter: (s) => set({ seasonFilter: s }),
  
  setAudienceFilter: (a) => set({ audienceFilter: a }),

  getFilteredSpots: () => {
    const { searchQuery, categoryFilter } = get();
    return MOCK_SPOTS.filter(s => {
      const matchSearch = s.name.includes(searchQuery) || s.county.includes(searchQuery);
      const matchCat = categoryFilter === 'all' || s.category.includes(categoryFilter);
      return matchSearch && matchCat;
    });
  },

  setDragging: (d, id) => set({ isDragging: d, activeDragId: id }),
})); // <-- 確保這裡有兩個右括號與一個分號