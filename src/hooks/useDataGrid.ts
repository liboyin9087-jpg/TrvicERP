import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ============================================
// Core Data Grid Interfaces
// ============================================

/**
 * Represents the current pagination state.
 */
export interface PaginationState {
  /** The current page index, 0-indexed. */
  pageIndex: number;
  /** The number of items per page. */
  pageSize: number;
  /** The total number of items available (across all pages). */
  total: number;
}

/**
 * Represents the current sorting state.
 */
export interface SortState {
  /** The field by which to sort. Null if no sorting is applied. */
  field: string | null;
  /** The sort order: "asc" for ascending, "desc" for descending. Null if no sorting is applied. */
  order: "asc" | "desc" | null;
}

/**
 * Represents the current filtering state.
 * Keys are filterable fields, values are the filter criteria.
 */
export interface FilterState {
  [key: string]: any; // e.g., { status: 'active', searchText: 'test' }
}

/**
 * Parameters passed to the data fetching function (`queryFn`).
 */
export interface QueryParams {
  /** Pagination parameters for the query. */
  pagination?: {
    offset: number; // Start index for data retrieval
    limit: number; // Maximum number of items to retrieve
  };
  /** Sorting parameters for the query. */
  sorting?: {
    field: string;
    order: "asc" | "desc";
  };
  /** Filtering parameters for the query. */
  filters?: FilterState;
}

/**
 * The expected result structure from the data fetching function (`queryFn`).
 */
export interface QueryResult<T> {
  /** The array of data items for the current page/query. */
  data: T[];
  /** The total number of items matching the query (regardless of pagination). */
  total: number;
}

// ============================================
// `useDataGrid` Hook Options
// ============================================

/**
 * Options for the `useDataGrid` hook to configure its behavior.
 */
export interface UseDataGridOptions<T> {
  /**
   * Function to fetch data from a remote source.
   * If provided, the hook operates in "remote data" mode, sending pagination, sorting,
   * and filtering parameters to this function.
   * If not provided, the hook operates in "client-side data" mode using `initialData`,
   * performing sorting, filtering, and pagination locally.
   * @param params Query parameters including pagination, sorting, and filters.
   * @returns A promise resolving to an array of data and the total count.
   */
  queryFn?: (params: QueryParams) => Promise<QueryResult<T>>;

  /**
   * Initial data for client-side mode, or fallback/initial display data for remote mode.
   * Ignored if `queryFn` is provided and successfully fetches data.
   */
  initialData?: T[];

  /**
   * Initial page index (0-indexed). Defaults to 0.
   */
  initialPageIndex?: number;

  /**
   * Initial page size. Defaults to 50.
   */
  initialPageSize?: number;

  /**
   * Initial field to sort by. Null if no initial sorting.
   */
  initialSortBy?: string | null;

  /**
   * Initial sort order. Defaults to "desc".
   */
  initialSortOrder?: "asc" | "desc" | null;

  /**
   * Initial filter state.
   */
  initialFilters?: FilterState;

  /**
   * Debounce time in milliseconds for filter changes before triggering a data fetch
   * or client-side re-processing. Defaults to 300ms.
   */
  debounceFilterTime?: number;

  /**
   * Callback executed after data is successfully fetched/processed.
   * @param data The current page data.
   * @param total The total count of items.
   */
  onDataFetched?: (data: T[], total: number) => void;

  /**
   * Callback for custom error handling during data fetching/processing.
   * @param error The error object.
   */
  onError?: (error: Error) => void;

  /**
   * A function that returns a unique key for each item in the data array.
   * This is crucial for selection and efficient list rendering.
   * Defaults to `(item: T) => (item as any).id || (item as any)._id`.
   */
  getRowKey?: (item: T) => React.Key;
}

// ============================================
// Helper Functions for Client-Side Operations
// ============================================

/**
 * Performs client-side sorting on an array of data.
 * @param data The array of data to sort.
 * @param sortState The current sorting state.
 * @returns A new array with sorted data.
 */
