import React from 'react';
import { z } from 'zod'; // For runtime validation
import { GripVertical } from 'lucide-react'; // Assuming lucide-react is available for icons

import type { Widget } from '@/core/types/dashboard';
import { WIDGET_COMPONENTS, WIDGET_TYPES, GenericWidgetComponentProps } from './widgetRegistry';

// --- Zod Schema for Widget Type Validation ---
// This schema validates the 'type' property of the incoming widget object
// against the list of known widget types from the registry.
const widgetTypeSchema = z.object({
  type: z.enum(WIDGET_TYPES as [string, ...string[]], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_value) {
        return {
          message: `Unsupported widget type: '${ctx.data}'. Expected one of: ${WIDGET_TYPES.join(', ')}.`,
        };
      }
      return { message: ctx.defaultError };
    },
  }),
});

// --- Component Props Definition ---
// This interface defines the props that WidgetRenderer expects.
// It directly uses the Widget type from core, aligning with the Kintone independence rule.
interface WidgetRendererProps {
  widget: Widget; // The widget data to be rendered
  // Additional props related to drag/drop or dashboard context can be added here
  isDragging?: boolean; // Example prop if there's a visual indication for dragging
}

/**
 * WidgetRenderer Component
 *
 * This component is responsible for dynamically rendering the correct widget component
 * based on the 'type' property of the provided widget data.
 * It also applies a standardized UI wrapper (card structure, drag handle)
 * and includes runtime validation for robustness.
 */
export default function WidgetRenderer({ widget, isDragging }: WidgetRendererProps) {
  // 1. Runtime Validation: Validate the widget's type property
  const validationResult = widgetTypeSchema.safeParse(widget);

  let WidgetComponent: React.ComponentType<GenericWidgetComponentProps> | undefined;
  let errorMessage: string | undefined;

  if (validationResult.success) {
    // If validation passes, get the component from the registry
    WidgetComponent = WIDGET_COMPONENTS[widget.type];
    if (!WidgetComponent) {
      // This case should ideally not happen if WIDGET_COMPONENTS and WIDGET_TYPES are consistent
      errorMessage = `No component registered for widget type: '${widget.type}'.`;
    }
  } else {
    // If validation fails, capture the error message
    const errorIssues = validationResult.error.issues || [];
    errorMessage = errorIssues[0]?.message || 'Invalid widget data provided.';
  }

  // Define the common card structure and styles using Tailwind CSS tokens
  const cardClasses = `
    relative h-full w-full
    bg-white dark:bg-gray-800
    shadow-md rounded-lg
    border border-gray-200 dark:border-gray-700
    flex flex-col
    ${isDragging ? 'opacity-75 ring-2 ring-primary-500 dark:ring-primary-400' : ''}
  `;

  const headerClasses = `
    flex items-center justify-between
    p-3 border-b border-gray-200 dark:border-gray-700
    bg-gray-50 dark:bg-gray-900
    rounded-t-lg
  `;

  const titleClasses = `
    text-sm font-semibold text-gray-800 dark:text-gray-100
    truncate
  `;

  const dragHandleClasses = `
    drag-handle
    cursor-grab active:cursor-grabbing
    text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
    transition-colors duration-200
    p-1 rounded-md
  `;

  const contentClasses = `
    flex-grow p-4 overflow-hidden
  `;

  const errorContainerClasses = `
    h-full flex flex-col items-center justify-center text-center
    text-gray-500 dark:text-gray-400 text-sm p-4
  `;

  return (
    <div className={cardClasses}>
      {/* Widget Header with Title and Drag Handle */}
      <div className={headerClasses}>
        <h3 className={titleClasses}>
          {widget.title || 'Untitled Widget'} {/* Assuming widget has a title */}
        </h3>
        <div className={dragHandleClasses}>
          <GripVertical size={16} /> {/* Drag handle icon */}
        </div>
      </div>

      {/* Widget Content Area */}
      <div className={contentClasses}>
        {errorMessage ? (
          // Display error message if validation failed or component not found
          <div className={errorContainerClasses}>
            <p className="font-medium mb-2">Widget Error</p>
            <p>{errorMessage}</p>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Please check the widget configuration.
            </p>
          </div>
        ) : WidgetComponent ? (
          // Render the actual widget component
          <WidgetComponent widget={widget} />
        ) : (
          // Fallback for unexpected cases (should be caught by errorMessage)
          <div className={errorContainerClasses}>
            <p className="font-medium mb-2">Unknown Widget State</p>
            <p>Could not render widget due to an unexpected issue.</p>
          </div>
        )}
      </div>
    </div>
  );
}