import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import {
  DataGridProps,
  Column,
  IconComponentType,
} from "./DataGrid.types";
import { defaultDataGridIcons } from "./DataGrid.icons"; // Import default Lucide icons for practical defaults

// ============================================
// Design System Tokens (Simplified for this example)
// In a real project, these would come from a centralized theme or Tailwind config.
// Here, we define common class names for consistency as per Dashtail UI规范.
// ============================================
const DASHTAIL_COLORS = {
  primaryText: "text-primary-700", // Adjusted from 600 for stronger primary
  primaryBg: "bg-primary-700",
  primaryHoverBg: "hover:bg-primary-800",
  primaryFocusRing: "focus:ring-primary-500",
  primaryFocusBorder: "focus:border-primary-500",

  neutralTextDark: "text-neutral-900",
  neutralTextMedium: "text-neutral-700", // General text
  neutralTextLight: "text-neutral-500", // Muted text, header text
  neutralTextMuted: "text-neutral-400", // Placeholder, very light

  neutralBgLightest: "bg-white",
  neutralBgLight: "bg-neutral-50", // Table head, pagination bg
  neutralBgHover: "hover:bg-neutral-100", // Cell hover
  
  neutralBorder: "border-neutral-200",
  neutralBorderControl: "border-neutral-300",

  shadow: "shadow-sm",
  focusOutline: "focus-within:outline-none",
};

const DASHTAIL_TYPOGRAPHY = {
  headerText: "text-xs font-medium uppercase tracking-wider",
  cellText: "text-sm",
  titleText: "text-lg font-semibold",
  paginationText: "text-sm",
  smallButtonText: "text-sm",
};

const DASHTAIL_SPACING = {
  cellPadding: "px-4 py-3",
  toolbarPadding: "p-4",
  paginationPadding: "px-6 py-3",
  gapSm: "gap-1",
  gapMd: "gap-2",
  gapLg: "gap-4",
};

// ============================================
// Sub-Components
// ============================================

interface DataGridSortIconProps {
  order: "asc" | "desc" | null;
  AscIcon: IconComponentType;
  DescIcon: IconComponentType;
  DefaultIcon: IconComponentType;
  activeColorClass?: string;
  inactiveColorClass?: string;
}

function DataGridSortIcon({
  order,
  AscIcon,
  DescIcon,
  DefaultIcon,
  activeColorClass = DASHTAIL_COLORS.primaryText,
  inactiveColorClass = DASHTAIL_COLORS.neutralTextLight,
}: DataGridSortIconProps) {
  const iconClass = cn("w-4 h-4", order ? activeColorClass : inactiveColorClass);

  if (order === "asc") return <AscIcon className={iconClass} />;
  if (order === "desc") return <DescIcon className={iconClass} />;
  return <DefaultIcon className={iconClass} />;
}

interface DataGridSelectAllCheckboxProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function DataGridSelectAllCheckbox({
  isChecked,
  onChange,
  disabled,
}: DataGridSelectAllCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        "rounded",
        DASHTAIL_COLORS.neutralBorderControl,
        DASHTAIL_COLORS.primaryText,
        DASHTAIL_COLORS.primaryFocusRing,
      )}
      disabled={disabled}
    />
  );
}

interface DataGridTableHeaderCellProps<T> {
  column: Column<T>;
  sortState: Record<string, "asc" | "desc" | null>;
  onSort: (field: string) => void;
  SortAscIcon: IconComponentType;
  SortDescIcon: IconComponentType;
  SortDefaultIcon: IconComponentType;
  isLastHeader?: boolean; // To handle potential right-fixed header offset
}