function sortClientSide<T>(data: T[], sortState: SortState): T[] {
  if (!sortState.field || !sortState.order) {
    return data;
  }

  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortState.field!];
    const bVal = (b as any)[sortState.field!];

    // Handle null/undefined values by pushing them to the end
    if (aVal === bVal) return 0;
    if (aVal == null) return sortState.order === "asc" ? 1 : -1; // null comes after non-null
    if (bVal == null) return sortState.order === "asc" ? -1 : 1; // non-null comes before null

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
    } else {
        // Fallback for other types (numbers, booleans, etc.)
        comparison = aVal > bVal ? 1 : -1;
    }
    
    return sortState.order === "asc" ? comparison : -comparison;
  });
}

/**
 * Performs basic client-side filtering on an array of data.
 * This is a simple implementation and can be extended for more complex filtering logic.
 * @param data The array of data to filter.
 * @param filters The current filter state.
 * @returns A new array with filtered data.
 */
function filterClientSide<T>(data: T[], filters: FilterState): T[] {
  if (Object.keys(filters).length === 0) {
    return data;
  }

  return data.filter(item => {
    for (const key in filters) {
      const filterValue = filters[key];
      const itemValue = (item as any)[key];

      // Skip filter if value is null, undefined, or empty string (for simple search)
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        continue; 
      }

      // Simple string containment for text-based filters
      if (typeof itemValue === 'string' && typeof filterValue === 'string') {
        if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
          return false;
        }
      } 
      // Direct equality for other types (numbers, booleans, enums, etc.)
      else if (itemValue !== filterValue) {
        return false;
      }
    }
    return true;
  });
}

// ============================================
// `useDataGrid` Hook Implementation
// ============================================

/**
 * A versatile React hook for managing data grid state, including pagination,
 * sorting, filtering, and row selection, supporting both client-side and
 * server-side data management.
 *
 * @param options Configuration options for the data grid.
 * @returns An object containing data grid state and control functions.
 */
