/**
 * DataGrid Type Definitions
 */

import React from 'react';

export type IconComponentType = React.ComponentType<{ className?: string; size?: number }>;

export interface Column<T = any> {
  key: keyof T;
  label: string;
  title?: string;
  dataIndex?: keyof T | string;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right' | boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  minWidth?: string;
}

export interface DataGridProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    pageSize: number;
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  selectable?: boolean;
  expandable?: boolean;
  expandRenderer?: (row: T, index: number) => React.ReactNode;
}