function DataGridTableHeaderCell<T>({
  column,
  sortState,
  onSort,
  SortAscIcon,
  SortDescIcon,
  SortDefaultIcon,
  isLastHeader, // Not used for now, but good for complex fixed scenarios
}: DataGridTableHeaderCellProps<T>) {
  const fixedStyles: React.CSSProperties = {};
  let fixedClasses = "";
  if (column.fixed === "left") {
    fixedStyles.left = 0;
    fixedClasses = "sticky z-10 " + DASHTAIL_COLORS.neutralBgLight; // Use neutralBgLight from thead
  } else if (column.fixed === "right") {
    fixedStyles.right = 0;
    fixedClasses = "sticky z-10 " + DASHTAIL_COLORS.neutralBgLight;
  }

  return (
    <th
      key={column.key}
      className={cn(
        DASHTAIL_SPACING.cellPadding,
        "text-left",
        DASHTAIL_TYPOGRAPHY.headerText,
        DASHTAIL_COLORS.neutralTextLight,
        column.sortable && "cursor-pointer " + DASHTAIL_COLORS.neutralBgHover + " select-none",
        column.align === "center" && "text-center",
        column.align === "right" && "text-right",
        fixedClasses,
      )}
      style={{ width: column.width, ...fixedStyles }}
      onClick={() => column.sortable && onSort(column.key)}
    >
      <div className={cn("flex items-center", DASHTAIL_SPACING.gapMd)}>
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
  );
}

interface DataGridTableHeadProps<T> {
  columns: Column<T>[];
  sortState: Record<string, "asc" | "desc" | null>;
  onSort: (field: string) => void;
  rowSelection?: DataGridProps<T>["rowSelection"];
  onSelectAll?: (checked: boolean) => void;
  allRowsSelected?: boolean;
  allRowsSelectable?: boolean;
  SortAscIcon: IconComponentType;
  SortDescIcon: IconComponentType;
  SortDefaultIcon: IconComponentType;
  hasActionsColumn: boolean; // Indicate if actions column is present
}

function DataGridTableHead<T>({
  columns,
  sortState,
  onSort,
  rowSelection,
  onSelectAll,
  allRowsSelected,
  allRowsSelectable,
  SortAscIcon,
  SortDescIcon,
  SortDefaultIcon,
  hasActionsColumn,
}: DataGridTableHeadProps<T>) {
  return (
    <thead className={DASHTAIL_COLORS.neutralBgLight}>
      <tr>
        {rowSelection && (
          <th className={cn(DASHTAIL_SPACING.cellPadding, "text-left w-12")}>
            <DataGridSelectAllCheckbox
              isChecked={allRowsSelected || false}
              onChange={onSelectAll || (() => {})}
              disabled={!allRowsSelectable}
            />
          </th>
        )}
        {columns.map((column) => (
          <DataGridTableHeaderCell
            key={column.key}
            column={column}
            sortState={sortState}
            onSort={onSort}
            SortAscIcon={SortAscIcon}
            SortDescIcon={SortDescIcon}
            SortDefaultIcon={SortDefaultIcon}
          />
        ))}
        {hasActionsColumn && (
            <th className={cn(
              DASHTAIL_SPACING.cellPadding,
              "text-center",
              DASHTAIL_TYPOGRAPHY.headerText,
              DASHTAIL_COLORS.neutralTextLight,
              "w-16 sticky right-0 z-10", // Ensure sticky, z-index and bg
              DASHTAIL_COLORS.neutralBgLight,
            )}>
                操作
            </th>
        )}
      </tr>
    </thead>
  );
}

interface DataGridRowActionsProps<T> {
  record: T;
  actions?: DataGridProps<T>["actions"];
  MoreVerticalIcon: IconComponentType;
}

