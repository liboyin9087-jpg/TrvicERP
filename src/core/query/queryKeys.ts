/**
 * React Query Key 工廠
 * React Query Key Factory - 統一管理所有 Query Keys
 */

/**
 * Query Keys 工廠函數
 * 確保所有 Query Keys 的一致性
 */
export const queryKeys = {
  // 客戶相關
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    profiles: () => [...queryKeys.customers.all, 'profile'] as const,
    profile: (id: string) => [...queryKeys.customers.profiles(), id] as const,
    interactions: (customerId: string) => 
      [...queryKeys.customers.detail(customerId), 'interactions'] as const,
    search: (keyword: string) => 
      [...queryKeys.customers.all, 'search', keyword] as const,
  },

  // 訂單相關
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // 報價相關
  quotations: {
    all: ['quotations'] as const,
    lists: () => [...queryKeys.quotations.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.quotations.lists(), filters] as const,
    details: () => [...queryKeys.quotations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quotations.details(), id] as const,
    versions: (id: string) => 
      [...queryKeys.quotations.detail(id), 'versions'] as const,
  },

  // 團次相關
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.sessions.lists(), filters] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    byTour: (tourId: string) => 
      [...queryKeys.sessions.all, 'tour', tourId] as const,
  },

  // 行程相關
  tours: {
    all: ['tours'] as const,
    lists: () => [...queryKeys.tours.all, 'list'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.tours.lists(), filters] as const,
    details: () => [...queryKeys.tours.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tours.details(), id] as const,
  },

  // 行程安排相關
  itineraries: {
    all: ['itineraries'] as const,
    detail: (sessionId: string) => 
      [...queryKeys.itineraries.all, sessionId] as const,
    versions: (sessionId: string) => 
      [...queryKeys.itineraries.detail(sessionId), 'versions'] as const,
  },

  // 報表相關
  reports: {
    all: ['reports'] as const,
    revenue: (filters?: Record<string, any>) => 
      [...queryKeys.reports.all, 'revenue', filters] as const,
    customers: (filters?: Record<string, any>) => 
      [...queryKeys.reports.all, 'customers', filters] as const,
    teams: (filters?: Record<string, any>) => 
      [...queryKeys.reports.all, 'teams', filters] as const,
  },
} as const;
