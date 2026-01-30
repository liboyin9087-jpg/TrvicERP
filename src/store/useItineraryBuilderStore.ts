// /workspaces/TrvicERP/src/store/useItineraryBuilderStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  SeasonType,
  SpotCategory,
  Spot,
  ScheduledSpot,
  DayPlan,
  ItineraryVersion,
  ItineraryPlan,
  ItineraryBuilderConfig,
} from '../types/itinerary'; // 引入獨立的型別定義
import { MOCK_SPOTS } from '../data/mockSpots'; // 引入獨立的 mock 資料

// ============================================
// Config Props for UI elements (Dashtail UI規範)
// ============================================

export const CATEGORY_CONFIG: Record<SpotCategory, { label: string; color: string; icon: string }> = {
  '綠色永續景點': { label: '綠色永續', color: 'bg-dashtail-success-500', icon: '🌱' },
  '山林秘境': { label: '山林秘境', color: 'bg-dashtail-info-600', icon: '🏔️' },
  '海岸離島': { label: '海岸離島', color: 'bg-dashtail-primary-500', icon: '🏝️' },
  '文化深度體驗': { label: '文化體驗', color: 'bg-dashtail-warning-500', icon: '🎭' },
  '農村慢旅': { label: '農村慢旅', color: 'bg-dashtail-warning-600', icon: '🌾' },
  '都市邊緣秘境': { label: '都市秘境', color: 'bg-dashtail-accent-500', icon: '🏙️' },
};

// ============================================
// Store State & Actions
// ============================================

interface ItineraryBuilderState {
  // Configured available spots (from ItineraryBuilderConfig)
  availableSpots: Spot[];

  // Current itinerary being edited
  currentPlan: ItineraryPlan | null;

  // Resource library filter
  searchQuery: string;
  categoryFilter: SpotCategory | 'all';
  seasonFilter: SeasonType;
  audienceFilter: string[]; // e.g., ['親子', '文青', '情侶']

  // UI state
  isDragging: boolean;
  activeDragId: string | null;

  // Saved itineraries
  savedPlans: ItineraryPlan[];
}

interface ItineraryBuilderActions {
  // Plan management
  createNewPlan: (name: string, destination: string, days: number) => void;
  loadPlan: (planId: string) => void;
  savePlan: (changes?: string, createdBy?: string) => void;
  deletePlan: (planId: string) => void;
  updatePlanInfo: (updates: Partial<Pick<ItineraryPlan, 'name' | 'destination' | 'startDate' | 'endDate'>>) => void;
  loadVersion: (version: number) => void; // 載入特定版本

  // Day management
  addDay: () => void;
  removeDay: (dayId: string) => void;
  updateDayTitle: (dayId: string, title: string) => void;

  // Spot management
  addSpotToDay: (dayId: string, spot: Spot, index?: number) => void;
  removeSpotFromDay: (dayId: string, instanceId: string) => void;
  moveSpot: (fromDayId: string, toDayId: string, instanceId: string, newIndex: number) => void;
  reorderSpots: (dayId: string, fromIndex: number, toIndex: number) => void;
  updateSpotTime: (dayId: string, instanceId: string, startTime: string) => void;
  updateSpotNotes: (dayId: string, instanceId: string, notes: string) => void;

  // Filter & search
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: SpotCategory | 'all') => void;
  setSeasonFilter: (season: SeasonType) => void;
  setAudienceFilter: (audiences: string[]) => void;

  // DnD state
  setDragging: (isDragging: boolean, activeId?: string | null) => void;

  // Utilities
  getDayTotalDuration: (dayId: string) => number;
  getFilteredSpots: () => Spot[];
  clearCurrentPlan: () => void;
}

type ItineraryBuilderStore = ItineraryBuilderState & ItineraryBuilderActions;

// ============================================
// Store Implementation (Factory for Config Props)
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 11);

const createEmptyDay = (dayNumber: number): DayPlan => ({
  id: `day_${generateId()}`,
  dayNumber,
  title: `第 ${dayNumber} 天`,
  spots: [],
});

/**
 * Creates a Zustand store for itinerary building, allowing initial configuration
 * of available spots. This addresses the 'Config Props' requirement by making
 * the store's data source injectable.
 */