function DataGridRowActions<T>({
  record,
  actions,
  MoreVerticalIcon,
}: DataGridRowActionsProps<T>) {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!actions?.show) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowActions((prev) => !prev)}
        className={cn("p-1 rounded", DASHTAIL_COLORS.neutralBgHover, "transition-colors")}
        aria-haspopup="true"
        aria-expanded={showActions}
      >
        <MoreVerticalIcon className={cn("w-4 h-4", DASHTAIL_COLORS.neutralTextMedium)} />
      </button>

      {showActions && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute right-0 top-8 bg-white border",
            DASHTAIL_COLORS.neutralBorder,
            "rounded-lg shadow-lg z-20 py-1 min-w-[120px]",
            DASHTAIL_COLORS.focusOutline,
          )}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
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
                "w-full px-3 py-2 text-left",
                DASHTAIL_TYPOGRAPHY.cellText,
                DASHTAIL_COLORS.neutralTextMedium,
                DASHTAIL_COLORS.neutralBgHover,
                "flex items-center",
                DASHTAIL_SPACING.gapMd,
                "transition-colors",
                action.disabled?.(record) && "opacity-50 cursor-not-allowed",
              )}
              role="menuitem"
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
  hasActionsColumn: boolean;
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
  hasActionsColumn,
}: DataGridTableRowProps<T>) {
  const key =
    typeof rowKey === "function" ? rowKey(record) : (record as any)[rowKey];
  const rowProps = onRow?.(record, index) || {};

  const checkboxDisabled = rowSelection?.getCheckboxProps?.(record)?.disabled;

  return (
    <tr
      className={cn(
        "border-b",
        DASHTAIL_COLORS.neutralBorder,
        striped && index % 2 === 1 && DASHTAIL_COLORS.neutralBgLight,
        hoverable && "hover:bg-primary-50 transition-colors", // Use primary-50 for hover
        isSelected && "bg-primary-50", // Use primary-50 for selected
      )}
      {...rowProps}
    >
      {rowSelection && (
        <td className={cn(DASHTAIL_SPACING.cellPadding)}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(key, e.target.checked)}
            className={cn(
              "rounded",
              DASHTAIL_COLORS.neutralBorderControl,
              DASHTAIL_COLORS.primaryText,
              DASHTAIL_COLORS.primaryFocusRing,
            )}
            disabled={checkboxDisabled}
          />
        </td>
      )}
      {columns.map((column) => {
        const value = (record as any)[column.dataIndex];
        const content = column.render
          ? column.render(value, record, index)
          : String(value ?? ""); // Ensure string for content

        const fixedClasses = cn(
          "relative", // Needed for shadow
          column.fixed === "left" && "sticky left-0 z-[1] shadow-right", // Add z-index for fixed columns, adjust shadow as needed
          column.fixed === "right" && "sticky right-0 z-[1] shadow-left", // Add z-index for fixed columns
          (column.fixed === "left" || column.fixed === "right") && DASHTAIL_COLORS.neutralBgLightest, // Fixed cells need background
        );

        return (
          <td
            key={column.key}
            className={cn(
              DASHTAIL_SPACING.cellPadding,
              DASHTAIL_TYPOGRAPHY.cellText,
              DASHTAIL_COLORS.neutralTextDark,
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              fixedClasses,
            )}
            style={column.fixed ? { left: column.fixed === "left" ? 0 : 'auto', right: column.fixed === "right" ? 0 : 'auto' } : undefined}
          >
            {content}
          </td>
        );
      })}
      {hasActionsColumn && (
        <td className={cn(
          DASHTAIL_SPACING.cellPadding,
          "text-center w-16 sticky right-0 z-[1]", // Ensure sticky, z-index and bg
          DASHTAIL_COLORS.neutralBgLightest, // Actions column needs background
        )}>
          <DataGridRowActions
            record={record}
            actions={actions}
            MoreVerticalIcon={MoreVerticalIcon}
          />
        </td>
      )}
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

    if (totalPages > 1 && !pages.includes(totalPages)) { // Always show last page if more than 1 page
      pages.push(totalPages);
    }

    return Array.from(new Set(pages)); // Remove duplicates if any
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn(
      "flex flex-col md:flex-row items-center justify-between",
      DASHTAIL_SPACING.paginationPadding,
      DASHTAIL_COLORS.neutralBgLight,
      "border-t",
      DASHTAIL_COLORS.neutralBorder,
      DASHTAIL_SPACING.gapSm, // Adjusted gap for responsive
    )}>
      <div className={cn(DASHTAIL_TYPOGRAPHY.paginationText, DASHTAIL_COLORS.neutralTextMedium)}>
        顯示第 {startItem} - {endItem} 筆，共 {total} 筆資料
      </div>

      <div className={cn("flex items-center", DASHTAIL_SPACING.gapMd, "flex-wrap justify-center")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(current - 1, pageSize)}
          disabled={current <= 1}
          className="min-w-[80px]"
        >
          上一頁
        </Button>

        <div className={cn("flex items-center", DASHTAIL_SPACING.gapSm)}>
          {pageNumbers.map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${index}`} className={cn(
                "w-8 h-8 flex items-center justify-center",
                DASHTAIL_TYPOGRAPHY.paginationText,
                DASHTAIL_COLORS.neutralTextMedium
              )}>
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onChange(pageNum as number, pageSize)}
                className={cn(
                  "w-8 h-8",
                  DASHTAIL_TYPOGRAPHY.paginationText,
                  "rounded border transition-colors flex items-center justify-center",
                  current === pageNum
                    ? cn(DASHTAIL_COLORS.primaryBg, "text-white", DASHTAIL_COLORS.primaryBg)
                    : cn("bg-white", DASHTAIL_COLORS.neutralTextMedium, DASHTAIL_COLORS.neutralBorderControl, DASHTAIL_COLORS.neutralBgHover),
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
            className={cn(
              "ml-2 py-1 px-2 border rounded-md",
              DASHTAIL_TYPOGRAPHY.paginationText,
              DASHTAIL_COLORS.neutralTextMedium,
              DASHTAIL_COLORS.neutralBorderControl,
              DASHTAIL_COLORS.primaryFocusRing,
              DASHTAIL_COLORS.primaryFocusBorder,
            )}
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
          <div className={cn("ml-2 flex items-center", DASHTAIL_SPACING.gapSm, DASHTAIL_COLORS.neutralTextMedium)}>
            跳至
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={current} // Use defaultValue for uncontrolled input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const page = Number((e.target as HTMLInputElement).value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    onChange(page, pageSize);
                    (e.target as HTMLInputElement).value = page.toString(); // Update input value after valid jump
                  } else {
                    (e.target as HTMLInputElement).value = current.toString(); // Revert to current page on invalid input
                  }
                }
              }}
              className={cn(
                "w-12 py-1 px-2 border rounded-md text-center",
                DASHTAIL_TYPOGRAPHY.paginationText,
                DASHTAIL_COLORS.neutralTextMedium,
                DASHTAIL_COLORS.neutralBorderControl,
                DASHTAIL_COLORS.primaryFocusRing,
                DASHTAIL_COLORS.primaryFocusBorder,
              )}
              aria-label="跳至頁碼"
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
      <td colSpan={colSpan} className={cn(DASHTAIL_SPACING.cellPadding, "py-8 text-center", DASHTAIL_COLORS.neutralTextLight)}>
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
      <td colSpan={colSpan} className={cn(DASHTAIL_SPACING.cellPadding, "py-8 text-center", DASHTAIL_COLORS.neutralTextLight)}>
        <div className="flex items-center justify-center">
          <LoadingIcon className={cn("w-5 h-5 animate-spin mr-2", DASHTAIL_COLORS.primaryText)} />
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
    <div className={cn(
      "flex flex-col md:flex-row items-center justify-between",
      DASHTAIL_SPACING.toolbarPadding,
      "border-b",
      DASHTAIL_COLORS.neutralBorder,
      DASHTAIL_SPACING.gapLg, // Adjusted gap for responsiveness
    )}>
      <div className={cn("flex flex-col md:flex-row items-center", DASHTAIL_SPACING.gapLg, "w-full md:w-auto")}>
        {toolbar.title && (
          <h3 className={cn(DASHTAIL_TYPOGRAPHY.titleText, DASHTAIL_COLORS.neutralTextDark)}>
            {toolbar.title}
          </h3>
        )}

        {toolbar.search && (
          <div className="relative w-full md:w-auto">
            <SearchIcon className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4", DASHTAIL_COLORS.neutralTextMuted)} />
            <input
              type="text"
              placeholder={toolbar.search.placeholder || "搜尋..."}
              value={searchValue}
              onChange={(e) => {
                onSearchChange(e.target.value);
                toolbar.search?.onSearch?.(e.target.value);
              }}
              className={cn(
                "w-full pl-10 pr-4 py-2 border rounded-lg",
                DASHTAIL_COLORS.neutralBorderControl,
                DASHTAIL_COLORS.primaryFocusRing,
                "focus:border-transparent", // Tailwind focuses usually replace border with ring
                DASHTAIL_TYPOGRAPHY.cellText,
              )}
            />
          </div>
        )}
      </div>

      <div className={cn("flex items-center", DASHTAIL_SPACING.gapMd, "flex-wrap justify-end")}>
        {toolbar.refresh && (
          <Button
            variant="ghost"
            onClick={toolbar.refresh.onRefresh}
            className={cn("!p-2", DASHTAIL_COLORS.neutralTextMedium, "hover:text-primary-700")}
          >
            <RefreshIcon className="w-4 h-4" />
          </Button>
        )}

        {toolbar.export && (
          <Button
            variant="ghost"
            onClick={toolbar.export.onExport}
            className={cn(DASHTAIL_COLORS.neutralTextMedium, "hover:text-primary-700")}
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

  // Keep selectedRowKeys in sync if rowSelection.selectedRowKeys changes externally
  useEffect(() => {
    if (rowSelection?.selectedRowKeys) {
      setSelectedRowKeys(rowSelection.selectedRowKeys);
    }
  }, [rowSelection?.selectedRowKeys]);

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

  const getRowKey = useCallback((record: T) => {
    return typeof rowKey === "function"
      ? rowKey(record)
      : (record as any)[rowKey];
  }, [rowKey]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      let newSelectedKeys: React.Key[] = [];
      let newSelectedRecords: T[] = [];

      if (checked) {
        newSelectedKeys = processedData
          .filter(record => !rowSelection?.getCheckboxProps?.(record)?.disabled)
          .map(getRowKey);
        newSelectedRecords = processedData.filter(record =>
          newSelectedKeys.includes(getRowKey(record))
        );
      }
      setSelectedRowKeys(newSelectedKeys);
      rowSelection?.onChange?.(newSelectedKeys, newSelectedRecords);
    },
    [processedData, getRowKey, rowSelection],
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
        const recordKey = getRowKey(record);
        return newSelectedKeys.includes(recordKey);
      });
      rowSelection?.onChange?.(newSelectedKeys, selectedRecords);
    },
    [selectedRowKeys, data, getRowKey, rowSelection],
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

          // Handle null/undefined values for sorting
          if (aValue === null || aValue === undefined) return order === "asc" ? -1 : 1;
          if (bValue === null || bValue === undefined) return order === "asc" ? 1 : -1;

          if (typeof aValue === "string" && typeof bValue === "string") {
            return order === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          if (typeof aValue === "number" && typeof bValue === "number") {
            return order === "asc" ? aValue - bValue : bValue - aValue;
          }
          // Fallback for other types or mixed types: attempt string conversion
          return order === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
        });
      }
    }

    return result;
  }, [data, searchValue, toolbar?.search, sortState, onSortChange]);

  const hasActionsColumn = actions?.show === true;
  const colCount = columns.length + (rowSelection ? 1 : 0) + (hasActionsColumn ? 1 : 0);

  const allRowsSelectableKeys = useMemo(() => 
    processedData
      .filter(record => !rowSelection?.getCheckboxProps?.(record)?.disabled)
      .map(getRowKey),
    [processedData, rowSelection, getRowKey]
  );
  const allRowsSelected = selectedRowKeys.length > 0 && 
                          allRowsSelectableKeys.length > 0 && 
                          allRowsSelectableKeys.every(key => selectedRowKeys.includes(key));
  const allRowsSelectable = allRowsSelectableKeys.length > 0;

  return (
    <div
      className={cn(
        "p-0 bg-white rounded-lg",
        DASHTAIL_COLORS.shadow, // Standard Dashtail card structure
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
              "min-w-full divide-y",
              DASHTAIL_COLORS.neutralBorder,
              bordered && cn("border", DASHTAIL_COLORS.neutralBorder), // Apply border to table
            )}
          >
            <DataGridTableHead
              columns={columns}
              sortState={sortState}
              onSort={handleSort}
              rowSelection={rowSelection}
              onSelectAll={handleSelectAll}
              allRowsSelected={allRowsSelected}
              allRowsSelectable={allRowsSelectable}
              SortAscIcon={SortAscIcon}
              SortDescIcon={SortDescIcon}
              SortDefaultIcon={SortDefaultIcon}
              hasActionsColumn={hasActionsColumn}
            />

            <tbody className={cn("divide-y", DASHTAIL_COLORS.neutralBorder, DASHTAIL_COLORS.neutralBgLightest)}>
              {loading ? (
                <DataGridLoadingState colSpan={colCount} LoadingIcon={LoadingIcon} />
              ) : processedData.length === 0 ? (
                <DataGridEmptyState colSpan={colCount} />
              ) : (
                processedData.map((record, index) => {
                  const key = getRowKey(record);
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
                      hasActionsColumn={hasActionsColumn}
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
// Export types
export type { DataGridProps, Column, IconComponentType } from './DataGrid.types';
