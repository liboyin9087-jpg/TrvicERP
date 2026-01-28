import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Booking, TourSession, ItineraryItem } from '../../types'; // Assuming these types are defined externally

// ============================================
// Global/Common Type Definitions
// These types are generally applicable across different parts of the application
// and are kept here for centralized management or if they bridge multiple stores.
// ============================================

export type UserRole = 'staff' | 'welfare' | 'traveler';

export type ViewKey =
  | 'dashboard' | 'sessions' | 'planner' | 'crm' | 'payments' | 'passport'
  | 'costing' | 'insurance' | 'quotation' | 'operations' | 'expense' | 'chat'
  | 'estimator' | 'map' | 'welfare' | 'builder'
  | 'traveler' | 'itinerary' | 'voting' | 'briefing' | 'addons' | 'footprint'
  | 'tour-management' | 'ai-copilot' | 'proposal-engine' | 'client-portal'
  | 'corporate-crm';

export type ViewMode = 'edit' | 'proposal' | 'line'; // Not used in current store logic, but kept for completeness


// ============================================
// Auth Store Module
// Manages user authentication status and related information.
// Addresses Single Responsibility Principle by encapsulating auth logic.
// ============================================

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
  resetAuth: () => void; // Action to reset only Auth state
}

type AuthStore = AuthState & AuthActions;

const initialAuthState: AuthState = {
  isLoggedIn: false,
  userRole: 'staff',
  userId: null,
  userName: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialAuthState,

      login: (role, userId, userName) => {
        set({
          isLoggedIn: true,
          userRole: role,
          userId: userId ?? null,
          userName: userName ?? null,
        });
        // Note: The original 'login' also set 'currentView'. This violates SRP.
        // UI concerns should be handled by the UI store or a coordinating component.
        // If a default view should be set on login, the UI store should subscribe
        // to auth state changes or be explicitly updated by the login component.
      },

      logout: () => {
        // This action primarily resets the authentication state.
        // For a full application reset (e.g., clearing all other stores and localStorage),
        // use the `globalResetApp` function.
        set(initialAuthState);
      },

      setUserRole: (role) => set({ userRole: role }),

      resetAuth: () => set(initialAuthState),
    }),
    {
      name: 'trvic-auth-storage', // Unique name for this store's persistence
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userRole: state.userRole,
        userId: state.userId,
        userName: state.userName,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations here if AuthState structure changes
        return persistedState as AuthStore;
      },
    }
  )
);

// Auth selectors for optimized re-renders
export const useAuth = () => useAuthStore((state) => ({
  isLoggedIn: state.isLoggedIn,
  userRole: state.userRole,
  userId: state.userId,
  userName: state.userName,
  login: state.login,
  logout: state.logout,
  setUserRole: state.setUserRole,
}));

export const useIsLoggedIn = () => useAuthStore((state) => state.isLoggedIn);
export const useUserRole = () => useAuthStore((state) => state.userRole);


// ============================================
// UI Store Module
// Manages application UI state (e.g., current view, sidebar visibility).
// Addresses Single Responsibility Principle by encapsulating UI logic.
// ============================================

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
  resetUI: () => void; // Action to reset only UI state
}

type UIStore = UIState & UIActions;

const initialUIState: UIState = {
  currentView: 'dashboard',
  isSidebarOpen: true,
  isMobileMenuOpen: false,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialUIState,

      setCurrentView: (view) => set({ currentView: view }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      resetUI: () => set(initialUIState),
    }),
    {
      name: 'trvic-ui-storage', // Unique name for this store's persistence
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist view preference and sidebar state, but not transient mobile menu state
        currentView: state.currentView,
        isSidebarOpen: state.isSidebarOpen,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations here if UIState structure changes
        return persistedState as UIStore;
      },
    }
  )
);

// UI selectors for optimized re-renders
export const useUI = () =>
  useUIStore((state) => ({
    currentView: state.currentView,
    isSidebarOpen: state.isSidebarOpen,
    isMobileMenuOpen: state.isMobileMenuOpen,
    setCurrentView: state.setCurrentView,
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen,
    setMobileMenuOpen: state.setMobileMenuOpen,
  }));

export const useCurrentView = () => useUIStore((state) => state.currentView);