export const createItineraryBuilderStore = (config: ItineraryBuilderConfig) => {
  return create<ItineraryBuilderStore>()(
    persist(
      (set, get) => ({
        // Initial state
        availableSpots: config.availableSpots, // Initialize with provided config spots
        currentPlan: null,
        searchQuery: '',
        categoryFilter: 'all',
        seasonFilter: 'all',
        audienceFilter: [],
        isDragging: false,
        activeDragId: null,
        savedPlans: [],

        // Plan management
        createNewPlan: (name, destination, days) => {
          const now = new Date().toISOString();
          const newPlan: ItineraryPlan = {
            id: `plan_${generateId()}`,
            name,
            destination,
            startDate: '',
            endDate: '',
            days: Array.from({ length: days }, (_, i) => createEmptyDay(i + 1)),
            createdAt: now,
            updatedAt: now,
          };
          set({ currentPlan: newPlan });
        },

        loadPlan: (planId) => {
          const { savedPlans } = get();
          const plan = savedPlans.find(p => p.id === planId);
          if (plan) {
            set({ currentPlan: { ...plan } });
          }
        },

        savePlan: (changes?: string, createdBy?: string) => {
          const { currentPlan, savedPlans } = get();
          if (!currentPlan) return;

          const now = new Date().toISOString();
          const currentVersion = currentPlan.current_version || 0;
          const newVersion = currentVersion + 1;

          // 創建版本記錄
          const versionRecord: ItineraryVersion = {
            version: newVersion,
            created_at: now,
            created_by: createdBy || '系統使用者',
            changes: changes || '行程更新',
            itinerary_data: {
              days: JSON.parse(JSON.stringify(currentPlan.days)), // 深拷貝
              destination: currentPlan.destination,
              startDate: currentPlan.startDate,
              endDate: currentPlan.endDate,
            },
          };

          const updatedPlan: ItineraryPlan = {
            ...currentPlan,
            updatedAt: now,
            current_version: newVersion,
            versions: [...(currentPlan.versions || []), versionRecord],
          };

          const existingIndex = savedPlans.findIndex(p => p.id === currentPlan.id);
          const newSavedPlans = existingIndex >= 0
            ? savedPlans.map((p, i) => i === existingIndex ? updatedPlan : p)
            : [...savedPlans, updatedPlan];

          set({
            currentPlan: updatedPlan,
            savedPlans: newSavedPlans,
          });
        },

        deletePlan: (planId) => {
          const { savedPlans, currentPlan } = get();
          set({
            savedPlans: savedPlans.filter(p => p.id !== planId),
            currentPlan: currentPlan?.id === planId ? null : currentPlan,
          });
        },

        updatePlanInfo: (updates) => {
          const { currentPlan } = get();
          if (!currentPlan) return;
          set({
            currentPlan: {
              ...currentPlan,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        },

        loadVersion: (version) => {
          const { currentPlan } = get();
          if (!currentPlan || !currentPlan.versions) return;
          
          const versionData = currentPlan.versions.find(v => v.version === version);
          if (versionData) {
            set({
              currentPlan: {
                ...currentPlan,
                days: JSON.parse(JSON.stringify(versionData.itinerary_data.days)),
                destination: versionData.itinerary_data.destination,
                startDate: versionData.itinerary_data.startDate,
                endDate: versionData.itinerary_data.endDate,
              },
            });
          }
        },

        // Day management
        addDay: () => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          const newDayNumber = currentPlan.days.length + 1;
          set({
            currentPlan: {
              ...currentPlan,
              days: [...currentPlan.days, createEmptyDay(newDayNumber)],
              updatedAt: new Date().toISOString(),
            },
          });
        },

        removeDay: (dayId) => {
          const { currentPlan } = get();
          if (!currentPlan || currentPlan.days.length <= 1) return;

          const filteredDays = currentPlan.days
            .filter(d => d.id !== dayId)
            .map((d, i) => ({ ...d, dayNumber: i + 1, title: `第 ${i + 1} 天` }));

          set({
            currentPlan: {
              ...currentPlan,
              days: filteredDays,
              updatedAt: new Date().toISOString(),
            },
          });
        },

        updateDayTitle: (dayId, title) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d =>
                d.id === dayId ? { ...d, title } : d
              ),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        // Spot management
        addSpotToDay: (dayId, spot, index) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          const scheduledSpot: ScheduledSpot = {
            ...spot,
            instanceId: `inst_${generateId()}`,
          };

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d => {
                if (d.id !== dayId) return d;
                const newSpots = [...d.spots];
                if (index !== undefined && index >= 0) {
                  newSpots.splice(index, 0, scheduledSpot);
                } else {
                  newSpots.push(scheduledSpot);
                }
                return { ...d, spots: newSpots };
              }),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        removeSpotFromDay: (dayId, instanceId) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d =>
                d.id === dayId
                  ? { ...d, spots: d.spots.filter(s => s.instanceId !== instanceId) }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        moveSpot: (fromDayId, toDayId, instanceId, newIndex) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          let movedSpot: ScheduledSpot | null = null;

          // Find and remove from source
          const daysAfterRemove = currentPlan.days.map(d => {
            if (d.id !== fromDayId) return d;
            const spotIndex = d.spots.findIndex(s => s.instanceId === instanceId);
            if (spotIndex === -1) return d;
            movedSpot = d.spots[spotIndex];
            return {
              ...d,
              spots: d.spots.filter(s => s.instanceId !== instanceId),
            };
          });

          if (!movedSpot) return;

          // Add to destination
          const daysAfterAdd = daysAfterRemove.map(d => {
            if (d.id !== toDayId) return d;
            const newSpots = [...d.spots];
            newSpots.splice(newIndex, 0, movedSpot!);
            return { ...d, spots: newSpots };
          });

          set({
            currentPlan: {
              ...currentPlan,
              days: daysAfterAdd,
              updatedAt: new Date().toISOString(),
            },
          });
        },

        reorderSpots: (dayId, fromIndex, toIndex) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d => {
                if (d.id !== dayId) return d;
                const newSpots = [...d.spots];
                const [removed] = newSpots.splice(fromIndex, 1);
                newSpots.splice(toIndex, 0, removed);
                return { ...d, spots: newSpots };
              }),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        updateSpotTime: (dayId, instanceId, startTime) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d =>
                d.id === dayId
                  ? {
                      ...d,
                      spots: d.spots.map(s =>
                        s.instanceId === instanceId
                          ? { ...s, startTime }
                          : s
                      ),
                    }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        updateSpotNotes: (dayId, instanceId, notes) => {
          const { currentPlan } = get();
          if (!currentPlan) return;

          set({
            currentPlan: {
              ...currentPlan,
              days: currentPlan.days.map(d =>
                d.id === dayId
                  ? {
                      ...d,
                      spots: d.spots.map(s =>
                        s.instanceId === instanceId
                          ? { ...s, notes }
                          : s
                      ),
                    }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            },
          });
        },

        // Filter & search
        setSearchQuery: (query) => set({ searchQuery: query }),
        setCategoryFilter: (category) => set({ categoryFilter: category }),
        setSeasonFilter: (season) => set({ seasonFilter: season }),
        setAudienceFilter: (audiences) => set({ audienceFilter: audiences }),

        // DnD state
        setDragging: (isDragging, activeId = null) => set({
          isDragging,
          activeDragId: activeId,
        }),

        // Utilities
        getDayTotalDuration: (dayId) => {
          const { currentPlan } = get();
          if (!currentPlan) return 0;
          const day = currentPlan.days.find(d => d.id === dayId);
          if (!day) return 0;
          return day.spots.reduce((sum, spot) => sum + (spot.duration || 0), 0); // Add default 0 for duration
        },

        getFilteredSpots: () => {
          const { searchQuery, categoryFilter, seasonFilter, audienceFilter, availableSpots } = get(); // Use availableSpots from state
          let filtered = availableSpots;

          // Category filtering (category is now an array)
          if (categoryFilter !== 'all') {
            filtered = filtered.filter(s => s.category.includes(categoryFilter));
          }

          // Season filtering (season is now an array like ['春', '夏'])
          if (seasonFilter !== 'all') {
            filtered = filtered.filter(s => {
              // If spot has no season data, show it for all filters
              if (!s.season || s.season.length === 0) return true;
              // If has all 4 seasons, it's year-round
              if (s.season.length === 4) return true;

              switch (seasonFilter) {
                case 'spring':
                  return s.season.includes('春');
                case 'summer':
                  return s.season.includes('夏');
                case 'autumn':
                  return s.season.includes('秋');
                case 'winter':
                  return s.season.includes('冬');
                default:
                  return true;
              }
            });
          }

          // Audience filtering (check if any selected audience matches)
          if (audienceFilter.length > 0) {
            filtered = filtered.filter(s =>
              s.target_audience.some(audience => audienceFilter.includes(audience))
            );
          }

          // Search query filtering
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
              s.name.toLowerCase().includes(query) ||
              s.county.toLowerCase().includes(query) ||
              s.tags.some(t => t.toLowerCase().includes(query)) ||
              s.target_audience.some(a => a.toLowerCase().includes(query))
            );
          }

          return filtered;
        },

        clearCurrentPlan: () => set({ currentPlan: null }),
      }),
      {
        name: 'itinerary-builder-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          savedPlans: state.savedPlans,
          // Don't persist: currentPlan (to avoid stale editing state), filters, drag state, and importantly, availableSpots
          // availableSpots should be provided at store creation, not persisted.
        }),
        version: 1,
      }
    )
  );
};

/**
 * The default (singleton) instance of the Itinerary Builder Store.
 * This is configured with MOCK_SPOTS as its data source.
 * For different data sources, use createItineraryBuilderStore directly.
 */
export const useItineraryBuilderStore = createItineraryBuilderStore({
  availableSpots: MOCK_SPOTS,
});

// ============================================
// Selector Hooks
// ============================================

export const useCurrentPlan = () =>
  useItineraryBuilderStore((state) => state.currentPlan);

export const useDays = () =>
  useItineraryBuilderStore((state) => state.currentPlan?.days ?? []);

export const useFilteredSpots = () =>
  useItineraryBuilderStore((state) => state.getFilteredSpots());

export const useDragState = () =>
  useItineraryBuilderStore((state) => ({
    isDragging: state.isDragging,
    activeDragId: state.activeDragId,
  }));