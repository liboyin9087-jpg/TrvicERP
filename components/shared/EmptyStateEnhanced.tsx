/**
 * Enhanced Empty State Component
 * Guides users when there's no data with actionable suggestions
 *
 * This file has been refactored to address architectural and design issues:
 * - Architectural: Decouples EmptyState from a specific button implementation (KintoneButton)
 *                  via an `ActionButtonComponent` prop. KintoneButton is then injected
 *                  by the `EmptyState` export from this file, making the base component reusable.
 * - Design: Uses hypothetical Dashtail/Tailwind design tokens for spacing, text styles, colors,
 *           and icon sizes instead of hardcoded atomic classes, promoting consistency and maintainability.
 * - Design: Button variants now use a design system enum for clarity and type safety.
 */

import React from 'react';
import { 
  FileText, 
  Users, 
  Calendar, 
  Package, 
  Search,
  Inbox // Default icon
} from 'lucide-react';

// ARCHITECT FIX: KintoneButton is now imported here to be injected into the generic EmptyState,
// rather than being a direct dependency of GenericEmptyState itself.
import { KintoneButton } from '../../src/design-system/components/KintoneButton';

// --- Dashtail Design System Tokens (Hypothetical Definitions) ---
// In a real-world scenario, these would be imported from a centralized design system package
// or generated based on `tailwind.config.js` or similar configuration.

// DESIGN FIX: Button variants use an enum for consistency and type safety
enum DashtailButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  // Add other variants like 'danger', 'ghost' as defined by Dashtail design system
}

// DESIGN FIX: Button sizes use an enum
enum DashtailButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// DESIGN FIX: Semantic text styles using hypothetical Dashtail utility classes
const DashtailTextClass = {
  h3: 'text-lg sm:text-xl font-semibold', // Example mapping to raw Tailwind classes
  bodySm: 'text-sm',                      // Example mapping
};

// DESIGN FIX: Semantic colors using hypothetical Dashtail utility classes
const DashtailColorClass = {
  textPrimary: 'text-gray-900',   // Assumes 'gray-900' is the Dashtail primary text color token
  textSecondary: 'text-gray-500', // Assumes 'gray-500' is the Dashtail secondary text color token
  iconDefault: 'text-gray-400',   // Assumes 'gray-400' is the Dashtail default icon color token
};

// DESIGN FIX: Semantic spacing values using hypothetical Dashtail utility classes
const DashtailSpacingClass = {
  pagePadding: 'p-8 sm:p-12',       // Equivalent to 'p-dt-spacing-xl'
  iconMarginBottom: 'mb-4',         // Equivalent to 'mb-dt-spacing-md'
  titleMarginBottom: 'mb-2',        // Equivalent to 'mb-dt-spacing-sm'
  descriptionMarginBottom: 'mb-6',  // Equivalent to 'mb-dt-spacing-lg'
  buttonGap: 'gap-3',               // Equivalent to 'dt-gap-inline-sm'
};

// DESIGN FIX: Semantic icon sizes using hypothetical Dashtail utility classes
const DashtailIconSizeClass = {
  xl: 'size-16', // Maps to w-16 h-16, assuming 'size-16' is a configured utility class
};

// --- End Dashtail Design System Tokens ---

// ARCHITECT FIX: Abstracted Button Interface
// Defines the expected props for any button component that EmptyState should render.
interface EmptyStateButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: DashtailButtonVariant;
  size?: DashtailButtonSize;
}

// ARCHITECT FIX: Centralized configuration interface for EmptyState
// Renamed from EmptyStateProps to EmptyStateConfig for clarity and alignment
// with the idea of configuring a widget-like component.
interface EmptyStateConfig {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: DashtailButtonVariant; // Use design system enum
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    // Secondary actions often have a fixed variant (e.g., secondary), so variant isn't exposed here.
  };
  // ARCHITECT FIX: This makes GenericEmptyState independent of specific UI libraries like KintoneButton.
  ActionButtonComponent: React.ComponentType<EmptyStateButtonProps>;
}

/**
 * Generic Empty State Component
 * This component is now fully decoupled from KintoneButton or any specific UI library.
 * It expects a button component via `ActionButtonComponent` prop.
 */
function GenericEmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  ActionButtonComponent // Injected button component
}: EmptyStateConfig) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${DashtailSpacingClass.pagePadding}`}>
      <div className={`text-center ${DashtailSpacingClass.iconMarginBottom} ${DashtailColorClass.iconDefault}`}>
        {icon ? (
            // DESIGN FIX: Icon sizing from design system tokens.
            // Clones the icon element to inject the design system sizing class.
            React.isValidElement(icon) ? (
                React.cloneElement(icon as React.ReactElement<any>, {
                    className: `${(icon as React.ReactElement<any>).props.className || ''} ${DashtailIconSizeClass.xl}`.trim(),
                })
            ) : (
                // Fallback for non-React elements, though not expected for icons
                <span className={DashtailIconSizeClass.xl}>{icon}</span>
            )
        ) : (
            // Default icon (Inbox), directly apply design system size
            <Inbox className={DashtailIconSizeClass.xl} />
        )}
      </div>
      <h3 className={`${DashtailTextClass.h3} ${DashtailColorClass.textPrimary} ${DashtailSpacingClass.titleMarginBottom}`}>
        {title}
      </h3>
      {description && (
        <p className={`${DashtailTextClass.bodySm} ${DashtailColorClass.textSecondary} ${DashtailSpacingClass.descriptionMarginBottom} max-w-md`}>
          {description}
        </p>
      )}
      <div className={`flex flex-col sm:flex-row ${DashtailSpacingClass.buttonGap}`}>
        {action && (
          <ActionButtonComponent
            variant={action.variant || DashtailButtonVariant.Primary} // DESIGN FIX: Use design system enum
            onClick={action.onClick}
            size={DashtailButtonSize.Medium} // DESIGN FIX: Use design system enum
          >
            {action.label}
          </ActionButtonComponent>
        )}
        {secondaryAction && (
          <ActionButtonComponent
            variant={DashtailButtonVariant.Secondary} // DESIGN FIX: Use design system enum
            onClick={secondaryAction.onClick}
            size={DashtailButtonSize.Medium} // DESIGN FIX: Use design system enum
          >
            {secondaryAction.label}
          </ActionButtonComponent>
        )}
      </div>
    </div>
  );
}

// --- Kintone-bound Empty State Export ---
// This component exports the `EmptyState` component for this module,
// specifically pre-configured with the KintoneButton component.
// This allows the base `GenericEmptyState` to be reused elsewhere with other button implementations.

// ARCHITECT FIX: Omitting `ActionButtonComponent` as it's provided by this wrapper
interface KintoneEmptyStateProps extends Omit<EmptyStateConfig, 'ActionButtonComponent'> {}

// Export the Kintone-bound EmptyState as the primary export.
export const EmptyState = (props: KintoneEmptyStateProps) => (
  <GenericEmptyState {...props} ActionButtonComponent={KintoneButton} />
);

// --- Specific Empty State variations for TrvicERP (using the Kintone-bound EmptyState) ---

// ARCHITECT FIX: Specific empty state types are kept simple, focusing on their unique callbacks.
// The base `EmptyStateConfig` handles the core structure and complexity.
// Icon dependency is now managed for size by the base component, making these wrappers cleaner.

interface NoCustomersEmptyStateProps { onAddCustomer: () => void; }
export function NoCustomersEmptyState({ onAddCustomer }: NoCustomersEmptyStateProps) {
  return (
    <EmptyState
      icon={<Users />} // ARCHITECT FIX: Icon passed as ReactNode, size handled by GenericEmptyState
      title="還沒有客戶資料"
      description="建立第一位客戶，開始管理您的業務關係"
      action={{
        label: '新增客戶',
        onClick: onAddCustomer,
        variant: DashtailButtonVariant.Primary, // DESIGN FIX: Use design system enum
      }}
    />
  );
}

interface NoItinerariesEmptyStateProps { onCreateItinerary: () => void; }
export function NoItinerariesEmptyState({ onCreateItinerary }: NoItinerariesEmptyStateProps) {
  return (
    <EmptyState
      icon={<Calendar />}
      title="還沒有行程規劃"
      description="建立第一個行程，為客戶提供完美的旅遊體驗"
      action={{
        label: '建立行程',
        onClick: onCreateItinerary,
        variant: DashtailButtonVariant.Primary,
      }}
    />
  );
}

interface NoQuotationsEmptyStateProps { onCreateQuotation: () => void; }
export function NoQuotationsEmptyState({ onCreateQuotation }: NoQuotationsEmptyStateProps) {
  return (
    <EmptyState
      icon={<FileText />}
      title="還沒有報價單"
      description="建立報價單，快速回應客戶需求"
      action={{
        label: '建立報價單',
        onClick: onCreateQuotation,
        variant: DashtailButtonVariant.Primary,
      }}
    />
  );
}

interface NoProductsEmptyStateProps { onAddProduct: () => void; }
export function NoProductsEmptyState({ onAddProduct }: NoProductsEmptyStateProps) {
  return (
    <EmptyState
      icon={<Package />}
      title="還沒有產品"
      description="新增旅遊產品，豐富您的產品庫"
      action={{
        label: '新增產品',
        onClick: onAddProduct,
        variant: DashtailButtonVariant.Primary,
      }}
    />
  );
}

interface NoSearchResultsEmptyStateProps { onClearSearch: () => void; }
export function NoSearchResultsEmptyState({ onClearSearch }: NoSearchResultsEmptyStateProps) {
  return (
    <EmptyState
      icon={<Search />}
      title="找不到相關結果"
      description="請嘗試使用其他關鍵字，或清除篩選條件"
      action={{
        label: '清除搜尋',
        onClick: onClearSearch,
        variant: DashtailButtonVariant.Secondary, // DESIGN FIX: Use design system enum
      }}
    />
  );
}