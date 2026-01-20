import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 簡化的類型定義以避免循環依賴
interface ItineraryItem {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
}

interface Booking {
  id: string;
  sessionId: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TourSession {
  id: string;
  code: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  bookedCount: number;
  status: string;
}

// ============================================
// Type Definitions
// ============================================

export type UserRole = 'staff' | 'welfare' | 'traveler';

export type ViewKey =
  | 'dashboard' | 'sessions' | 'planner' | 'crm' | 'payments' | 'passport'
  | 'costing' | 'insurance' | 'quotation' | 'operations' | 'expense' | 'chat'
  | 'estimator' | 'map' | 'welfare' | 'builder'
  | 'traveler' | 'itinerary' | 'voting' | 'briefing' | 'addons' | 'footprint'
  | 'tour-management';

export type ViewMode = 'edit' | 'proposal' | 'line';

// Status State Machine
const STATE_MACHINE = {
  draft: ['soliciting'],
  soliciting: ['guaranteed', 'cancelled'],
  guaranteed: ['departed', 'cancelled'],
  departed: ['completed'],
  cancelled: [],
  completed: []
} as const;

function canTransition(from: any, to: any): boolean {
  return STATE_MACHINE[from]?.includes(to) ?? false;
}

// Audit Log Type
interface AuditLog {
  timestamp: Date;
  action: string;
  prevState: any;
  newState: any;
  userId: string | null;
}

// Auth Slice Types
interface AuthState {
  isLoggedIn: boolean;
  userRole: UserRole;
  userId: string | null;
  userName: string | null;
}

interface AuthActions {
  login: (role: UserRole, userId?: string, userName?: string) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

// UI Slice Types
interface UIState {
  currentView: ViewKey;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
}

interface UIActions {
  setCurrentView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

// Itinerary Slice Types
interface ItineraryState {
  items: Record<string, ItineraryItem[]>;
  selectedSessionId: string | null;
  isLoading: boolean;
}

interface ItineraryActions {
  setItineraryItems: (dayId: string, items: ItineraryItem[]) => void;
  addItineraryItem: (dayId: string, item: ItineraryItem) => void;
  removeItineraryItem: (dayId: string, itemId: string) => void;
  setSelectedSession: (sessionId: string | null) => void;
  clearItinerary: () => void;
}

// Bookings Slice Types
interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  filters: {
    status: Booking['status'] | 'all';
    sessionId: string | null;
  };
  auditLogs: AuditLog[];
}

interface BookingsActions {
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  removeBooking: (id: string) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  setBookingFilters: (filters: Partial<BookingsState['filters']>) => void;
  clearBookings: () => void;
  rollbackBooking: (id: string, prevState: Booking) => void;
}

// Sessions Slice Types
interface SessionsState {
  sessions: TourSession[];
  currentSession: TourSession | null;
  isLoading: boolean;
  auditLogs: AuditLog[];
}

interface SessionsActions {
  setSessions: (sessions: TourSession[]) => void;
  setCurrentSession: (session: TourSession | null) => void;
  updateSession: (id: string, updates: Partial<TourSession>) => Promise<void>;
  rollbackSession: (id: string, prevState: TourSession) => void;
}

// Combined Store Type
interface AppStore extends
  AuthState, AuthActions,
  UIState, UIActions,
  ItineraryState, ItineraryActions,
  BookingsState, BookingsActions,
  SessionsState, SessionsActions {
  resetStore: () => void;
}

// ============================================
// Initial States
// ============================================

const initialAuthState: AuthState = {
  isLoggedIn: false,
  userRole: 'staff',
  userId: null,
  userName: null,
};

const initialUIState: UIState = {
  currentView: 'dashboard',
  isSidebarOpen: true,
  isMobileMenuOpen: false,
};

const initialItineraryState: ItineraryState = {
  items: {},
  selectedSessionId: null,
  isLoading: false,
};

const initialBookingsState: BookingsState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  filters: {
    status: 'all',
    sessionId: null,
  },
  auditLogs: [],
};

const initialSessionsState: SessionsState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  auditLogs: [],
};

