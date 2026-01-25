/**
 * 全局搜尋 Hook
 * 提供跨模組的統一搜尋功能，支援客戶、訂單、團期、行程等
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type {
  TourSession,
  Booking,
  CustomerProfile,
  Passenger
} from '../../types';

// 搜尋結果類型
export type SearchResultType =
  | 'customer'
  | 'booking'
  | 'session'
  | 'passenger'
  | 'itinerary';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  matchedField: string;
  score: number; // 相關性分數
  data: unknown; // 原始資料
}

export interface SearchFilters {
  types?: SearchResultType[];
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  limit?: number;
}

interface UseGlobalSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 文字相似度計算 (簡化版 Levenshtein)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // 計算共同字元
  const chars1 = new Set(s1);
  const chars2 = new Set(s2);
  const intersection = [...chars1].filter(c => chars2.has(c));
  const union = new Set([...chars1, ...chars2]);

  return intersection.length / union.size;
}

// 搜尋單一欄位
function searchField(
  value: string | undefined | null,
  query: string,
  fieldWeight: number = 1
): { matched: boolean; score: number } {
  if (!value || !query) return { matched: false, score: 0 };

  const normalizedValue = value.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  // 完全匹配
  if (normalizedValue === normalizedQuery) {
    return { matched: true, score: 100 * fieldWeight };
  }

  // 開頭匹配
  if (normalizedValue.startsWith(normalizedQuery)) {
    return { matched: true, score: 80 * fieldWeight };
  }

  // 包含匹配
  if (normalizedValue.includes(normalizedQuery)) {
    return { matched: true, score: 60 * fieldWeight };
  }

  // 模糊匹配 (相似度 > 0.5)
  const similarity = calculateSimilarity(normalizedValue, normalizedQuery);
  if (similarity > 0.5) {
    return { matched: true, score: similarity * 40 * fieldWeight };
  }

  return { matched: false, score: 0 };
}

// 搜尋客戶
function searchCustomers(
  customers: CustomerProfile[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const customer of customers) {
    let totalScore = 0;
    let matchedField = '';

    // 搜尋姓名 (權重最高)
    const nameMatch = searchField(customer.name, query, 2);
    if (nameMatch.matched) {
      totalScore += nameMatch.score;
      matchedField = '姓名';
    }

    // 搜尋標籤
    const tagMatch = customer.tags?.some(tag => {
      const m = searchField(tag, query, 1);
      if (m.matched) totalScore += m.score;
      return m.matched;
    });
    if (tagMatch && !matchedField) matchedField = '標籤';

    if (totalScore > 0) {
      results.push({
        id: customer.id,
        type: 'customer',
        title: customer.name,
        subtitle: customer.tags?.join(', '),
        description: `消費總額: NT$ ${customer.total_spend?.toLocaleString() || 0}`,
        matchedField,
        score: totalScore,
        data: customer,
      });
    }
  }

  return results;
}

// 搜尋訂單
function searchBookings(
  bookings: Booking[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const booking of bookings) {
    let totalScore = 0;
    let matchedField = '';

    // 搜尋客戶姓名
    const nameMatch = searchField(booking.customer_name, query, 2);
    if (nameMatch.matched) {
      totalScore += nameMatch.score;
      matchedField = '客戶姓名';
    }

    // 搜尋收據號碼
    const receiptMatch = searchField(booking.receipt_number, query, 1.5);
    if (receiptMatch.matched) {
      totalScore += receiptMatch.score;
      if (!matchedField) matchedField = '收據號碼';
    }

    // 搜尋電子郵件
    const emailMatch = searchField(booking.email, query, 1);
    if (emailMatch.matched) {
      totalScore += emailMatch.score;
      if (!matchedField) matchedField = '電子郵件';
    }

    // 狀態過濾
    if (filters?.status?.length && !filters.status.includes(booking.status)) {
      continue;
    }

    if (totalScore > 0) {
      results.push({
        id: booking.id,
        type: 'booking',
        title: booking.customer_name,
        subtitle: booking.receipt_number || booking.id,
        description: `狀態: ${booking.status} | 金額: NT$ ${booking.total_amount?.toLocaleString() || 0}`,
        matchedField,
        score: totalScore,
        data: booking,
      });
    }
  }

  return results;
}

// 搜尋團期
function searchSessions(
  sessions: TourSession[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const session of sessions) {
    let totalScore = 0;
    let matchedField = '';

    // 搜尋團號
    const groupNumberMatch = searchField(session.group_number, query, 2);
    if (groupNumberMatch.matched) {
      totalScore += groupNumberMatch.score;
      matchedField = '團號';
    }

    // 搜尋系列 ID
    const seriesMatch = searchField(session.series_id, query, 1);
    if (seriesMatch.matched) {
      totalScore += seriesMatch.score;
      if (!matchedField) matchedField = '系列';
    }

    // 搜尋領隊姓名
    const leaderMatch = searchField(session.tour_leader_name, query, 1.5);
    if (leaderMatch.matched) {
      totalScore += leaderMatch.score;
      if (!matchedField) matchedField = '領隊';
    }

    // 日期範圍過濾
    if (filters?.dateRange) {
      const sessionStart = new Date(session.start_date);
      const filterStart = new Date(filters.dateRange.start);
      const filterEnd = new Date(filters.dateRange.end);

      if (sessionStart < filterStart || sessionStart > filterEnd) {
        continue;
      }
    }

    // 狀態過濾
    if (filters?.status?.length && !filters.status.includes(session.status)) {
      continue;
    }

    if (totalScore > 0) {
      results.push({
        id: session.id,
        type: 'session',
        title: session.group_number || session.id,
        subtitle: `${session.start_date} ~ ${session.end_date}`,
        description: `人數: ${session.current_pax}/${session.max_pax} | 狀態: ${session.status}`,
        matchedField,
        score: totalScore,
        data: session,
      });
    }
  }

  return results;
}

// 搜尋旅客
function searchPassengers(
  passengers: Passenger[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const passenger of passengers) {
    let totalScore = 0;
    let matchedField = '';

    // 搜尋姓名 (中文)
    const nameMatch = searchField(passenger.name, query, 2);
    if (nameMatch.matched) {
      totalScore += nameMatch.score;
      matchedField = '姓名';
    }

    // 搜尋英文姓名
    const englishNameMatch = searchField(passenger.english_name, query, 1.8);
    if (englishNameMatch.matched) {
      totalScore += englishNameMatch.score;
      if (!matchedField) matchedField = '英文姓名';
    }

    // 搜尋護照號碼
    const passportMatch = searchField(passenger.passport_number, query, 1.5);
    if (passportMatch.matched) {
      totalScore += passportMatch.score;
      if (!matchedField) matchedField = '護照號碼';
    }

    // 搜尋身分證
    const idMatch = searchField(passenger.personal_id, query, 1.5);
    if (idMatch.matched) {
      totalScore += idMatch.score;
      if (!matchedField) matchedField = '身分證';
    }

    if (totalScore > 0) {
      results.push({
        id: passenger.id,
        type: 'passenger',
        title: passenger.name,
        subtitle: passenger.english_name,
        description: `護照: ${passenger.passport_number || '未登記'}`,
        matchedField,
        score: totalScore,
        data: passenger,
      });
    }
  }

  return results;
}

/**
 * 全局搜尋 Hook
 */
