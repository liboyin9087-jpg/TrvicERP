/**
 * Enhanced Loading Component
 * Provides skeleton screens and better loading states
 */

import React from 'react';
import { cn } from '../../src/lib/utils';

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

export function Loading({ 
  variant = 'spinner', 
  size = 'medium', 
  text,
  className 
}: LoadingProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div
          className={cn(
            'animate-spin rounded-full border-4 border-blue-500 border-t-transparent',
            sizeClasses[size]
          )}
        />
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-100 focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse delay-200 focus:ring-2 focus:ring-primary-300 active:bg-primary-800" />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  return null;
}

/**
 * Skeleton Component for loading states
 */
interface SkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

export function Skeleton({ count = 1, height = '20px', width = '100%', className }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            className
          )}
          style={{ height, width }}
        />
      ))}
    </>
  );
}

/**
 * Card Skeleton for card-based layouts
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-4 space-y-3 focus:ring-2 focus:ring-primary-300 active:bg-primary-800">
          <Skeleton height="24px" width="60%" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="16px" width="90%" />
          <div className="flex gap-2 mt-4">
            <Skeleton height="32px" width="80px" />
            <Skeleton height="32px" width="80px" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Table Skeleton for table layouts
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}
