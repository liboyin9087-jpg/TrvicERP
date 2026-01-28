/**
 * Enhanced Loading Components
 * Provides various loading states including spinners, pulse dots, and skeleton screens.
 * These components are designed to be independent and configurable, suitable for use
 * within Kintone-like widgets or other React applications.
 */

import React from 'react';
import { cn } from '../../src/lib/utils'; // Assuming cn is a utility for merging Tailwind classes

// --- Kintone 독립성 (Kintone Independence) ---
// Per architectural guidelines, if this file were to export a single widget,
// its configuration would typically be defined as `interface LoadingEnhancedConfig`.
// As this file exports multiple specialized loading components, each component
// defines its own specific props interface for independent configuration.
// A higher-level widget would then pass its configuration into these components as needed.
export interface LoadingEnhancedConfig {
  // This interface serves as a placeholder as per the requirement.
  // In a real Kintone widget scenario, this would contain all configurable properties
  // for the widget that might then be passed down to individual loading components.
  // For this file's purpose, individual components define their own specific props.
  variant?: 'spinner' | 'pulse' | 'card-skeleton' | 'table-skeleton' | 'text-skeleton';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  count?: number;
  rows?: number;
  columns?: number;
  // Add other shared configuration properties if applicable
}

// --- Component: Spinner ---
export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: string; // e.g., 'h-10 w-10' or 'h-[40px] w-[40px]'
  text?: string;
  className?: string;
}

export function Spinner({ 
  size = 'medium', 
  customSize,
  text,
  className 
}: SpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    custom: customSize || 'h-8 w-8', // Fallback for custom if not provided
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-4 border-primary-500 border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

// --- Component: PulseDots ---
export interface PulseDotsProps {
  count?: number; // Number of dots, default 3
  size?: 'small' | 'medium' | 'large'; // Size of individual dots
  text?: string;
  className?: string;
}

export function PulseDots({ 
  count = 3, 
  size = 'medium', 
  text, 
  className 
}: PulseDotsProps) {
  const dotSizeClasses = {
    small: 'h-1.5 w-1.5',
    medium: 'h-2 w-2',
    large: 'h-2.5 w-2.5',
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-primary-500 animate-pulse',
            dotSizeClasses[size],
            `delay-${i * 100}` // Stagger animation
          )}
        />
      ))}
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// --- Component: Base Skeleton (more configurable) ---
export interface BaseSkeletonProps {
  count?: number;
  height?: string; // Tailwind height class, e.g., 'h-4', 'h-[20px]'
  width?: string;  // Tailwind width class, e.g., 'w-full', 'w-[100px]'
  className?: string;
}

export function BaseSkeleton({ 
  count = 1, 
  height = 'h-4', 
  width = 'w-full', 
  className 
}: BaseSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-muted rounded', // Using bg-muted for general skeleton fill
            height,
            width,
            className
          )}
        />
      ))}
    </>
  );
}

// --- Component: Card Skeleton for card-based layouts ---
export interface CardSkeletonProps {
  count?: number;
  titleLines?: number;
  textLines?: number;
  buttonCount?: number;
  className?: string; // Additional class for the outer card container
}

export function CardSkeleton({ 
  count = 1,
  titleLines = 1,
  textLines = 2,
  buttonCount = 2,
  className
}: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(
          'bg-card rounded-lg shadow-sm p-4 space-y-3', // Standard Dashtail Card structure
          className
        )}>
          {Array.from({ length: titleLines }).map((_, j) => (
            <BaseSkeleton key={`title-${j}`} height="h-6" width={j === 0 ? "w-3/5" : "w-4/5"} />
          ))}
          {Array.from({ length: textLines }).map((_, j) => (
            <BaseSkeleton key={`text-${j}`} height="h-4" width={j === 0 ? "w-full" : "w-11/12"} />
          ))}
          {buttonCount > 0 && (
            <div className="flex gap-2 pt-2"> {/* Using pt-2 for top padding, consistent spacing */}
              {Array.from({ length: buttonCount }).map((_, k) => (
                <BaseSkeleton key={`button-${k}`} height="h-8" width="w-[80px]" />
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// --- Component: Table Skeleton for table layouts ---
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: string[]; // Array of Tailwind width classes for columns, e.g., ['w-1/4', 'w-1/2', 'w-1/4']
  hasHeader?: boolean;
  className?: string; // Additional class for the outer table container
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  columnWidths, 
  hasHeader = true,
  className
}: TableSkeletonProps) {
  const effectiveColumnWidths = columnWidths && columnWidths.length === columns 
    ? columnWidths 
    : Array.from({ length: columns }, () => 'w-full'); // Default to full width for grid items

  return (
    <div className={cn('space-y-2 bg-card rounded-lg shadow-sm p-4', className)}> {/* Mimic card structure */}
      {/* Header */}
      {hasHeader && (
        <div className="grid gap-x-4 pb-2 border-b border-border"> {/* Using border-border for separation */}
          {/* Using style for gridTemplateColumns as it's dynamic based on column count */}
          <div style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} className="grid gap-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <BaseSkeleton key={`header-${i}`} height="h-5" width={effectiveColumnWidths[i]} className="first:w-3/4 last:w-1/2" /> // Vary widths for visual distinction
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-2"> {/* Consistent vertical spacing between rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-x-4">
            {/* Using style for gridTemplateColumns as it's dynamic based on column count */}
            <div style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} className="grid gap-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <BaseSkeleton key={`row-${rowIndex}-col-${colIndex}`} height="h-4" width={effectiveColumnWidths[colIndex]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// NOTE: The original `Loading` component which handled multiple variants (`spinner`, `pulse`, `skeleton`)
// has been refactored into `Spinner`, `PulseDots`, `BaseSkeleton`, `CardSkeleton`, and `TableSkeleton`
// to adhere to the Single Responsibility Principle. This improves modularity and maintainability.
// If a single umbrella loading component is desired, it should act as a orchestrator,
// deciding which specialized loading component to render based on props, rather than implementing
// all loading logic itself.