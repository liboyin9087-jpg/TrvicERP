import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  TourSession,
  Booking,
  CustomerProfile,
  Passenger
} from '../../types';

// =============================================================================
// 1. Core Type Definitions (Search Result and Filters)
//    These types define the structure of search results and criteria,
//    centralizing definitions for clarity and reusability.
// =============================================================================

/**
 * 搜尋結果類型
 * 定義了可搜尋的實體類別。
 */
export type SearchResultType =
  | 'customer'
  | 'booking'
  | 'session'
  | 'passenger'
  | 'itinerary'; // 兼容未來可能擴展的行程類型

/**
 * 統一的搜尋結果介面
 * 描述了單一搜尋結果的結構。
 */
export interface SearchResult {
  id: string; // 原始實體的唯一識別符
  type: SearchResultType; // 搜尋結果的類型
  title: string; // 搜尋結果的主要標題
  subtitle?: string; // 搜尋結果的次要標題 (例如：訂單號碼、客戶標籤)
  description?: string; // 搜尋結果的詳細描述 (例如：狀態、金額)
  matchedField: string; // 哪一個欄位被匹配到
  score: number; // 相關性分數，用於排序
  data: unknown; // 原始資料物件，方便後續操作 (可根據需要進一步細化類型)
}

/**
 * 搜尋篩選器介面
 * 定義了搜尋時可應用的篩選條件。
 */
export interface SearchFilters {
  types?: SearchResultType[]; // 限制搜尋的類型
  dateRange?: { // 日期範圍篩選
    start: string;
    end: string;
  };
  status?: string[]; // 狀態篩選 (針對訂單、團期等)
  limit?: number; // 限制返回結果的數量
}

// =============================================================================
// 2. Helper Hooks and Utility Functions
//    這些函數是純粹的輔助工具，提供防抖、相似度計算和單一欄位搜尋邏輯，
//    與業務邏輯分離，提高可重用性和測試性。
// =============================================================================

/**
 * useDebounce Hook
 * 在指定延遲後更新值，用於處理輸入頻繁的場景，如搜尋框。
 * @param value 任何類型的值
 * @param delay 延遲毫秒數
 * @returns 延遲後的值
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * calculateSimilarity
 * 計算兩個字串的相似度 (簡化版 Levenshtein 或基於共同字元)。
 * @param str1 字串1
 * @param str2 字串2
 * @returns 相似度分數 (0.0 - 1.0)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const chars1 = new Set(s1);
  const chars2 = new Set(s2);
  const intersection = [...chars1].filter(c => chars2.has(c));
  const union = new Set([...chars1, ...chars2]);

  return intersection.length / union.size;
}

/**
 * searchField
 * 在單一欄位中搜尋匹配項，並根據匹配類型給予分數。
 * @param value 要搜尋的欄位值
 * @param query 搜尋關鍵字
 * @param fieldWeight 該欄位的權重，影響最終分數
 * @returns 包含匹配狀態、分數和實際匹配文字的物件
 */
function searchField(
  value: string | undefined | null,
  query: string,
  fieldWeight: number = 1
): { matched: boolean; score: number; matchedText: string | null } {
  if (!value || !query) return { matched: false, score: 0, matchedText: null };

  const normalizedValue = value.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedValue === normalizedQuery) {
    return { matched: true, score: 100 * fieldWeight, matchedText: value };
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return { matched: true, score: 80 * fieldWeight, matchedText: value };
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return { matched: true, score: 60 * fieldWeight, matchedText: value };
  }

  const similarity = calculateSimilarity(normalizedValue, normalizedQuery);
  if (similarity > 0.5) {
    return { matched: true, score: similarity * 40 * fieldWeight, matchedText: value };
  }

  return { matched: false, score: 0, matchedText: null };
}

// =============================================================================
// 3. Specific Search Functions
//    這些函數處理特定資料類型（如客戶、訂單）的搜尋邏輯。
//    它們是純函數，只負責接收資料並返回相關結果，不涉及狀態管理。
// =============================================================================

/**
 * searchCustomers
 * 搜尋客戶資料。
 * @param customers 客戶資料陣列
 * @param query 搜尋關鍵字
 * @param filters 篩選條件
 * @returns 匹配的搜尋結果陣列
 */
