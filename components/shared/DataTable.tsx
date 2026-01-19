/**
 * TrvicERP DataTable Component
 *
 * Enterprise data table with:
 * - 48px row height
 * - Zebra striping
 * - Row selection
 * - Sortable columns
 * - Batch operations
 *
 * @see DESIGN_SYSTEM.md Section 5.3
 */

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string | number);
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selected: Set<string | number>) => void;
  onRowClick?: (record: T, index: number) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  rowKey = 'id',
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  onRowClick,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  loading = false,
  emptyText = '沒有資料',
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  // Internal selection state (used when uncontrolled)
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(
    new Set()
  );

  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const setSelectedRows = onSelectionChange ?? setInternalSelectedRows;

  // Get row key
  const getRowKey = useCallback(
    (record: T, index: number): string | number => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      const key = record[rowKey];
      if (key !== undefined && key !== null) {
        return key as string | number;
      }
      return index;
    },
    [rowKey]
  );

  // All row keys
  const allRowKeys = useMemo(
    () => data.map((record, index) => getRowKey(record, index)),
    [data, getRowKey]
  );

  // Selection handlers
  const isAllSelected = data.length > 0 && allRowKeys.every((key) => selectedRows.has(key));
  const isPartiallySelected = allRowKeys.some((key) => selectedRows.has(key)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(allRowKeys));
    }
  };

  const handleSelectRow = (key: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  };

  // Sort handler
  const handleSort = (columnKey: string) => {
    if (!onSort) return;

    const newDirection =
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-neutral-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-900" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-900" />
    );
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead
          className={cn(
            'bg-neutral-100 border-b border-neutral-300',
            stickyHeader && 'sticky top-0 z-10'
          )}
        >
          <tr>
            {selectable && (
              <th className="w-14 px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    'transition-colors duration-150',
                    isAllSelected || isPartiallySelected
                      ? 'bg-primary-900 border-primary-900 text-white'
                      : 'border-neutral-400 bg-white hover:border-primary-900'
                  )}
                  aria-label={isAllSelected ? '取消全選' : '全選'}
                >
                  {(isAllSelected || isPartiallySelected) && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </button>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 h-12 text-sm font-semibold text-neutral-700',
                  'text-left',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer select-none hover:text-primary-900'
                )}
                style={{ width: column.width }}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}
                >
                  <span>{column.label}</span>
                  {column.sortable && renderSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-neutral-500">
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-900 rounded-full animate-spin" />
                  <span>載入中...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-neutral-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => {
              const key = getRowKey(record, index);
              const isSelected = selectedRows.has(key);

              return (
                <tr
                  key={key}
                  className={cn(
                    'h-12 border-b border-neutral-200',
                    'transition-colors duration-150',
                    index % 2 === 0 ? 'bg-neutral-50' : 'bg-white',
                    isSelected && 'bg-primary-100 border-l-[3px] border-l-primary-900',
                    onRowClick && 'cursor-pointer',
                    !isSelected && 'hover:bg-primary-50'
                  )}
                  onClick={() => onRowClick?.(record, index)}
                >
                  {selectable && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRow(key);
                        }}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center',
                          'transition-colors duration-150',
                          isSelected
                            ? 'bg-primary-900 border-primary-900 text-white'
                            : 'border-neutral-400 bg-white hover:border-primary-900'
                        )}
                        aria-label={isSelected ? '取消選擇' : '選擇'}
                      >
                        {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </button>
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = (record as any)[column.key];
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-sm text-neutral-800',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(value, record, index)
                          : value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Batch Actions Bar */}
      {selectable && selectedRows.size > 0 && (
        <BatchActionsBar
          selectedCount={selectedRows.size}
          totalCount={data.length}
          onSelectAll={() => setSelectedRows(new Set(allRowKeys))}
          onClearSelection={() => setSelectedRows(new Set())}
        />
      )}
    </div>
  );
}

/**
 * Batch Actions Bar - Shows when rows are selected
 */
interface BatchActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  children?: React.ReactNode;
}

export function BatchActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  children,
}: BatchActionsBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-primary-50 border-t border-primary-200 px-4 py-3 flex items-center gap-4">
      <span className="text-sm font-medium text-primary-900">
        已選擇 {selectedCount} 筆
      </span>

      {selectedCount < totalCount && (
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm text-primary-900 hover:underline"
        >
          全選 {totalCount} 筆
        </button>
      )}

      <button
        type="button"
        onClick={onClearSelection}
        className="text-sm text-neutral-600 hover:underline"
      >
        取消選擇
      </button>

      <div className="flex-1" />

      {children}
    </div>
  );
}

/**
 * Pagination Component
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages = useMemo(() => {
    const result: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      result.push(1);

      if (currentPage > 3) {
        result.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        result.push(i);
      }

      if (currentPage < totalPages - 2) {
        result.push('ellipsis');
      }

      result.push(totalPages);
    }

    return result;
  }, [currentPage, totalPages]);

  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 px-4 border-t border-neutral-200',
        className
      )}
    >
      <span className="text-sm text-neutral-600">
        第 {startItem}-{endItem} 筆，共 {totalItems} 筆
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md',
            'transition-colors duration-150',
            currentPage === 1
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
          )}
        >
          上一頁
        </button>

        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-neutral-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'w-8 h-8 text-sm rounded-md',
                'transition-colors duration-150',
                currentPage === page
                  ? 'bg-primary-900 text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md',
            'transition-colors duration-150',
            currentPage === totalPages
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
          )}
        >
          下一頁
        </button>
      </div>
    </div>
  );
}

export default DataTable;
