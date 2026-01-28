// /workspaces/TrvicERP/src/design-system/DataGrid.tsx

import React, { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import {
  DataGridProps,
  Column,
  IconComponentType,
} from "./DataGrid.types";
import { defaultDataGridIcons } from "./DataGrid.icons"; // Import default Lucide icons for practical defaults

// ============================================
// Sub-Components
// ============================================

interface DataGridSortIconProps {
  order: "asc" | "desc" | null;
  AscIcon: IconComponentType;
  DescIcon: IconComponentType;
  DefaultIcon: IconComponentType;
}

function DataGridSortIcon({
  order,
  AscIcon,
  DescIcon,
  DefaultIcon,
}: DataGridSortIconProps) {
  if (order === "asc") return <AscIcon className="w-4 h-4 text-primary-600" />;
  if (order === "desc")
    return <DescIcon className="w-4 h-4 text-primary-600" />;
  return <DefaultIcon className="w-4 h-4 text-neutral-400" />;
}

interface DataGridTableHeadProps<T> {
  columns: Column<T>[];
  sortState: Record<string, "asc" | "desc" | null>;
  onSort: (field: string) => void;
  rowSelection?: DataGridProps<T>["rowSelection"];
  onSelectAll?: (checked: boolean) => void;
  SortAscIcon: IconComponentType;
  SortDescIcon: IconComponentType;
  SortDefaultIcon: IconComponentType;
}

function DataGridTableHead<T>({
  columns,
  sortState,
  onSort,
  rowSelection,
  onSelectAll,
  SortAscIcon,
  SortDescIcon,
  SortDefaultIcon,
}: DataGridTableHeadProps<T>) {
  return (
    <thead className="bg-neutral-50">
      <tr>
        {rowSelection && (
          <th className="px-4 py-3 text-left w-12">
            <input
              type="checkbox"
              onChange={(e) => onSelectAll?.(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              "px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider",
              column.sortable && "cursor-pointer hover:bg-neutral-100 select-none",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
            )}
            style={{ width: column.width }}
            onClick={() => column.sortable && onSort(column.key)}
          >
            <div className="flex items-center gap-2">
              <span>{column.title}</span>
              {column.sortable && (
                <DataGridSortIcon
                  order={sortState[column.key]}
                  AscIcon={SortAscIcon}
                  DescIcon={SortDescIcon}
                  DefaultIcon={SortDefaultIcon}
                />
              )}
            </div>
          </th>
        ))}
        {/* Actions column header, only if actions are enabled */}
        {(columns.some(col => col.fixed === "right") || true) && (
            <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider w-16 sticky right-0 bg-neutral-50">
                操作
            </th>
        )}
      </tr>
    </thead>
  );
}

interface DataGridRowActionsProps<T> {
  record: T;
  actions: DataGridProps<T>["actions"];
  MoreVerticalIcon: IconComponentType;
}