// ============================================
// Store Creation
// ============================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      ...initialUIState,
      ...initialItineraryState,
      ...initialBookingsState,
      ...initialSessionsState,

      login: (role, userId, userName) => {
        const defaultView: ViewKey =
          role === 'staff' ? 'dashboard' :
          role === 'welfare' ? 'welfare' : 'traveler';

        set({
          isLoggedIn: true,
          userRole: role,
          userId: userId ?? null,
          userName: userName ?? null,
          currentView: defaultView,
        });
      },

      logout: () => {
        localStorage.removeItem('travelmaster-storage');
        set({
          ...initialAuthState,
          ...initialUIState,
          ...initialItineraryState,
          ...initialBookingsState,
          ...initialSessionsState,
        });
      },

      setUserRole: (role) => set({ userRole: role }),

      setCurrentView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      setItineraryItems: (dayId, items) =>
        set((state) => ({
          items: { ...state.items, [dayId]: items },
        })),

      addItineraryItem: (dayId, item) =>
        set((state) => ({
          items: {
            ...state.items,
            [dayId]: [...(state.items[dayId] || []), item],
          },
        })),

      removeItineraryItem: (dayId, itemId) =>
        set((state) => ({
          items: {
            ...state.items,
            [dayId]: (state.items[dayId] || []).filter((i) => i.id !== itemId),
          },
        })),

      setSelectedSession: (sessionId) => set({ selectedSessionId: sessionId }),
      clearItinerary: () => set({ items: {}, selectedSessionId: null }),

      setBookings: (bookings) => set({ bookings }),
      addBooking: (booking) =>
        set((state) => ({ bookings: [...state.bookings, booking] })),

      updateBooking: async (id, updates) => {
        const prevState = get().bookings.find(b => b.id === id);
        if (!prevState) return;

        if (updates.status && !canTransition(prevState.status as any, updates.status as any)) {
          throw new Error(`Invalid status transition from ${prevState.status} to ${updates.status}`);
        }

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
          currentBooking:
            state.currentBooking?.id === id
              ? { ...state.currentBooking, ...updates }
              : state.currentBooking,
          auditLogs: [...state.auditLogs, {
            timestamp: new Date(),
            action: 'updateBooking',
            prevState,
            newState: { ...prevState, ...updates },
            userId: state.userId
          }]
        }));

        try {
          // Simulate API call
          // await api.updateBooking(id, updates);
        } catch (error) {
          get().rollbackBooking(id, prevState);
          throw error;
        }
      },

      rollbackBooking: (id, prevState) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? prevState : b
          ),
          currentBooking:
            state.currentBooking?.id === id
              ? prevState
              : state.currentBooking,
          auditLogs: [...state.auditLogs, {
            timestamp: new Date(),
            action: 'rollbackBooking',
            prevState: state.bookings.find(b => b.id === id),
            newState: prevState,
            userId: state.userId
          }]
        }));
      },

      removeBooking: (id) =>
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== id),
          currentBooking:
            state.currentBooking?.id === id ? null : state.currentBooking,
        })),

      setCurrentBooking: (booking) => set({ currentBooking: booking }),
      setBookingFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      clearBookings: () =>
        set({
          bookings: [],
          currentBooking: null,
          filters: initialBookingsState.filters,
        }),

      setSessions: (sessions) => set({ sessions }),
      setCurrentSession: (session) => set({ currentSession: session }),

      updateSession: async (id, updates) => {
        const prevState = get().sessions.find(s => s.id === id);
        if (!prevState) return;

        if (updates.status && !canTransition(prevState.status as any, updates.status as any)) {
          throw new Error(`Invalid status transition from ${prevState.status} to ${updates.status}`);
        }

        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          currentSession:
            state.currentSession?.id === id
              ? { ...state.currentSession, ...updates }
              : state.currentSession,
          auditLogs: [...state.auditLogs, {
            timestamp: new Date(),
            action: 'updateSession',
            prevState,
            newState: { ...prevState, ...updates },
            userId: state.userId
          }]
        }));

        try {
          // Simulate API call
          // await api.updateSession(id, updates);
        } catch (error) {
          get().rollbackSession(id, prevState);
          throw error;
        }
      },

      rollbackSession: (id, prevState) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? prevState : s
          ),
          currentSession:
            state.currentSession?.id === id
              ? prevState
              : state.currentSession,
          auditLogs: [...state.auditLogs, {
            timestamp: new Date(),
            action: 'rollbackSession',
            prevState: state.sessions.find(s => s.id === id),
            newState: prevState,
            userId: state.userId
          }]
        }));
      },

      resetStore: () =>
        set({
          ...initialAuthState,
          ...initialUIState,
          ...initialItineraryState,
          ...initialBookingsState,
          ...initialSessionsState,
        }),
    }),
    {
      name: 'travelmaster-storage',
      storage: createJSONStorage(() => {
        // 安全的 localStorage 檢查
        try {
          return localStorage;
        } catch (error) {
          console.warn('localStorage 不可用，使用記憶體儲存:', error);
          // 返回一個簡單的記憶體儲存實現
          const data: Record<string, any> = {};
          const memoryStorage = {
            getItem: (key: string) => {
              const item = data[key];
              return item ? JSON.stringify(item) : null;
            },
            setItem: (key: string, value: string) => {
              try {
                data[key] = JSON.parse(value);
              } catch {
                data[key] = value;
              }
            },
            removeItem: (key: string) => {
              delete data[key];
            }
          };
          return memoryStorage;
        }
      }),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userRole: state.userRole,
        userId: state.userId,
        userName: state.userName,
        currentView: state.currentView,
        isSidebarOpen: state.isSidebarOpen,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
          };
        }
        return persistedState as AppStore;
      },
    }
  )
);

