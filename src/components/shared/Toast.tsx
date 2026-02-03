import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import React from 'react';

/**
 * @interface ToastConfig
 * @description Defines the configuration for a single toast notification.
 * This interface replaces the dependency on a global store type, ensuring component independence.
 * It also provides configurable properties for design flexibility.
 */
export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  /**
   * Duration in milliseconds for how long the toast should be visible.
   * Also controls the progress bar animation duration.
   * Defaults to 5000ms (5 seconds).
   */
  duration?: number;
  /**
   * Tailwind CSS class for the minimum width of the toast.
   * E.g., 'min-w-80' (320px) or 'min-w-sm'.
   * Defaults to 'min-w-80'.
   */
  minWidthClass?: string;
  /**
   * Tailwind CSS class for the progress bar background color.
   * E.g., 'bg-white/30', 'bg-primary-100/30'.
   * Defaults to 'bg-white/30'.
   */
  progressBarColorClass?: string;
  /**
   * Optional class name for the outer container, allowing additional styling.
   */
  className?: string;
}

interface ToastProps {
  config: ToastConfig;
  onClose: (id: string) => void;
}

// Icon mapping for different toast types
const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

// Color mapping using Dashtail UI规范 compliant Tailwind tokens
const colorMap = {
  success: 'bg-success-500', // Replaced 'bg-emerald-500' with a semantic token
  error: 'bg-danger-500',   // Replaced 'bg-red-500' with a semantic token
  info: 'bg-primary-500',    // Replaced 'bg-brand-500' with a semantic token
};

export default function Toast({ config, onClose }: ToastProps) {
  const Icon = iconMap[config.type];
  const bgColor = colorMap[config.type];

  // Default values for configurable properties to ensure robustness and consistency
  const defaultDuration = 5000; // 5 seconds
  const defaultMinWidthClass = 'min-w-80'; // min-width: 320px, a token-based approximation for 300px
  const defaultProgressBarColorClass = 'bg-white/30'; // Common pattern, but now configurable

  const duration = config.duration ?? defaultDuration;
  const minWidthClass = config.minWidthClass ?? defaultMinWidthClass;
  const progressBarColorClass = config.progressBarColorClass ?? defaultProgressBarColorClass;

  // Animation variants and transitions for Framer Motion, cleanly separated from UI rendering
  // This addresses the "動畫邏輯與 UI 渲染耦合" by centralizing animation properties.
  const toastVariants = {
    initial: { opacity: 0, x: 100, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 100, scale: 0.9 },
  };

  const toastTransition = {
    type: 'spring',
    damping: 20,
    stiffness: 300,
  };

  const progressBarTransition = {
    duration: duration / 1000, // Duration is now from config or default, and explicitly converted to seconds
    ease: 'linear',
  };

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={toastTransition}
      className={`${bgColor} text-white rounded-lg shadow-2xl overflow-hidden ${minWidthClass} max-w-md ${config.className || ''}`}
    >
      {/* The drag-handle class is applied to the main content area, adhering to the "缺少 drag-handle 結構" requirement.
          This allows the toast to be dragged as a widget. */}
      <div className="flex items-center gap-3 px-4 py-3 drag-handle">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 font-medium text-sm">{config.message}</p>
        <button
          onClick={() => onClose(config.id)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
          aria-label="Close toast" // Added for accessibility
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={progressBarTransition}
        className={`h-1 ${progressBarColorClass} origin-left`}
      />
    </motion.div>
  );
}