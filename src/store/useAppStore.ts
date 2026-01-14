import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Booking, TourSession, ItineraryItem } from '../../types';

// ============================================
// Type Definitions
// ============================================

export type UserRole = 'staff' | 'welfare' | 'traveler';

export type ViewKey =
  | 'dashboard' | 'sessions' | 'planner' | 'crm' | 'payments' | 'passport'
  | 'costing' | 'insurance' | 'quotation' | 'operations' | 'expense' | 'chat'
  | 'estimator' | 'map' | 'welfare' | 'builder'
  | 'traveler' | 'itinerary' | 'voting' | 'briefing' | 'addons' | 'footprint';

export type ViewMode = 'edit' | 'proposal' | 'line';

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

// Itinerary Slice Types (預留)
interface ItineraryState {
  items: Record<string, ItineraryItem[]>; // key = dayId
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

// Bookings Slice Types (預留)
interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  filters: {
    status: Booking['status'] | 'all';
    sessionId: string | null;
  };
}

interface BookingsActions {
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  setBookingFilters: (filters: Partial<BookingsState['filters']>) => void;
  clearBookings: () => void;
}

// Sessions Slice Types (預留)
interface SessionsState {
  sessions: TourSession[];
  currentSession: TourSession | null;
  isLoading: boolean;
}

interface SessionsActions {
  setSessions: (sessions: TourSession[]) => void;
  setCurrentSession: (session: TourSession | null) => void;
  updateSession: (id: string, updates: Partial<TourSession>) => void;
}

// Combined Store Type
interface AppStore extends
  AuthState, AuthActions,
  UIState, UIActions,
  ItineraryState, ItineraryActions,
  BookingsState, BookingsActions,
  SessionsState, SessionsActions {
  // Global actions
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
};

const initialSessionsState: SessionsState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
};

// ============================================
// Store Creation
// ============================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ========== Auth State & Actions ==========
      ...initialAuthState,

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
        // Clear localStorage to ensure clean state
        localStorage.removeItem('travelmaster-storage');

        // Reset all state
        set({
          ...initialAuthState,
          ...initialUIState,
          ...initialItineraryState,
          ...initialBookingsState,
          ...initialSessionsState,
        });
      },

      setUserRole: (role) => set({ userRole: role }),

      // ========== UI State & Actions ==========
      ...initialUIState,

      setCurrentView: (view) => set({ currentView: view }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      // ========== Itinerary State & Actions (預留) ==========
      ...initialItineraryState,

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

      // ========== Bookings State & Actions (預留) ==========
      ...initialBookingsState,

      setBookings: (bookings) => set({ bookings }),

      addBooking: (booking) =>
        set((state) => ({ bookings: [...state.bookings, booking] })),

      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
          currentBooking:
            state.currentBooking?.id === id
              ? { ...state.currentBooking, ...updates }
              : state.currentBooking,
        })),

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

      // ========== Sessions State & Actions (預留) ==========
      ...initialSessionsState,

      setSessions: (sessions) => set({ sessions }),

      setCurrentSession: (session) => set({ currentSession: session }),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          currentSession:
            state.currentSession?.id === id
              ? { ...state.currentSession, ...updates }
              : state.currentSession,
        })),

      // ========== Global Actions ==========
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
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not UI transient state
      partialize: (state) => ({
        // Auth - always persist
        isLoggedIn: state.isLoggedIn,
        userRole: state.userRole,
        userId: state.userId,
        userName: state.userName,
        // UI - persist view preference
        currentView: state.currentView,
        isSidebarOpen: state.isSidebarOpen,
        // Don't persist: isMobileMenuOpen, isLoading states
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations here
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            // Add any new fields with defaults
          };
        }
        return persistedState as AppStore;
      },
    }
  )
);

// ============================================
// Selector Hooks (for optimized re-renders)
// ============================================

// Auth selectors
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

// UI selectors
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

// Bookings selectors
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
  }));

// Sessions selectors
export const useSessions = () =>
  useAppStore((state) => ({
    sessions: state.sessions,
    currentSession: state.currentSession,
    setSessions: state.setSessions,
    setCurrentSession: state.setCurrentSession,
    updateSession: state.updateSession,
  }));

// Itinerary selectors
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
