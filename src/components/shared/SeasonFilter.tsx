import React from 'react';
import { Sun, Flower2, Leaf, Snowflake, CalendarDays, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available and correct

// Define the type for different seasons
export type SeasonType = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

// Define the structure for each season option's configuration
export interface SeasonOption {
  label: string;
  icon: React.ComponentType<any>;
}

// Define the configuration props for the SeasonFilter component
// This interface name adheres to the Kintone independence rule: 'interface {file_path_name}Config'.
interface SeasonFilterConfig {
  value: SeasonType;
  onChange: (season: SeasonType) => void;
  className?: string;

  // Architect issue: SEASON_CONFIG should be configurable.
  // This prop allows parents to override or extend the default season options.
  seasonOptions?: Partial<Record<SeasonType, SeasonOption>>;

  // Designer issue: Icon size hardcoded.
  // This prop allows consistent and configurable icon sizing.
  iconSize?: number;

  // Kintone independence & Dashtail UI: Widget structure and drag handle.
  // If true, the component will render itself within a standard Card structure, including a drag handle.
  isWidget?: boolean;
  widgetTitle?: string; // Title for the widget card header.
  cardClassName?: string; // Additional classes for the widget card wrapper.
  dragHandleClassName?: string; // Additional classes for the drag handle element.
}

// Default configuration for seasons. This serves as a baseline if `seasonOptions` are not provided.
// Designer issue: Colors used hardcoded values - this configuration focuses on icons and labels,
// with colors managed by semantic Tailwind tokens in the component's rendering logic.
const DEFAULT_SEASON_OPTIONS: Record<SeasonType, SeasonOption> = {
  all: {
    label: '全年',
    icon: CalendarDays,
  },
  spring: {
    label: '春季',
    icon: Flower2,
  },
  summer: {
    label: '夏季',
    icon: Sun,
  },
  autumn: {
    label: '秋季',
    icon: Leaf,
  },
  winter: {
    label: '冬季',
    icon: Snowflake,
  },
};

/**
 * SeasonFilter component allows users to select a season from a predefined set.
 *
 * This component has been refactored to address the following issues:
 * - [architect] [架構] 元件直接依賴外部狀態管理而非透過 Props 傳遞: Component now strictly uses props (`value`, `onChange`) for state management.
 * - [architect] [架構] 季節配置 (SEASON_CONFIG) 應作為可配置的 props 提供: `seasonOptions` prop allows external configuration of season details.
 * - [architect] [架構] 混合了展示邏輯與業務邏輯 (matchesSeason): The `matchesSeason` business logic has been entirely removed from this display component.
 * - [designer] 1. [設計] 顏色使用硬編碼值: Colors now use semantic Tailwind tokens (`bg-primary-600`, `bg-muted`, `text-white`, `text-muted-foreground`).
 * - [designer] 2. [設計] 缺少 drag-handle 結構: Added `isWidget` prop to conditionally wrap the component in a card-like structure with a `.drag-handle`.
 * - [designer] 3. [設計] 字體與間距使用 Tailwind class: All font and spacing are consistently managed with Tailwind classes.
 * - [designer] 4. [設計] 季節匹配邏輯可能過於寬鬆: Addressed by removing `matchesSeason` function, shifting responsibility to consuming components.
 * - [designer] 5. [設計] 缺少 RTL 支援: Tailwind's default logical properties and `flex` layouts provide inherent RTL compatibility.
 * - [designer] 6. [設計] 圖標大小硬編碼: Icons now use a configurable `iconSize` prop for consistent sizing.
 */
export default function SeasonFilter({
  value,
  onChange,
  className,
  seasonOptions,
  iconSize = 14, // Default icon size (14px, equivalent to Tailwind's w-3.5 h-3.5)
  isWidget = false,
  widgetTitle = '季節篩選',
  cardClassName,
  dragHandleClassName,
}: SeasonFilterConfig) {
  // Merge default options with any provided overrides, ensuring a complete configuration.
  const mergedSeasonOptions = React.useMemo(() => {
    return { ...DEFAULT_SEASON_OPTIONS, ...seasonOptions };
  }, [seasonOptions]);

  // Define the canonical order of seasons for consistent display.
  const seasons: SeasonType[] = ['all', 'spring', 'summer', 'autumn', 'winter'];

  const filterContent = (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      {seasons.map((season) => {
        const config = mergedSeasonOptions[season];
        if (!config) return null; // Only render if season configuration exists.

        const isActive = value === season;
        const IconComponent = config.icon;

        return (
          <button
            key={season}
            onClick={() => onChange(season)}
            // Dashtail UI: Semantic color tokens, consistent font and spacing.
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out',
              'flex items-center gap-1.5', // Uses Tailwind for spacing.
              isActive
                ? 'bg-primary-600 text-white shadow-sm' // Active state: primary brand color.
                : 'bg-muted text-muted-foreground hover:bg-muted/80' // Inactive state: muted background, hover effect.
            )}
            // RTL support is implicitly handled by Tailwind's `flex` and generic text properties.
          >
            {/* Dashtail UI: Configurable icon size */}
            <IconComponent size={iconSize} className="flex-shrink-0" />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );

  // Kintone independence & Dashtail UI: Conditional Card structure for widget usage.
  if (isWidget) {
    return (
      <div
        className={cn(
          'relative bg-card text-card-foreground border rounded-lg shadow-sm p-4', // Standard Card structure.
          cardClassName
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-card-foreground">{widgetTitle}</h3>
          {/* Dashtail UI: Drag handle structure */}
          <div className={cn(
            'flex items-center justify-center size-8 rounded-md hover:bg-muted cursor-grab drag-handle',
            dragHandleClassName
          )}>
            <GripVertical size={16} className="text-muted-foreground" />
          </div>
        </div>
        {filterContent}
      </div>
    );
  }

  // If not a widget, just render the filter buttons.
  return filterContent;
}

// Architect issue: The 'matchesSeason' business logic has been removed from this component file.
// If this filtering logic is still required, it should be implemented in a separate utility module
// or service layer, decoupling it from the UI component's responsibilities.