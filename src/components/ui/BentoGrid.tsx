import * as React from 'react';

interface BentoGridConfig {
  /**
   * The content to be rendered within the grid items.
   */
  children: React.ReactNode;
  /**
   * Optional custom CSS class for the main grid container.
   */
  className?: string;
  /**
   * Optional custom CSS class to be applied to each individual grid item.
   */
  itemClassName?: string;
  /**
   * Defines the number of columns for the grid. Can be a single number or an object
   * for responsive column configurations (e.g., `{ base: 1, sm: 2, md: 3, lg: 4 }`).
   * Uses Tailwind's standard responsive breakpoints.
   */
  columns?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number; '2xl'?: number };
  /**
   * Tailwind CSS class for defining the gap between grid items (e.g., 'gap-4').
   */
  gap?: string;
  /**
   * Optional title for the BentoGrid widget card.
   */
  title?: string;
  /**
   * Optional description for the BentoGrid widget card.
   */
  description?: string;
}

// Helper function to construct grid column classes for responsive layouts
const getGridColumnClasses = (columns: BentoGridConfig['columns']): string => {
  if (typeof columns === 'number') {
    return `grid-cols-${columns}`;
  }
  if (typeof columns === 'object') {
    const classes = [];
    if (columns.base !== undefined) classes.push(`grid-cols-${columns.base}`); // Base column for all sizes
    if (columns.sm !== undefined) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md !== undefined) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg !== undefined) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl !== undefined) classes.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl'] !== undefined) classes.push(`2xl:grid-cols-${columns['2xl']}`);
    return classes.join(' ');
  }
  return 'grid-cols-1'; // Fallback default
};

export const BentoGrid: React.FC<BentoGridConfig> = ({
  children,
  className,
  itemClassName,
  columns = { base: 1, sm: 1, md: 2, lg: 3 }, // Default responsive columns
  gap = 'gap-4', // Default gap
  title,
  description,
}) => {
  const gridColumnClasses = getGridColumnClasses(columns);

  return (
    // Standard Card structure for a widget
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full h-full p-4">
      {(title || description) && (
        <div className="flex flex-col space-y-1.5 pb-4 border-b border-border mb-4">
          {/* Drag handle area for Kintone independence */}
          <div className="drag-handle cursor-grab flex items-center justify-between">
            {title && <h3 className="text-xl font-semibold leading-none tracking-tight">{title}</h3>}
            {/* Optionally add a drag icon here, e.g., <DragIcon className="h-5 w-5 text-muted-foreground" /> */}
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div
        className={
          `grid auto-rows-fr ${gridColumnClasses} ${gap} ${className || ''}`
        }
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Clone element to inject itemClassName if provided
            return React.cloneElement(child, {
              className: `${child.props.className || ''} ${itemClassName || ''}`,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};


// Companion component for individual items within the BentoGrid
interface BentoGridItemConfig {
  /**
   * Optional custom CSS class for the individual grid item.
   */
  className?: string;
  /**
   * The main content of the BentoGrid item.
   */
  children?: React.ReactNode;
  /**
   * Optional header content for the item.
   */
  header?: React.ReactNode;
  /**
   * Optional icon to display within the item.
   */
  icon?: React.ReactNode;
  /**
   * Optional title for the item.
   */
  title?: string;
  /**
   * Optional description for the item.
   */
  description?: string;
}

export const BentoGridItem: React.FC<BentoGridItemConfig> = ({
  className,
  children,
  header,
  icon,
  title,
  description,
}) => {
  return (
    <div
      className={
        `row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-zinc-900 dark:border-zinc-800 bg-white border border-transparent justify-between flex flex-col space-y-4 ${className}`
      }
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        {title && <div className="font-sans font-bold text-gray-600 dark:text-gray-200 mb-2 mt-2">
          {title}
        </div>}
        {description && <div className="font-sans font-normal text-gray-700 text-xs dark:text-gray-300">
          {description}
        </div>}
        {children}
      </div>
    </div>
  );
};