export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 50,
  } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 從 store 取得資料 (這裡用空陣列模擬，實際應連接到各模組的 store)
  const { sessions, bookings } = useAppStore((state) => ({
    sessions: state.sessions || [],
    bookings: state.bookings || [],
  }));

  // 執行搜尋
  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}): Promise<SearchResult[]> => {
      if (!searchQuery || searchQuery.length < minQueryLength) {
        return [];
      }

      // 取消之前的搜尋
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const allResults: SearchResult[] = [];
        const typesToSearch = searchFilters.types || ['customer', 'booking', 'session', 'passenger'];

        // 搜尋各類型
        if (typesToSearch.includes('session')) {
          allResults.push(...searchSessions(sessions, searchQuery, searchFilters));
        }

        if (typesToSearch.includes('booking')) {
          allResults.push(...searchBookings(bookings, searchQuery, searchFilters));
        }

        // 這裡可以加入從 API 取得客戶和旅客資料的邏輯
        // const customers = await fetchCustomers();
        // const passengers = await fetchPassengers();

        // 按分數排序並限制數量
        const sortedResults = allResults
          .sort((a, b) => b.score - a.score)
          .slice(0, searchFilters.limit || maxResults);

        return sortedResults;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return [];
        }
        const errorMessage = err instanceof Error ? err.message : '搜尋發生錯誤';
        setError(errorMessage);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [sessions, bookings, minQueryLength, maxResults]
  );

  // 自動搜尋結果
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      return [];
    }
    // 同步版本的搜尋 (用於顯示)
    const allResults: SearchResult[] = [];
    const typesToSearch = filters.types || ['customer', 'booking', 'session', 'passenger'];

    if (typesToSearch.includes('session')) {
      allResults.push(...searchSessions(sessions, debouncedQuery, filters));
    }

    if (typesToSearch.includes('booking')) {
      allResults.push(...searchBookings(bookings, debouncedQuery, filters));
    }

    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, filters.limit || maxResults);
  }, [debouncedQuery, filters, sessions, bookings, minQueryLength, maxResults]);

  // 清除搜尋
  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters({});
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 取得搜尋建議
  const getSuggestions = useCallback((partialQuery: string): string[] => {
    if (!partialQuery || partialQuery.length < 1) return [];

    const suggestions = new Set<string>();

    // 從現有資料取得建議
    sessions.forEach((s) => {
      if (s.group_number?.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(s.group_number);
      }
      if (s.tour_leader_name?.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(s.tour_leader_name);
      }
    });

    bookings.forEach((b) => {
      if (b.customer_name?.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(b.customer_name);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [sessions, bookings]);

  return {
    // State
    query,
    results,
    isSearching,
    error,
    filters,

    // Actions
    setQuery,
    setFilters,
    performSearch,
    clearSearch,
    getSuggestions,

    // Computed
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}

export default useGlobalSearch;
