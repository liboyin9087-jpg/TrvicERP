import { useState, useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
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

const DataTable = memo(<T extends { id?: string | number }>({
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
}: DataTableProps<T>) => {
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const setSelectedRows = onSelectionChange ?? setInternalSelectedRows;

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

  const allRowKeys = useMemo(
    () => data.map((record, index) => getRowKey(record, index)),
    [data, getRowKey]
  );

  const isAllSelected = data.length > 0 && allRowKeys.every((key) => selectedRows.has(key));
  const isPartiallySelected = allRowKeys.some((key) => selectedRows.has(key)) && !isAllSelected;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(allRowKeys));
    }
  }, [isAllSelected, allRowKeys, setSelectedRows]);

  const handleSelectRow = useCallback((key: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);
  }, [selectedRows, setSelectedRows]);

  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  }, [onSort, sortColumn, sortDirection]);

  const renderSortIcon = useCallback((columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-neutral-400" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary-900" aria-hidden="true" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary-900" aria-hidden="true" />
    );
  }, [sortColumn, sortDirection]);

  return (
    <div className={cn('overflow-x-auto', className)} role="region" aria-label="資料表格">
      <table className="w-full border-collapse">
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
                  aria-pressed={isAllSelected}
                >
                  {(isAllSelected || isPartiallySelected) && (
                    <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
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
                aria-sort={column.sortable ? (sortColumn === column.key ? sortDirection : 'none') : undefined}
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

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-neutral-500" aria-live="polite">
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-900 rounded-full animate-spin" aria-hidden="true" />
                  <span>載入中...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-neutral-500"
                aria-live="polite"
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
                  aria-selected={selectable ? isSelected : undefined}
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
                        aria-pressed={isSelected}
                      >
                        {isSelected && <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />}
                      </button>
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = (record as Record<string, unknown>)[column.key];
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
}) as <T extends { id?: string | number }>(props: DataTableProps<T>) => JSX.Element;

interface BatchActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  children?: React.ReactNode;
}

const BatchActionsBar = memo(({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  children,
}: BatchActionsBarProps) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-primary-50 border-t border-primary-200 px-4 py-3 flex items-center gap-4" role="toolbar" aria-label="批次操作工具列">
      <span className="text-sm font-medium text-primary-900">
        已選擇 {selectedCount} 筆
      </span>

      {selectedCount < totalCount && (
        <button
          type="button"
          onClick={onSelectAll}
          className="text-sm text-primary-900 hover:underline"
          aria-label={`全選 ${totalCount} 筆`}
        >
          全選 {totalCount} 筆
        </button>
      )}

      <button
        type="button"
        onClick={onClearSelection}
        className="text-sm text-neutral-600 hover:underline"
        aria-label="取消選擇"
      >
        取消選擇
      </button>

      <div className="flex-1" />

      {children}
    </div>
  );
});

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination = memo(({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) => {
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
      role="navigation"
      aria-label="分頁導航"
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
          aria-label="上一頁"
          aria-disabled={currentPage === 1}
        >
          上一頁
        </button>

        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-neutral-400" aria-hidden="true">
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
              aria-label={`第 ${page} 頁`}
              aria-current={currentPage === page ? 'page' : undefined}
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
          aria-label="下一頁"
          aria-disabled={currentPage === totalPages}
        >
          下一頁
        </button>
      </div>
    </div>
  );
});

export { DataTable, BatchActionsBar, Pagination };