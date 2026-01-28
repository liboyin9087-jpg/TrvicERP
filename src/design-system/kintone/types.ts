/**
 * Kintone Design System Type Definitions
 * Provides TypeScript types for the Kintone-styled design system
 */

export type KintoneTheme = 'light' | 'dark' | 'system';

export type KintoneSize = 'small' | 'medium' | 'large';

export type KintoneVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Base properties for all Kintone components.
 */
export interface KintoneComponentProps {
  /**
   * Optional CSS class names for custom styling.
   * Please prioritize using Tailwind CSS utility classes where possible.
   */
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  'data-testid'?: string;
  /**
   * Indicates if the component is being rendered on a mobile device.
   */
  isMobile?: boolean;
  /**
   * The orientation of the device (portrait or landscape).
   */
  orientation?: 'portrait' | 'landscape';
  /**
   * Specifies a class name for the drag handle element if the component is designed to be draggable.
   * Components supporting drag-and-drop should ensure an element with this class exists.
   */
  dragHandleClassName?: string;
}

/**
 * A base interface for defining configuration objects for Kintone widgets.
 * Specific widgets should extend this interface to define their unique configuration properties.
 */
export interface KintoneBaseWidgetConfig {
  /**
   * A unique identifier for the widget instance, useful for layout or state management.
   */
  widgetId?: string;
  // Add other common widget configuration properties here if necessary.
}

/**
 * Base properties for Kintone components designed to act as independent widgets (e.g., draggable cards).
 * Extends KintoneComponentProps and includes properties for card structure and a configuration object.
 */
export interface KintoneWidgetProps<ConfigType extends KintoneBaseWidgetConfig = KintoneBaseWidgetConfig>
  extends KintoneComponentProps {
  /**
   * If true, the component will be rendered within a standard Kintone-style card wrapper,
   * providing a consistent UI for widgets.
   */
  hasCardWrapper?: boolean;
  /**
   * Title displayed in the card header when `hasCardWrapper` is true.
   */
  widgetTitle?: string;
  /**
   * Description displayed below the title in the card header.
   */
  widgetDescription?: string;
  /**
   * A configuration object specific to this widget, allowing it to receive all necessary
   * data and settings via props without relying on global stores.
   */
  config?: ConfigType;
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

/**
 * Defines a column for the KintoneTable. It is generic over the row data type `T`.
 */
export interface KintoneTableColumn<T extends Record<string, any>> {
  /**
   * The key corresponding to a property in the row data `T` to display in this column.
   */
  key: keyof T;
  /**
   * The display title for the column header.
   */
  title: string;
  /**
   * Optional width for the column, can be a number (pixels) or string (e.g., '100px', '20%').
   */
  width?: number | string;
  /**
   * If true, the column can be used for sorting the table data.
   */
  sortable?: boolean;
  /**
   * A custom render function for the column's cell content.
   * @param value The value of the cell, strictly typed as `T[keyof T]` based on the column's `key`.
   * @param row The full data row object, strictly typed as `T`.
   * @param rowIndex The index of the current row in the table data array.
   * @returns A ReactNode to be rendered in the cell.
   */
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
}

/**
 * Configuration specific to the KintoneTable widget.
 * Extends KintoneBaseWidgetConfig to include table-specific settings.
 */
export interface KintoneTableWidgetConfig<T extends Record<string, any>> extends KintoneBaseWidgetConfig {
  /**
   * The default column key to sort by when the table initially loads.
   */
  defaultSortColumn?: keyof T;
  /**
   * The default sorting direction ('asc' for ascending, 'desc' for descending).
   */
  defaultSortDirection?: 'asc' | 'desc';
  // Add other table-specific configurations (e.g., default filters, column visibility) here.
}

/**
 * Properties for the KintoneTable component. It is generic over the row data type `T`
 * and its specific widget configuration type `C`.
 */
export interface KintoneTableProps<
  T extends Record<string, any>,
  C extends KintoneTableWidgetConfig<T> = KintoneTableWidgetConfig<T>
> extends KintoneWidgetProps<C> {
  /**
   * An array of column definitions for the table.
   */
  columns: KintoneTableColumn<T>[];
  /**
   * The data to be displayed in the table, strictly typed as an array of `T` objects.
   */
  data: T[];
  /**
   * If true, a loading indicator will be shown over the table.
   */
  loading?: boolean;
  /**
   * Pagination settings for the table.
   */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  /**
   * Callback function triggered when a row is clicked, providing the strictly typed `row` data.
   * @param row The full data row object that was clicked.
   */
  onRowClick?: (row: T) => void;
}