/**
 * Enhanced Empty State Component
 * Guides users when there's no data with actionable suggestions
 */

import React from 'react';
import { 
  FileText, 
  Users, 
  Calendar, 
  Package, 
  Search,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { KintoneButton } from '../../src/design-system/components/KintoneButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Generic Empty State
 */
export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
      <div className="mb-4 text-gray-400">
        {icon || <Inbox className="w-16 h-16" />}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <KintoneButton
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            size="medium"
          >
            {action.label}
          </KintoneButton>
        )}
        {secondaryAction && (
          <KintoneButton
            variant="secondary"
            onClick={secondaryAction.onClick}
            size="medium"
          >
            {secondaryAction.label}
          </KintoneButton>
        )}
      </div>
    </div>
  );
}

/**
 * Specific Empty State variations
 */

export function NoCustomersEmptyState({ onAddCustomer }: { onAddCustomer: () => void }) {
  return (
    <EmptyState
      icon={<Users className="w-16 h-16" />}
      title="還沒有客戶資料"
      description="建立第一位客戶，開始管理您的業務關係"
      action={{
        label: '新增客戶',
        onClick: onAddCustomer,
        variant: 'primary',
      }}
    />
  );
}

export function NoItinerariesEmptyState({ onCreateItinerary }: { onCreateItinerary: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="w-16 h-16" />}
      title="還沒有行程規劃"
      description="建立第一個行程，為客戶提供完美的旅遊體驗"
      action={{
        label: '建立行程',
        onClick: onCreateItinerary,
        variant: 'primary',
      }}
    />
  );
}

export function NoQuotationsEmptyState({ onCreateQuotation }: { onCreateQuotation: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title="還沒有報價單"
      description="建立報價單，快速回應客戶需求"
      action={{
        label: '建立報價單',
        onClick: onCreateQuotation,
        variant: 'primary',
      }}
    />
  );
}

export function NoProductsEmptyState({ onAddProduct }: { onAddProduct: () => void }) {
  return (
    <EmptyState
      icon={<Package className="w-16 h-16" />}
      title="還沒有產品"
      description="新增旅遊產品，豐富您的產品庫"
      action={{
        label: '新增產品',
        onClick: onAddProduct,
        variant: 'primary',
      }}
    />
  );
}

export function NoSearchResultsEmptyState({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={<Search className="w-16 h-16" />}
      title="找不到相關結果"
      description="請嘗試使用其他關鍵字，或清除篩選條件"
      action={{
        label: '清除搜尋',
        onClick: onClearSearch,
        variant: 'secondary',
      }}
    />
  );
}