function searchCustomers(
  customers: CustomerProfile[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  // 如果篩選器明確排除了此類型，則不執行搜尋
  if (filters?.types && !filters.types.includes('customer')) {
    return [];
  }

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

    // 可以添加更多客戶相關欄位的搜尋邏輯...

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

/**
 * searchBookings
 * 搜尋訂單資料。
 * @param bookings 訂單資料陣列
 * @param query 搜尋關鍵字
 * @param filters 篩選條件
 * @returns 匹配的搜尋結果陣列
 */
function searchBookings(
  bookings: Booking[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  if (filters?.types && !filters.types.includes('booking')) {
    return [];
  }

  const results: SearchResult[] = [];
  for (const booking of bookings) {
    // 狀態過濾 (在計算分數前執行，避免不必要的計算)
    if (filters?.status?.length && !filters.status.includes(booking.status)) {
      continue;
    }

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

    // 可以添加更多訂單相關欄位的搜尋邏輯...

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

/**
 * searchSessions
 * 搜尋團期資料。
 * @param sessions 團期資料陣列
 * @param query 搜尋關鍵字
 * @param filters 篩選條件
 * @returns 匹配的搜尋結果陣列
 */
function searchSessions(
  sessions: TourSession[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  if (filters?.types && !filters.types.includes('session')) {
    return [];
  }

  const results: SearchResult[] = [];
  for (const session of sessions) {
    // 日期範圍過濾 (在計算分數前執行)
    if (filters?.dateRange) {
      const sessionStart = new Date(session.start_date);
      const filterStart = new Date(filters.dateRange.start);
      const filterEnd = new Date(filters.dateRange.end);

      if (sessionStart < filterStart || sessionStart > filterEnd) {
        continue;
      }
    }

    // 狀態過濾 (在計算分數前執行)
    if (filters?.status?.length && !filters.status.includes(session.status)) {
      continue;
    }

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

    // 可以添加更多團期相關欄位的搜尋邏輯...

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

/**
 * searchPassengers
 * 搜尋旅客資料。
 * @param passengers 旅客資料陣列
 * @param query 搜尋關鍵字
 * @param filters 篩選條件
 * @returns 匹配的搜尋結果陣列
 */
function searchPassengers(
  passengers: Passenger[],
  query: string,
  filters?: SearchFilters
): SearchResult[] {
  if (filters?.types && !filters.types.includes('passenger')) {
    return [];
  }

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

    // 可以添加更多旅客相關欄位的搜尋邏輯...

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

// =============================================================================
// 4. Combined Search Orchestration (Internal Helper)
//    此函數負責協調對所有數據類型的搜尋，並統一處理排序和限制結果數量。
//    它是一個純函數，接受所有必要的數據和參數。
// =============================================================================

/**
 * AllSearchableData
 * 聚合所有可供全局搜尋的資料來源。
 * 此介面清晰地定義了 `useGlobalSearch` Hook 所需的全部數據依賴。
 */
interface AllSearchableData {
  customers: CustomerProfile[];
  bookings: Booking[];
  sessions: TourSession[];
  passengers: Passenger[];
  // 可以擴展其他資料類型，例如 itineraries: Itinerary[];
}

/**
 * performCombinedLocalSearch
 * 執行所有本地資料來源的組合搜尋。
 * 這將複雜的搜尋協調邏輯從主 Hook 中分離出來，使其更專注於狀態管理。
 *
 * @param query 搜尋關鍵字
 * @param filters 搜尋篩選器
 * @param data 包含所有可搜尋資料的物件
 * @param minQueryLength 觸發搜尋的最小查詢長度
 * @param maxResults 最大結果數
 * @returns 排序並限制數量後的搜尋結果陣列
 */
function performCombinedLocalSearch(
  query: string,
  filters: SearchFilters,
  data: AllSearchableData,
  minQueryLength: number,
  maxResults: number
): SearchResult[] {
  if (!query || query.length < minQueryLength) {
    return [];
  }

  const allResults: SearchResult[] = [];
  // 確定要搜尋的類型，如果未指定則搜尋所有已知類型
  const typesToSearch = filters.types || ['customer', 'booking', 'session', 'passenger', 'itinerary'];

  // 根據配置和可用數據，呼叫對應的搜尋函數
  if (typesToSearch.includes('customer') && data.customers) {
    allResults.push(...searchCustomers(data.customers, query, filters));
  }
  if (typesToSearch.includes('booking') && data.bookings) {
    allResults.push(...searchBookings(data.bookings, query, filters));
  }
  if (typesToSearch.includes('session') && data.sessions) {
    allResults.push(...searchSessions(data.sessions, query, filters));
  }
  if (typesToSearch.includes('passenger') && data.passengers) {
    allResults.push(...searchPassengers(data.passengers, query, filters));
  }
  // 未來可在此處添加 'itinerary' 或其他類型資料的搜尋調用

  // 對所有結果進行排序 (分數高者優先) 並限制數量
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, filters.limit || maxResults);
}

// =============================================================================
// 5. Hook Configuration Interface
//    這是實現 Kintone 獨立性的關鍵。所有外部依賴和配置都應由此介面傳入。
// =============================================================================

/**
 * UseGlobalSearchConfig
 * 全局搜尋 Hook 的配置介面。
 * 包含了運作所需的所有選項和資料來源。
 */
export interface UseGlobalSearchConfig {
  debounceMs?: number; // 搜尋防抖延遲時間 (毫秒)，預設 300ms
  minQueryLength?: number; // 觸發搜尋的最小查詢字串長度，預設 2
  maxResults?: number; // 最多返回的搜尋結果數量，預設 50
  initialFilters?: SearchFilters; // 初始篩選條件，預設為空物件

  // ==== 資料來源配置 (實現 Kintone 獨立性：移除全域 Store 依賴) ====
  // 這些屬性必須由外部提供，確保 Hook 的獨立性和可測試性。
  customerData: CustomerProfile[]; // 客戶資料
  bookingData: Booking[];         // 訂單資料
  tourSessionData: TourSession[]; // 團期資料
  passengerData: Passenger[];     // 旅客資料
  // 可以擴展，例如：
  // fetchRemoteData?: (query: string, filters: SearchFilters, signal: AbortSignal) => Promise<SearchResult[]>;
}

// =============================================================================
// 6. Main Hook: useGlobalSearch
//    此 Hook 負責管理搜尋的 UI 狀態、觸發搜尋邏輯、處理防抖和錯誤。
//    它通過組合上述純函數來實現其功能。
// =============================================================================

/**
 * 全局搜尋 Hook
 * 提供跨模組的統一搜尋功能，支援客戶、訂單、團期、行程等。
 * 依賴透過 Config Props 傳入的資料，而非全域 Store，確保模組獨立性。
 *
 * @param config UseGlobalSearchConfig 配置物件，包含所有數據和行為參數。
 * @returns 包含搜尋狀態、結果和操作的物件。
 */
export function useGlobalSearch(config: UseGlobalSearchConfig) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 50,
    initialFilters = {},
    customerData,
    bookingData,
    tourSessionData,
    passengerData,
  } = config;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 對搜尋關鍵字進行防抖處理，優化性能
  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize所有可搜尋數據，作為核心搜尋邏輯的穩定依賴
  const allSearchableData = useMemo(() => ({
    customers: customerData,
    bookings: bookingData,
    sessions: tourSessionData,
    passengers: passengerData,
  }), [customerData, bookingData, tourSessionData, passengerData]);

  /**
   * performSearch
   * 執行同步或異步的搜尋操作。
   * 此函數用於在需要時手動觸發搜尋，例如點擊搜尋按鈕。
   * 它會管理搜尋狀態 (isSearching) 和錯誤。
   *
   * @param searchQuery 要搜尋的關鍵字。
   * @param searchFilters 應用的篩選條件，會與當前 filters 合併。
   * @returns 搜尋結果陣列。
   */
  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}): Promise<SearchResult[]> => {
      // 檢查查詢長度，不符合則直接返回空
      if (!searchQuery || searchQuery.length < minQueryLength) {
        setIsSearching(false); // 確保狀態正確
        return [];
      }

      // 取消上一個進行中的搜尋 (主要針對潛在的遠端異步搜尋)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;

      setIsSearching(true);
      setError(null);

      try {
        // 執行本地資料的組合搜尋
        const localResults = performCombinedLocalSearch(
          searchQuery,
          { ...filters, ...searchFilters }, // 合併當前 filters 和傳入的 searchFilters
          allSearchableData,
          minQueryLength,
          maxResults
        );

        // TODO: 如果有遠端 API 搜尋需求，可以在此處加入異步呼叫邏輯
        // if (config.fetchRemoteData) {
        //   const remoteResults = await config.fetchRemoteData(searchQuery, { ...filters, ...searchFilters }, newAbortController.signal);
        //   combinedResults = [...localResults, ...remoteResults];
        // }

        const combinedResults = localResults; // 目前只包含本地搜尋結果

        // 再次排序並限制數量，確保最終結果符合要求
        const sortedResults = combinedResults
          .sort((a, b) => b.score - a.score)
          .slice(0, searchFilters.limit || maxResults);

        return sortedResults;
      } catch (err) {
        // 處理搜尋被取消的情況
        if (err instanceof Error && err.name === 'AbortError') {
          return []; // 搜尋被取消，不報錯，返回空結果
        }
        // 處理其他錯誤
        const errorMessage = err instanceof Error ? err.message : '搜尋發生錯誤';
        setError(errorMessage);
        return [];
      } finally {
        setIsSearching(false);
        // 僅當當前控制器完成其生命週期時才清理引用，避免過早清空
        if (abortControllerRef.current === newAbortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [allSearchableData, filters, minQueryLength, maxResults] // 依賴項應包含所有引用的外部值
  );

  /**
   * results
   * 自動搜尋結果，響應於防抖後的查詢字串和篩選條件的變化。
   * 使用 useMemo 進行性能優化，避免不必要的重複計算。
   */
  const results = useMemo(() => {
    // 調用分離的組合搜尋邏輯
    return performCombinedLocalSearch(
      debouncedQuery,
      filters,
      allSearchableData,
      minQueryLength,
      maxResults
    );
  }, [debouncedQuery, filters, allSearchableData, minQueryLength, maxResults]); // 確保所有依賴項都包含在內

  /**
   * clearSearch
   * 清除當前的搜尋查詢、篩選器和錯誤狀態。
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters(initialFilters); // 重置為 Hook 的初始篩選器
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // 取消任何進行中的搜尋
      abortControllerRef.current = null;
    }
  }, [initialFilters]); // 依賴初始篩選器

  /**
   * getSuggestions
   * 根據部分查詢字串生成搜尋建議。
   *
   * @param partialQuery 部分查詢字串。
   * @returns 建議字串的陣列。
   */
  const getSuggestions = useCallback((partialQuery: string): string[] => {
    if (!partialQuery || partialQuery.length < 1) return [];

    const suggestions = new Set<string>();
    const normalizedPartialQuery = partialQuery.toLowerCase();

    // 從所有可搜尋數據中收集建議
    allSearchableData.sessions.forEach((s) => {
      if (s.group_number?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(s.group_number);
      }
      if (s.tour_leader_name?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(s.tour_leader_name);
      }
      // 添加其他相關欄位的建議
    });

    allSearchableData.bookings.forEach((b) => {
      if (b.customer_name?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(b.customer_name);
      }
      if (b.receipt_number?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(b.receipt_number);
      }
    });

    allSearchableData.customers.forEach((c) => {
      if (c.name?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(c.name);
      }
      c.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(normalizedPartialQuery)) {
          suggestions.add(tag);
        }
      });
    });

    allSearchableData.passengers.forEach((p) => {
      if (p.name?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(p.name);
      }
      if (p.english_name?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(p.english_name);
      }
      if (p.passport_number?.toLowerCase().includes(normalizedPartialQuery)) {
        suggestions.add(p.passport_number);
      }
    });

    return Array.from(suggestions).slice(0, 5); // 限制建議數量
  }, [allSearchableData]); // 依賴所有可搜尋數據

  // 返回 Hook 的 API
  return {
    // State: 當前搜尋狀態和數據
    query,
    results,
    isSearching,
    error,
    filters,

    // Actions: 操作搜尋的方法
    setQuery,
    setFilters,
    performSearch, // 用於手動觸發搜尋 (例如，點擊搜尋按鈕)
    clearSearch,
    getSuggestions,

    // Computed Properties: 衍生狀態
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}