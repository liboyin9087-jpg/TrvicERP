/**
 * Kintone Design System Type Definitions
 * Provides TypeScript types for the Kintone-styled design system
 */

export type KintoneTheme = 'light' | 'dark' | 'system';

export type KintoneSize = 'small' | 'medium' | 'large';

export type KintoneVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface KintoneComponentProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  'data-testid'?: string;
}

export interface KintoneButtonProps extends KintoneComponentProps {
  variant?: KintoneVariant;
  size?: KintoneSize;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

export interface KintoneInputProps extends KintoneComponentProps {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  size?: KintoneSize;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

export interface KintoneSelectProps extends KintoneComponentProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  size?: KintoneSize;
  multiple?: boolean;
  label?: string;
  required?: boolean;
}

export interface KintoneModalProps extends KintoneComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface KintoneTableColumn {
  key: string;
  title: string;
  width?: number | string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface KintoneTableProps extends KintoneComponentProps {
  columns: KintoneTableColumn[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (row: any) => void;
}

export interface KintoneMobileProps {
  isMobile?: boolean;
  orientation?: 'portrait' | 'landscape';
}
