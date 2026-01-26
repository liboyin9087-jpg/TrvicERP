import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "./Button";

// ============================================
// Types
// ============================================

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
}

export interface DataGridProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
  };
  rowKey?: string | ((record: T) => string);
  onRow?: (
    record: T,
    index: number,
  ) => {
    onClick?: (event: React.MouseEvent) => void;
    onDoubleClick?: (event: React.MouseEvent) => void;
  };
  onPaginationChange?: (page: number, pageSize: number) => void;
  onSortChange?: (field: string, order: "asc" | "desc" | null) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  actions?: {
    show?: boolean;
    items?: Array<{
      key: string;
      label: string;
      icon?: React.ReactNode;
      onClick: (record: T) => void;
      disabled?: (record: T) => boolean;
    }>;
  };
  toolbar?: {
    title?: string;
    extra?: React.ReactNode;
    search?: {
      placeholder?: string;
      onSearch?: (value: string) => void;
    };
    export?: {
      filename?: string;
      onExport?: () => void;
    };
    refresh?: {
      onRefresh?: () => void;
    };
    filter?: {
      items?: Array<{
        key: string;
        label: string;
        options: Array<{ label: string; value: any }>;
      }>;
    };
  };
  className?: string;
  size?: "small" | "middle" | "large";
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

// ============================================
// Components
// ============================================

function SortIcon({ order }: { order: "asc" | "desc" | null }) {
  if (order === "asc") return <ChevronUp className="w-4 h-4" />;
  if (order === "desc") return <ChevronDown className="w-4 h-4" />;
  return <ArrowUpDown className="w-4 h-4 opacity-50" />;
}

function TableHead<T>({
  columns,
  sortState,
  onSort,
  rowSelection,
  onSelectAll,
}: {
  columns: Column<T>[];
  sortState: Record<string, "asc" | "desc" | null>;
  onSort: (field: string) => void;
  rowSelection?: DataGridProps<T>["rowSelection"];
  onSelectAll?: (checked: boolean) => void;
}) {
  return (
    <thead className="bg-secondary-50/50">
      <tr>
        {rowSelection && (
          <th className="px-4 py-3 text-left">
            <input
              type="checkbox"
              onChange={(e) => onSelectAll?.(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
              column.sortable &&
                "cursor-pointer hover:bg-gray-100/50 select-none",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && onSort(column.key)}
          >
            <div className="flex items-center gap-2">
              <span>{column.title}</span>
              {column.sortable && <SortIcon order={sortState[column.key]} />}
            </div>
          </th>
        ))}
        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
          操作
        </th>
      </tr>
    </thead>
  );
}