function DataGridRowActions<T>({
  record,
  actions,
  MoreVerticalIcon,
}: DataGridRowActionsProps<T>) {
  const [showActions, setShowActions] = useState(false);

  if (!actions?.show) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setShowActions(!showActions)}
        className="p-1 rounded hover:bg-neutral-100 transition-colors"
      >
        <MoreVerticalIcon className="w-4 h-4 text-neutral-600" />
      </button>

      {showActions && (
        <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px] focus-within:outline-none"
             onBlur={(e) => {
                // Check if the related target is outside the dropdown
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setShowActions(false);
                }
             }}
             tabIndex={-1} // Make div focusable
        >
          {actions.items?.map((action) => (
            <button
              key={action.key}
              onClick={() => {
                action.onClick(record);
                setShowActions(false);
              }}
              disabled={action.disabled?.(record)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors",
                action.disabled?.(record) && "opacity-50 cursor-not-allowed",
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DataGridTableRowProps<T> {
  record: T;
  columns: Column<T>[];
  index: number;
  rowKey: string | ((record: T) => string);
  onRow?: (record: T, index: number) => any;
  rowSelection?: DataGridProps<T>["rowSelection"];
  isSelected?: boolean;
  onSelect?: (key: React.Key, checked: boolean) => void;
  actions?: DataGridProps<T>["actions"];
  MoreVerticalIcon: IconComponentType;
  striped?: boolean;
  hoverable?: boolean;
}

function DataGridTableRow<T>({
  record,
  columns,
  index,
  rowKey,
  onRow,
  rowSelection,
  isSelected,
  onSelect,
  actions,
  MoreVerticalIcon,
  striped,
  hoverable,
}: DataGridTableRowProps<T>) {
  const key =
    typeof rowKey === "function" ? rowKey(record) : (record as any)[rowKey];
  const rowProps = onRow?.(record, index) || {};

  const checkboxDisabled = rowSelection?.getCheckboxProps?.(record)?.disabled;

  return (
    <tr
      className={cn(
        "border-b border-neutral-200",
        striped && index % 2 === 1 && "bg-neutral-50",
        hoverable && "hover:bg-primary-50/50 transition-colors",
        isSelected && "bg-primary-50/50",
      )}
      {...rowProps}
    >
      {rowSelection && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(key, e.target.checked)}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            disabled={checkboxDisabled}
          />
        </td>
      )}
      {columns.map((column) => {
        const value = (record as any)[column.dataIndex];
        const content = column.render
          ? column.render(value, record, index)
          : String(value ?? ""); // Ensure string for content

        return (
          <td
            key={column.key}
            className={cn(
              "px-4 py-3 text-sm text-neutral-900",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              column.fixed === "left" && "sticky left-0 bg-white shadow-right", // Add shadow-right for fixed columns
              column.fixed === "right" && "sticky right-0 bg-white shadow-left", // Add shadow-left
            )}
            style={column.fixed ? { left: column.fixed === "left" ? 0 : 'auto', right: column.fixed === "right" ? 0 : 'auto' } : undefined}
          >
            {content}
          </td>
        );
      })}
      <td className="px-4 py-3 text-center w-16 sticky right-0 bg-white">
        <DataGridRowActions
          record={record}
          actions={actions}
          MoreVerticalIcon={MoreVerticalIcon}
        />
      </td>
    </tr>
  );
}

interface DataGridPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, size: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

function DataGridPagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger,
  showQuickJumper,
}: DataGridPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  // Determine which page numbers to show
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1); // Always show first page

    if (current > 4) {
      pages.push("..."); // Ellipsis for start
    }

    let start = Math.max(2, current - 2);
    let end = Math.min(totalPages - 1, current + 2);

    if (current <= 4) {
      end = 5; // Show 1-5 if current is near start
    } else if (current >= totalPages - 3) {
      start = totalPages - 4; // Show total-4 to total if current is near end
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < totalPages - 3) {
      pages.push("..."); // Ellipsis for end
    }

    if (totalPages > 1) { // Always show last page if more than 1 page
      pages.push(totalPages);
    }

    return Array.from(new Set(pages)); // Remove duplicates if any
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-neutral-50 border-t border-neutral-200 gap-y-3">
      <div className="text-sm text-neutral-600">
        顯示第 {startItem} - {endItem} 筆，共 {total} 筆資料
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(current - 1, pageSize)}
          disabled={current <= 1}
          className="min-w-[80px]"
        >
          上一頁
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-sm text-neutral-600">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onChange(pageNum as number, pageSize)}
                className={cn(
                  "w-8 h-8 text-sm rounded border transition-colors flex items-center justify-center",
                  current === pageNum
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50",
                )}
              >
                {pageNum}
              </button>
            ),
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(current + 1, pageSize)}
          disabled={current >= totalPages}
          className="min-w-[80px]"
        >
          下一頁
        </Button>

        {showSizeChanger && (
          <select
            className="ml-2 py-1 px-2 border border-neutral-300 rounded-md text-sm text-neutral-700 focus:ring-primary-500 focus:border-primary-500"
            value={pageSize}
            onChange={(e) => onChange(1, Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} 筆/頁
              </option>
            ))}
          </select>
        )}

        {showQuickJumper && (
          <div className="ml-2 flex items-center gap-1">
            跳至
            <input
              type="number"
              min={1}
              max={totalPages}
              value={current} // Display current page as a hint
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const page = Number((e.target as HTMLInputElement).value);
                  if (page >= 1 && page <= totalPages) {
                    onChange(page, pageSize);
                  }
                }
              }}
              className="w-12 py-1 px-2 border border-neutral-300 rounded-md text-sm text-neutral-700 text-center focus:ring-primary-500 focus:border-primary-500"
            />
            頁
          </div>
        )}
      </div>
    </div>
  );
}

