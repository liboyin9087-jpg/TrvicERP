import { useState, useEffect, useCallback } from "react";
import { auditService, logUserAction } from "@/services/auditService";
import type {
  AuditLog,
  AuditLogQuery,
  ResourceType,
  AuditAction,
} from "@/types/audit";

// ============================================
// Audit Hook
// ============================================

export function useAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(async (params: AuditLogQuery) => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditService.query(params);
      setLogs(result.logs);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to query audit logs";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const log = useCallback(
    async (
      action: AuditAction,
      resourceType: ResourceType,
      resourceId: string,
      metadata?: Record<string, any>,
    ) => {
      try {
        return await logUserAction(action, resourceType, resourceId, metadata);
      } catch (err) {
        console.error("Failed to log action:", err);
        throw err;
      }
    },
    [],
  );

  return {
    logs,
    loading,
    error,
    query,
    log,
  };
}

// ============================================
// Data Grid Hook
// ============================================

interface UseDataGridOptions<T> {
  initialData?: T[];
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useDataGrid<T>(options: UseDataGridOptions<T> = {}) {
  const {
    initialData = [],
    pageSize = 50,
    sortBy,
    sortOrder = "desc",
  } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize,
    total: initialData.length,
  });
  const [sortState, setSortState] = useState<{
    field: string | null;
    order: "asc" | "desc" | null;
  }>({
    field: sortBy || null,
    order: sortOrder,
  });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Update data
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    setPagination((prev) => ({
      ...prev,
      total: newData.length,
      current: 1, // Reset to first page when data changes
    }));
  }, []);

  // Handle pagination
  const handlePaginationChange = useCallback((page: number, size: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: size,
    }));
  }, []);

  // Handle sorting
  const handleSortChange = useCallback(
    (field: string, order: "asc" | "desc" | null) => {
      setSortState({ field, order });

      if (!order) {
        // Remove sorting, restore original order
        return;
      }

      const sortedData = [...data].sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal > bVal ? 1 : -1;
        return order === "asc" ? comparison : -comparison;
      });

      setData(sortedData);
    },
    [data],
  );

  // Handle filtering
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    // Apply filters logic here
    // This would typically be done on the server side
  }, []);

  // Handle row selection
  const handleRowSelection = useCallback((keys: React.Key[], rows: T[]) => {
    setSelectedRowKeys(keys);
  }, []);

  // Get current page data
  const getCurrentPageData = useCallback(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }, [data, pagination]);

  return {
    data,
    loading,
    pagination,
    sortState,
    filters,
    selectedRowKeys,
    currentPageData: getCurrentPageData(),
    setLoading,
    updateData,
    handlePaginationChange,
    handleSortChange,
    handleFilterChange,
    handleRowSelection,
  };
}

// ============================================
// Audit-aware CRUD Hook
// ============================================

interface UseAuditedCRUDOptions<T> {
  resourceType: ResourceType;
  getResourceId: (item: T) => string;
  getResourceName?: (item: T) => string;
}

export function useAuditedCRUD<T>(options: UseAuditedCRUDOptions<T>) {
  const { resourceType, getResourceId, getResourceName } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const create = useCallback(
    async (item: T) => {
      setLoading(true);
      try {
        // In real implementation, this would make an API call
        const newItems = [...items, item];
        setItems(newItems);

        // Log the creation
        await logUserAction("create", resourceType, getResourceId(item), {
          resource_name: getResourceName?.(item),
          item_data: item,
        });

        return item;
      } catch (error) {
        console.error("Create failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [items, resourceType, getResourceId, getResourceName],
  );

  const update = useCallback(
    async (oldItem: T, newItem: T) => {
      setLoading(true);
      try {
        const itemId = getResourceId(oldItem);
        const newItems = items.map((item) =>
          getResourceId(item) === itemId ? newItem : item,
        );
        setItems(newItems);

        // Log the update with change tracking
        await auditService.trackChange(
          resourceType,
          itemId,
          oldItem as Record<string, any>,
          newItem as Record<string, any>,
          {
            user_id: "current_user", // Would get from auth context
            user_name: "Current User",
            user_role: "staff",
          },
        );

        return newItem;
      } catch (error) {
        console.error("Update failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [items, resourceType, getResourceId],
  );

  const remove = useCallback(
    async (item: T) => {
      setLoading(true);
      try {
        const itemId = getResourceId(item);
        const newItems = items.filter((i) => getResourceId(i) !== itemId);
        setItems(newItems);

        // Log the deletion
        await logUserAction("delete", resourceType, itemId, {
          resource_name: getResourceName?.(item),
          deleted_item: item,
        });

        return item;
      } catch (error) {
        console.error("Delete failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [items, resourceType, getResourceId, getResourceName],
  );

  const bulkUpdate = useCallback(
    async (updates: Array<{ old: T; new: T }>) => {
      setLoading(true);
      try {
        let newItems = [...items];

        updates.forEach(({ old: oldItem, new: newItem }) => {
          const itemId = getResourceId(oldItem);
          newItems = newItems.map((item) =>
            getResourceId(item) === itemId ? newItem : item,
          );
        });

        setItems(newItems);

        // Log bulk update
        await logUserAction("bulk_update", resourceType, `bulk_${Date.now()}`, {
          updated_count: updates.length,
          resource_ids: updates.map(({ old }) => getResourceId(old)),
        });

        return newItems;
      } catch (error) {
        console.error("Bulk update failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [items, resourceType, getResourceId],
  );

  return {
    items,
    loading,
    create,
    update,
    remove,
    bulkUpdate,
    setItems,
  };
}