// ============================================
// Itinerary Store Module
// Manages itinerary-related data.
// Addresses Single Responsibility Principle.
// ============================================

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
  resetItinerary: () => void; // Action to reset only Itinerary state
}

type ItineraryStore = ItineraryState & ItineraryActions;

const initialItineraryState: ItineraryState = {
  items: {},
  selectedSessionId: null,
  isLoading: false,
};

// Itinerary state is typically fetched per-session/tour and not globally persisted across sessions.
export const useItineraryStore = create<ItineraryStore>()((set) => ({
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

  resetItinerary: () => set(initialItineraryState),
}));

// Itinerary selectors for optimized re-renders
export const useItinerary = () =>
  useItineraryStore((state) => ({
    items: state.items,
    selectedSessionId: state.selectedSessionId,
    setItineraryItems: state.setItineraryItems,
    addItineraryItem: state.addItineraryItem,
    removeItineraryItem: state.removeItineraryItem,
    setSelectedSession: state.setSelectedSession,
    clearItinerary: state.clearItinerary,
  }));


// ============================================
// Bookings Store Module
// Manages booking-related data.
// Addresses Single Responsibility Principle.
// ============================================

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
  resetBookings: () => void; // Action to reset only Bookings state
}

type BookingsStore = BookingsState & BookingsActions;

const initialBookingsState: BookingsState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  filters: {
    status: 'all',
    sessionId: null,
  },
};

// Bookings state is typically fetched on demand and not globally persisted across sessions.
export const useBookingsStore = create<BookingsStore>()((set) => ({
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

  resetBookings: () => set(initialBookingsState),
}));

// Bookings selectors for optimized re-renders
export const useBookings = () =>
  useBookingsStore((state) => ({
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


// ============================================
// Sessions Store Module
// Manages tour session-related data.
// Addresses Single Responsibility Principle.
// ============================================

interface SessionsState {
  sessions: TourSession[];
  currentSession: TourSession | null;
  isLoading: boolean;
}

interface SessionsActions {
  setSessions: (sessions: TourSession[]) => void;
  setCurrentSession: (session: TourSession | null) => void;
  updateSession: (id: string, updates: Partial<TourSession>) => void;
  resetSessions: () => void; // Action to reset only Sessions state
}

type SessionsStore = SessionsState & SessionsActions;

const initialSessionsState: SessionsState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
};

// Sessions state is typically fetched on demand and not globally persisted across sessions.
export const useSessionsStore = create<SessionsStore>()((set) => ({
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

  resetSessions: () => set(initialSessionsState),
}));

// Sessions selectors for optimized re-renders
export const useSessions = () =>
  useSessionsStore((state) => ({
    sessions: state.sessions,
    currentSession: state.currentSession,
    setSessions: state.setSessions,
    setCurrentSession: state.setCurrentSession,
    updateSession: state.updateSession,
  }));


// ============================================
// Global Application Reset Function
// This function orchestrates the reset of all relevant stores
// and clears their persisted state from localStorage.
// It is intended for scenarios like a complete user logout or
// resetting the application to a clean initial state.
// ============================================

export const globalResetApp = () => {
  // Explicitly clear all localStorage items managed by persist middleware
  localStorage.removeItem('trvic-auth-storage');
  localStorage.removeItem('trvic-ui-storage');
  // Add other store names here if they use persistence

  // Call the reset action for each individual store
  useAuthStore.getState().resetAuth();
  useUIStore.getState().resetUI();
  useItineraryStore.getState().resetItinerary();
  useBookingsStore.getState().resetBookings();
  useSessionsStore.getState().resetSessions();

  console.log('Application state has been globally reset.');
};

// The original `useAppStore` has been refactored into multiple,
// more focused Zustand stores. This adheres to the Single Responsibility Principle.
// Components should now import and use the specific store(s) they need (e.g., `useAuthStore`, `useUIStore`)
// and use their respective selectors for optimized re-renders.
// This structure promotes better modularity and reduces unnecessary re-renders.
// The "Kintone independence" and "Config Props" rules apply to how components
// consume these stores or receive data, not directly to this store definition file.
// UI/design rules (Tailwind tokens, Card structure) are also not applicable here.