// ============================================
// Selector Hooks
// ============================================

export const useAuth = () =>
  useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    userRole: state.userRole,
    userId: state.userId,
    userName: state.userName,
    login: state.login,
    logout: state.logout,
  }));

export const useIsLoggedIn = () => useAppStore((state) => state.isLoggedIn);
export const useUserRole = () => useAppStore((state) => state.userRole);

export const useUI = () =>
  useAppStore((state) => ({
    currentView: state.currentView,
    isSidebarOpen: state.isSidebarOpen,
    isMobileMenuOpen: state.isMobileMenuOpen,
    setCurrentView: state.setCurrentView,
    toggleSidebar: state.toggleSidebar,
    setMobileMenuOpen: state.setMobileMenuOpen,
  }));

export const useCurrentView = () => useAppStore((state) => state.currentView);

export const useBookings = () =>
  useAppStore((state) => ({
    bookings: state.bookings,
    currentBooking: state.currentBooking,
    isLoading: state.isLoading,
    filters: state.filters,
    setBookings: state.setBookings,
    addBooking: state.addBooking,
    updateBooking: state.updateBooking,
    removeBooking: state.removeBooking,
    setCurrentBooking: state.setCurrentBooking,
    setBookingFilters: state.setBookingFilters,
    rollbackBooking: state.rollbackBooking,
  }));

export const useSessions = () =>
  useAppStore((state) => ({
    sessions: state.sessions,
    currentSession: state.currentSession,
    setSessions: state.setSessions,
    setCurrentSession: state.setCurrentSession,
    updateSession: state.updateSession,
    rollbackSession: state.rollbackSession,
  }));

export const useItinerary = () =>
  useAppStore((state) => ({
    items: state.items,
    selectedSessionId: state.selectedSessionId,
    setItineraryItems: state.setItineraryItems,
    addItineraryItem: state.addItineraryItem,
    removeItineraryItem: state.removeItineraryItem,
    setSelectedSession: state.setSelectedSession,
    clearItinerary: state.clearItinerary,
  }));