interface DataGridEmptyStateProps {
  colSpan: number;
  message?: string;
}

function DataGridEmptyState({
  colSpan,
  message = "暫無資料",
}: DataGridEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-neutral-500">
        {message}
      </td>
    </tr>
  );
}

interface DataGridLoadingStateProps {
  colSpan: number;
  message?: string;
  LoadingIcon: IconComponentType;
}

function DataGridLoadingState({
  colSpan,
  message = "載入中...",
  LoadingIcon,
}: DataGridLoadingStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-neutral-500">
        <div className="flex items-center justify-center">
          <LoadingIcon className="w-5 h-5 animate-spin mr-2 text-primary-600" />
          {message}
        </div>
      </td>
    </tr>
  );
}

interface DataGridToolbarProps<T> {
  toolbar?: DataGridProps<T>["toolbar"];
  searchValue: string;
  onSearchChange: (value: string) => void;
  SearchIcon: IconComponentType;
  DownloadIcon: IconComponentType;
  RefreshIcon: IconComponentType;
}

function DataGridToolbar<T>({
  toolbar,
  searchValue,
  onSearchChange,
  SearchIcon,
  DownloadIcon,
  RefreshIcon,
}: DataGridToolbarProps<T>) {
  if (!toolbar) return null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-neutral-200 gap-y-3">
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        {toolbar.title && (
          <h3 className="text-lg font-semibold text-neutral-900">
            {toolbar.title}
          </h3>
        )}

        {toolbar.search && (
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={toolbar.search.placeholder || "搜尋..."}
              value={searchValue}
              onChange={(e) => {
                onSearchChange(e.target.value);
                toolbar.search?.onSearch?.(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {toolbar.refresh && (
          <Button
            variant="ghost"
            onClick={toolbar.refresh.onRefresh}
            className="!p-2 text-neutral-600 hover:text-primary-600"
          >
            <RefreshIcon className="w-4 h-4" />
          </Button>
        )}

        {toolbar.export && (
          <Button
            variant="ghost"
            onClick={toolbar.export.onExport}
            className="text-neutral-600 hover:text-primary-600"
          >
            <DownloadIcon className="w-4 h-4 mr-1" />
            匯出
          </Button>
        )}

        {toolbar.extra}
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
  onFilterChange, // Not implemented in original code, but kept for interface
  rowSelection,
  actions = {
    show: true,
    items: [
      {
        key: "view",
        label: "查看",
        icon: <defaultDataGridIcons.Eye className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        key: "edit",
        label: "編輯",
        icon: <defaultDataGridIcons.Edit className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        key: "delete",
        label: "刪除",
        icon: <defaultDataGridIcons.Trash2 className="w-4 h-4" />,
        onClick: () => {},
      },
    ],
  },
  toolbar,
  className,
  size = "middle", // Not fully utilized in styling, kept for future expansion
  bordered = true,
  striped = false,
  hoverable = true,
  icons = defaultDataGridIcons, // Use imported default icons
}: DataGridProps<T>) {
  // Destructure icons for easier use
  const {
    SortAsc: SortAscIcon,
    SortDesc: SortDescIcon,
    SortDefault: SortDefaultIcon,
    Search: SearchIcon,
    Download: DownloadIcon,
    Refresh: RefreshIcon,
    MoreVertical: MoreVerticalIcon,
    Loading: LoadingIcon,
  } = icons;

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
        const allKeys = data.map((record) =>
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
      const selectedRecords = data.filter((record) => {
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

    // Apply client-side sorting if no onSortChange prop is provided
    // If onSortChange is provided, assume server-side sorting
    if (!onSortChange) {
      const sortField = Object.keys(sortState).find(
        (key) => sortState[key] !== null,
      );
      if (sortField) {
        const order = sortState[sortField];
        result.sort((a, b) => {
          const aValue = (a as any)[sortField];
          const bValue = (b as any)[sortField];

          if (typeof aValue === "string" && typeof bValue === "string") {
            return order === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          if (typeof aValue === "number" && typeof bValue === "number") {
            return order === "asc" ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
      }
    }

    return result;
  }, [data, searchValue, toolbar?.search, sortState, onSortChange]);

  const colCount = columns.length + (rowSelection ? 1 : 0) + (actions?.show ? 1 : 0);

  return (
    <div
      className={cn(
        "p-0 bg-white rounded-lg shadow-sm", // Standard Dashtail card structure
        className,
      )}
    >
      {/* Drag handle for Kintone Widgets */}
      <div className="drag-handle h-4 w-full cursor-grab" />

      {/* Actual DataGrid Content */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Toolbar */}
        <DataGridToolbar
          toolbar={toolbar}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          SearchIcon={SearchIcon}
          DownloadIcon={DownloadIcon}
          RefreshIcon={RefreshIcon}
        />

        {/* Table Container */}
        <div className="overflow-x-auto relative">
          <table
            className={cn(
              "min-w-full divide-y divide-neutral-200",
              bordered && "border border-neutral-200", // Apply border to table
            )}
          >
            <DataGridTableHead
              columns={columns}
              sortState={sortState}
              onSort={handleSort}
              rowSelection={rowSelection}
              onSelectAll={handleSelectAll}
              SortAscIcon={SortAscIcon}
              SortDescIcon={SortDescIcon}
              SortDefaultIcon={SortDefaultIcon}
            />

            <tbody className="bg-white divide-y divide-neutral-200">
              {loading ? (
                <DataGridLoadingState colSpan={colCount} LoadingIcon={LoadingIcon} />
              ) : processedData.length === 0 ? (
                <DataGridEmptyState colSpan={colCount} />
              ) : (
                processedData.map((record, index) => {
                  const key =
                    typeof rowKey === "function"
                      ? rowKey(record)
                      : (record as any)[rowKey];
                  return (
                    <DataGridTableRow
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
                      MoreVerticalIcon={MoreVerticalIcon}
                      striped={striped}
                      hoverable={hoverable}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <DataGridPagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onPaginationChange || (() => {})}
            showSizeChanger={pagination.showSizeChanger}
            showQuickJumper={pagination.showQuickJumper}
          />
        )}
      </div>
    </div>
  );
}
// /workspaces/TrvicERP/src/design-system/DataGrid.types.ts

import React from "react";

/**
 * Generic type for an icon component, e.g., from Lucide React or a custom SVG component.
 */
export type IconComponentType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

/**
 * Defines the structure for a column in the DataGrid.
 * @template T - The type of data records in the grid.
 */
export interface Column<T = any> {
  /** A unique key for the column. */
  key: string;
  /** The title displayed in the column header. */
  title: string;
  /** The key of the data record property to display in this column. */
  dataIndex: keyof T;
  /** Optional width for the column (e.g., "100px", "10%", 150). */
  width?: string | number;
  /** Whether the column can be sorted. */
  sortable?: boolean;
  /** Whether the column can be filtered. (Not yet implemented in component logic) */
  filterable?: boolean;
  /** Custom render function for cell content. */
  render?: (value: any, record: T, index: number) => React.ReactNode;
  /** Text alignment within the column. */
  align?: "left" | "center" | "right";
  /** Fix the column to the left or right when scrolling horizontally. */
  fixed?: "left" | "right";
}

/**
 * Defines the pagination properties for the DataGrid.
 */
export interface DataGridPaginationConfig {
  /** The current page number (1-based index). */
  current: number;
  /** The number of items per page. */
  pageSize: number;
  /** The total number of items across all pages. */
  total: number;
  /** Whether to show a page size changer. */
  showSizeChanger?: boolean;
  /** Whether to show a quick jumper to specific pages. */
  showQuickJumper?: boolean;
}

/**
 * Defines properties for row selection in the DataGrid.
 * @template T - The type of data records.
 */
export interface DataGridRowSelectionConfig<T = any> {
  /** Array of currently selected row keys. */
  selectedRowKeys?: React.Key[];
  /** Callback triggered when row selection changes. */
  onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  /** Function to get checkbox properties for a specific row (e.g., to disable it). */
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

/**
 * Defines configuration for row actions (e.g., view, edit, delete buttons).
 * @template T - The type of data records.
 */
export interface DataGridRowActionsConfig<T = any> {
  /** Whether to show the actions column. */
  show?: boolean;
  /** Array of action items to display in the dropdown. */
  items?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (record: T) => void;
    disabled?: (record: T) => boolean;
  }>;
}

/**
 * Defines configuration for the DataGrid toolbar.
 */
export interface DataGridToolbarConfig {
  /** Optional title displayed in the toolbar. */
  title?: string;
  /** Additional React nodes to render in the toolbar (e.g., custom buttons). */
  extra?: React.ReactNode;
  /** Search functionality configuration. */
  search?: {
    placeholder?: string;
    onSearch?: (value: string) => void;
  };
  /** Export functionality configuration. */
  export?: {
    filename?: string;
    onExport?: () => void;
  };
  /** Refresh functionality configuration. */
  refresh?: {
    onRefresh?: () => void;
  };
  /** Filter functionality configuration. (Not yet implemented in component logic) */
  filter?: {
    items?: Array<{
      key: string;
      label: string;
      options: Array<{ label: string; value: any }>;
    }>;
  };
}

/**
 * Collection of icon components used throughout the DataGrid.
 * This allows consumers to provide their own icon library.
 */
export interface DataGridIcons {
  SortAsc: IconComponentType;
  SortDesc: IconComponentType;
  SortDefault: IconComponentType;
  Search: IconComponentType;
  Filter: IconComponentType; // Not directly used in existing toolbar, but good for future
  Download: IconComponentType;
  MoreVertical: IconComponentType;
  Eye: IconComponentType;
  Edit: IconComponentType;
  Trash2: IconComponentType;
  Refresh: IconComponentType;
  Loading: IconComponentType; // For loading spinner
}

/**
 * Props for the main DataGrid component.
 * @template T - The type of data records in the grid.
 */
export interface DataGridProps<T = any> {
  /** The data source for the grid. */
  data: T[];
  /** Array of column definitions. */
  columns: Column<T>[];
  /** Whether the data is currently loading. */
  loading?: boolean;
  /** Pagination configuration. */
  pagination?: DataGridPaginationConfig;
  /** Key to uniquely identify each row, or a function to generate it. */
  rowKey?: string | ((record: T) => string);
  /** Callback for row events (e.g., click, double click). */
  onRow?: (
    record: T,
    index: number,
  ) => {
    onClick?: (event: React.MouseEvent) => void;
    onDoubleClick?: (event: React.MouseEvent) => void;
  };
  /** Callback triggered when pagination changes. */
  onPaginationChange?: (page: number, pageSize: number) => void;
  /** Callback triggered when sorting changes. If provided, assumes server-side sorting. */
  onSortChange?: (field: string, order: "asc" | "desc" | null) => void;
  /** Callback triggered when filters change. (Not yet implemented in component logic) */
  onFilterChange?: (filters: Record<string, any>) => void;
  /** Row selection configuration. */
  rowSelection?: DataGridRowSelectionConfig<T>;
  /** Actions configuration for each row. */
  actions?: DataGridRowActionsConfig<T>;
  /** Toolbar configuration for the grid header. */
  toolbar?: DataGridToolbarConfig;
  /** Additional CSS class names for the root element. */
  className?: string;
  /** Size variant for the grid (e.g., "small", "middle", "large"). (Not fully implemented in styling) */
  size?: "small" | "middle" | "large";
  /** Whether to display borders around the table. */
  bordered?: boolean;
  /** Whether to display striped rows. */
  striped?: boolean;
  /** Whether rows should show a hover effect. */
  hoverable?: boolean;
  /** Custom icon components to override defaults. */
  icons?: DataGridIcons;
}
// /workspaces/TrvicERP/src/design-system/DataGrid.icons.ts

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
import { IconComponentType, DataGridIcons } from "./DataGrid.types";

/**
 * Default icon components for DataGrid, using Lucide React.
 * This file centralizes the dependency on `lucide-react`.
 */
export const defaultDataGridIcons: DataGridIcons = {
  SortAsc: ChevronUp,
  SortDesc: ChevronDown,
  SortDefault: ArrowUpDown,
  Search: Search,
  Filter: Filter,
  Download: Download,
  MoreVertical: MoreVertical,
  Eye: Eye,
  Edit: Edit,
  Trash2: Trash2,
  Refresh: RefreshCw,
  Loading: RefreshCw, // Use RefreshCw for loading spinner
} satisfies Record<keyof DataGridIcons, IconComponentType>;