/**
 * TrvicERP Shared Components
 *
 * Export all shared/common components from this index file.
 * Import components like: import { Button, Card, Input } from '@/components/shared';
 */

// Button
export { Button, FAB, ButtonGroup } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, FABProps, ButtonGroupProps } from './Button';

// Card
export { Card, CardHeader, CardBody, CardFooter, StatCard } from './Card';
export type { CardProps, CardVariant, CardHeaderProps, CardBodyProps, CardFooterProps, StatCardProps } from './Card';

// Input & Form Controls
export { Input, Textarea, Select, Checkbox } from './Input';
export type { InputProps, TextareaProps, SelectProps, SelectOption, CheckboxProps } from './Input';

// DataTable
export { DataTable, BatchActionsBar, Pagination } from './DataTable';
export type { DataTableProps, Column } from './DataTable';

// Badge & Status
export {
  Badge,
  TourStatusBadge,
  PaymentStatusBadge,
  StatusIndicator,
  CountBadge,
  TrendIndicator,
} from './Badge';
export type {
  BadgeProps,
  BadgeVariant,
  TourStatus,
  PaymentStatus,
  StatusIndicatorVariant,
} from './Badge';

// Modal
export { default as Modal, ConfirmDialog } from './Modal';
export type { ModalProps, ModalSize, ConfirmDialogProps } from './Modal';

// Loading
export { default as Loading } from './Loading';

// Toast
export { default as Toast } from './Toast';
export { default as ToastContainer } from './ToastContainer';

// Empty State
export { default as EmptyState } from './EmptyState';

// Error Boundary
export { default as ErrorBoundary } from './ErrorBoundary';