function TableRow<T>({
  record,
  columns,
  index,
  rowKey,
  onRow,
  rowSelection,
  isSelected,
  onSelect,
  actions,
}: {
  record: T;
  columns: Column<T>[];
  index: number;
  rowKey: string | ((record: T) => string);
  onRow?: (record: T, index: number) => any;
  rowSelection?: DataGridProps<T>["rowSelection"];
  isSelected?: boolean;
  onSelect?: (key: React.Key, checked: boolean) => void;
  actions?: DataGridProps<T>["actions"];
}) {
  const key =
    typeof rowKey === "function" ? rowKey(record) : (record as any)[rowKey];
  const rowProps = onRow?.(record, index) || {};
  const [showActions, setShowActions] = useState(false);

  return (
    <tr
      className={cn(
        "border-b border-secondary-200 hover:bg-secondary-50/50 transition-colors",
        isSelected && "bg-brand-50/50",
      )}
      {...rowProps}
    >
      {rowSelection && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(key, e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
        </td>
      )}
      {columns.map((column) => {
        const value = (record as any)[column.dataIndex];
        const content = column.render
          ? column.render(value, record, index)
          : value;

        return (
          <td
            key={column.key}
            className={cn(
              "px-4 py-3 text-sm text-gray-900",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
            )}
          >
            {content}
          </td>
        );
      })}
      <td className="px-4 py-3 text-center">
        {actions?.show && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                {actions.items?.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => {
                      action.onClick(record);
                      setShowActions(false);
                    }}
                    disabled={action.disabled?.(record)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-secondary-50 flex items-center gap-2 transition-colors",
                      action.disabled?.(record) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function Pagination({
  current,
  pageSize,
  total,
  onChange,
}: {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, size: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-secondary-50/50 border-t">
      <div className="text-sm text-gray-500">
        顯示第 {startItem} - {endItem} 筆，共 {total} 筆資料
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(current - 1, pageSize)}
          disabled={current <= 1}
        >
          上一頁
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (current <= 4) {
              pageNum = i + 1;
            } else if (current >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = current - 3 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onChange(pageNum, pageSize)}
                className={cn(
                  "w-8 h-8 text-sm rounded border transition-colors",
                  current === pageNum
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50",
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(current + 1, pageSize)}
          disabled={current >= totalPages}
        >
          下一頁
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function DataGrid<T = any>({
  data,
  columns,
  loading,
  pagination,
  rowKey = "id",
  onRow,
  onPaginationChange,
  onSortChange,
  onFilterChange,
  rowSelection,
  actions = {
    show: true,
    items: [
      {
        key: "view",
        label: "查看",
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        key: "edit",
        label: "編輯",
        icon: <Edit className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        key: "delete",
        label: "刪除",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => {},
      },
    ],
  },
  toolbar,
  className,
  size = "middle",
  bordered = true,
  striped = false,
  hoverable = true,
}: DataGridProps<T>) {
  // State
  const [sortState, setSortState] = useState<
    Record<string, "asc" | "desc" | null>
  >({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
    rowSelection?.selectedRowKeys || [],
  );
  const [searchValue, setSearchValue] = useState("");

  // Handlers
  const handleSort = useCallback(
    (field: string) => {
      const currentOrder = sortState[field];
      const nextOrder =
        currentOrder === "asc"
          ? "desc"
          : currentOrder === "desc"
            ? null
            : "asc";

      setSortState((prev) => ({ ...prev, [field]: nextOrder }));
      onSortChange?.(field, nextOrder);
    },
    [sortState, onSortChange],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allKeys = data.map((record, index) =>
          typeof rowKey === "function"
            ? rowKey(record)
            : (record as any)[rowKey],
        );
        setSelectedRowKeys(allKeys);
        rowSelection?.onChange?.(allKeys, data);
      } else {
        setSelectedRowKeys([]);
        rowSelection?.onChange?.([], []);
      }
    },
    [data, rowKey, rowSelection],
  );

  const handleSelect = useCallback(
    (key: React.Key, checked: boolean) => {
      let newSelectedKeys;
      if (checked) {
        newSelectedKeys = [...selectedRowKeys, key];
      } else {
        newSelectedKeys = selectedRowKeys.filter((k) => k !== key);
      }

      setSelectedRowKeys(newSelectedKeys);
      const selectedRecords = data.filter((record, index) => {
        const recordKey =
          typeof rowKey === "function"
            ? rowKey(record)
            : (record as any)[rowKey];
        return newSelectedKeys.includes(recordKey);
      });
      rowSelection?.onChange?.(newSelectedKeys, selectedRecords);
    },
    [selectedRowKeys, data, rowKey, rowSelection],
  );

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchValue && toolbar?.search) {
      result = result.filter((record) =>
        Object.values(record as any).some((value) =>
          String(value).toLowerCase().includes(searchValue.toLowerCase()),
        ),
      );
    }

    return result;
  }, [data, searchValue, toolbar?.search]);

  return (
    <div
      className={cn(
        "bg-white rounded-lg border",
        bordered && "border-gray-200",
        className,
      )}
    >
      {/* Toolbar */}
      {toolbar && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {toolbar.title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {toolbar.title}
              </h3>
            )}

            {toolbar.search && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={toolbar.search.placeholder || "搜尋..."}
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    toolbar.search?.onSearch?.(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {toolbar.refresh && (
              <Button
                variant="ghost"
                onClick={toolbar.refresh.onRefresh}
                className="!p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            {toolbar.export && (
              <Button variant="ghost" onClick={toolbar.export.onExport}>
                <Download className="w-4 h-4" />
                匯出
              </Button>
            )}

            {toolbar.extra}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHead
            columns={columns}
            sortState={sortState}
            onSort={handleSort}
            rowSelection={rowSelection}
            onSelectAll={handleSelectAll}
          />

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (rowSelection ? 1 : 0) + 1}
                  className="px-4 py-8 text-center"
                >
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    載入中...
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowSelection ? 1 : 0) + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  暫無資料
                </td>
              </tr>
            ) : (
              processedData.map((record, index) => {
                const key =
                  typeof rowKey === "function"
                    ? rowKey(record)
                    : (record as any)[rowKey];
                return (
                  <TableRow
                    key={key}
                    record={record}
                    columns={columns}
                    index={index}
                    rowKey={rowKey}
                    onRow={onRow}
                    rowSelection={rowSelection}
                    isSelected={selectedRowKeys.includes(key)}
                    onSelect={handleSelect}
                    actions={actions}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={onPaginationChange || (() => {})}
        />
      )}
    </div>
  );
}

// Export types for external use