export function useDataGrid<T>(options: UseDataGridOptions<T> = {}) {
  const {
    queryFn,
    initialData = [],
    initialPageIndex = 0,
    initialPageSize = 50,
    initialSortBy = null,
    initialSortOrder = "desc",
    initialFilters = {},
    debounceFilterTime = 300,
    onDataFetched,
    onError,
    getRowKey = (item: T) => (item as any).id || (item as any)._id || JSON.stringify(item),
  } = options;

  // Determine if operating in remote or client-side mode based on `queryFn` presence
  const isRemoteMode = !!queryFn;

  // Data states
  const [data, setData] = useState<T[]>(initialData);
  const [totalCount, setTotalCount] = useState<number>(initialData.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: initialPageSize,
    total: initialData.length, // Will be updated by remote query or client-side processing
  });

  // Sorting states
  const [sortState, setSortState] = useState<SortState>({
    field: initialSortBy,
    order: initialSortOrder,
  });

  // Filtering states
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const filterDebounceRef = useRef<NodeJS.Timeout>();

  // Row selection states
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ============================================
  // Data Fetching / Processing Logic
  // ============================================

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);

    let processedData: T[] = [];
    let processedTotal: number = 0;

    try {
      if (isRemoteMode && queryFn) {
        // Remote mode: Construct query params and call queryFn
        const queryParams: QueryParams = {
          pagination: {
            offset: pagination.pageIndex * pagination.pageSize,
            limit: pagination.pageSize,
          },
          sorting: sortState.field && sortState.order ? { field: sortState.field, order: sortState.order } : undefined,
          filters: filters,
        };
        const result = await queryFn(queryParams);
        processedData = result.data;
        processedTotal = result.total;
      } else {
        // Client-side mode: Apply sorting, filtering, and pagination locally
        let currentClientData = [...initialData]; // Work on a copy of initial data

        // Apply filters
        currentClientData = filterClientSide(currentClientData, filters);
        
        // Apply sorting
        currentClientData = sortClientSide(currentClientData, sortState);
        
        processedTotal = currentClientData.length;

        // Apply client-side pagination
        const start = pagination.pageIndex * pagination.pageSize;
        const end = start + pagination.pageSize;
        processedData = currentClientData.slice(start, end);

        // Adjust pageIndex if current page is out of bounds after filtering/sorting
        if (processedData.length === 0 && pagination.pageIndex > 0) {
          const newPageIndex = Math.floor((processedTotal - 1) / pagination.pageSize);
          if (newPageIndex < pagination.pageIndex) {
            setPagination(prev => ({ ...prev, pageIndex: Math.max(0, newPageIndex) }));
            // Re-run fetchData with adjusted pageIndex
            return;
          }
        }
      }

      setData(processedData);
      setTotalCount(processedTotal);
      setPagination((prev) => ({ ...prev, total: processedTotal }));
      onDataFetched?.(processedData, processedTotal);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
      onError?.(err);
      setData([]); // Clear data on error
      setTotalCount(0);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [
    isRemoteMode,
    queryFn,
    initialData,
    pagination.pageIndex,
    pagination.pageSize,
    sortState.field,
    sortState.order,
    filters,
    onDataFetched,
    onError,
  ]);

  // Effect to trigger data fetch/processing when dependencies change
  useEffect(() => {
    // If filters are debounce-controlled, manage the debounce timer
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }
    filterDebounceRef.current = setTimeout(() => {
      fetchData();
    }, debounceFilterTime);

    // Cleanup function for the effect
    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, [fetchData, debounceFilterTime]); // fetchData changes when its internal dependencies change

  // ============================================
  // Handlers for State Changes
  // ============================================

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setPagination((prev) => {
        const newPagination = {
          ...prev,
          pageIndex,
          pageSize,
        };
        // If page size changes, reset to first page to avoid out-of-bounds issues
        if (prev.pageSize !== pageSize) {
          newPagination.pageIndex = 0;
        }
        return newPagination;
      });
      // `fetchData` will be triggered by `useEffect` due to `pagination` state change
    },
    [],
  );

  const handleSortChange = useCallback(
    (field: string, order: "asc" | "desc" | null) => {
      setSortState({ field, order });
      // When sort changes, reset to first page for consistency
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      // `fetchData` will be triggered by `useEffect` due to `sortState` change
    },
    [],
  );

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    // When filters change, reset to first page
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // `fetchData` will be triggered by `useEffect` due to `filters` state change (debounced)
  }, []);

  const handleRowSelection = useCallback((keys: React.Key[]) => {
    setSelectedRowKeys(keys);
  }, []);

  // `data` already represents the current page, sorted and filtered if client-side.
  const currentPageData = useMemo(() => data, [data]);

  // ============================================
  // Exposed Values and Functions
  // ============================================

  return {
    /** The data items for the current page, processed by current filters and sort. */
    data: currentPageData,
    /** The total count of items matching the current filters (across all pages). */
    totalCount,
    /** Indicates if data is currently being loaded or processed. */
    loading,
    /** Any error message encountered during data fetching/processing. Null if no error. */
    error,
    /** The current pagination state. */
    pagination,
    /** The current sorting state. */
    sortState,
    /** The current filtering state. */
    filters,
    /** An array of keys for the currently selected rows. */
    selectedRowKeys,
    /**
     * Function to manually refetch/reprocess data. Useful after external changes
     * (e.g., item update, delete).
     */
    refetch: fetchData,
    /** Allows external components to set the loading state directly. */
    setLoading,
    /** Callback to handle changes in pagination (page index and page size). */
    handlePaginationChange,
    /** Callback to handle changes in sorting (sort field and order). */
    handleSortChange,
    /** Callback to handle changes in filtering criteria. */
    handleFilterChange,
    /** Callback to handle changes in row selection. */
    handleRowSelection,
    /** Allows external components to directly set selected row keys. */
    setSelectedRowKeys,
    /** Allows external components to directly set filters. */
    setFilters,
    /** Allows external components to directly set sort state. */
    setSortState,
    /** Allows external components to directly set pagination state. */
    setPagination,
  };
}