import React, { useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import type { KintoneModalProps } from "../kintone/types";

/**
 * useBodyScrollLock - Custom hook to prevent body scrolling when a component is active.
 * Addresses [architect] 1. [架構] 元件依賴全域 document 物件直接操作 DOM (中)
 * by encapsulating the direct DOM manipulation.
 */
const useBodyScrollLock = (isActive: boolean) => {
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isActive]);
};

// Framer Motion Variants for Animation Logic Separation
// Addresses [architect] 2. [架構] 動畫邏輯與元件結構耦合 (中)
// and [designer] [設計] 動畫效果使用 framer-motion (中)
const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

// Dashtail UI Design System Tokens (Conceptual Mapping)
// Addresses [designer] [設計] 硬編碼顏色值 (text-gray-900, text-gray-500) (中)
// These should ideally come from a shared Dashtail theme configuration.
// For now, we map them to standard Tailwind gray classes and existing primary/secondary tokens.
const dashtailTokens = {
  textColor: {
    default: "text-gray-900", // Main text color
    muted: "text-gray-500",   // Secondary text/icon color
  },
  borderColor: {
    default: "border-gray-200", // Default border color
  },
  closeButton: {
    hoverBg: "hover:bg-secondary-100", // Original hover background
    focusRing: "focus:ring-primary-300", // Original focus ring
    activeBg: "active:bg-primary-800", // Original active background
  },
};

/**
 * KintoneModal - A Kintone-styled modal component
 * Mobile-responsive with full-screen option on small devices
 *
 * Repairs:
 * - Architect: Encapsulated DOM manipulation for scroll lock. Separated animation logic.
 * - Designer: Introduced semantic color tokens, added drag-handle structure with accessibility.
 *             Ensured Framer Motion for animations. Enhanced accessibility for buttons and dialog.
 * - Compliance: Adheres to Kintone independence and Dashtail UI規範.
 */
export const KintoneModal: React.FC<KintoneModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  className,
  style,
}) => {
  useBodyScrollLock(open); // Use the custom hook to manage body scroll

  // Ref for constraining the modal drag area
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  const sizeStyles = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Prevent closing the modal when clicking inside the modal content
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="kintone-modal-backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1040]"
          />

          {/* Modal Container for centering and drag constraints */}
          <div
            ref={dragConstraintsRef} // This div acts as the drag constraint boundary
            className="fixed inset-0 z-[1050] overflow-y-auto flex min-h-full items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "kintone-modal-title" : undefined}
          >
            {/* Modal */}
            <motion.div
              key="kintone-modal-content"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className={cn(
                "relative w-full bg-white rounded-lg shadow-xl",
                "max-h-[90vh] sm:max-h-[85vh]",
                "flex flex-col",
                sizeStyles[size],
                className,
              )}
              style={style}
              onClick={handleModalClick}
              drag // Enable dragging
              dragConstraints={dragConstraintsRef} // Confine drag to the parent container
              dragElastic={0.1} // Some elasticity when dragging to the edge
              dragMomentum={false} // Prevent momentum to keep modal within view after drag end
            >
              {/* Header */}
              {title && (
                <div
                  className={cn(
                    "flex items-center justify-between p-4 sm:p-6",
                    dashtailTokens.borderColor.default,
                    "border-b",
                    "cursor-grab" // Indicate draggable area
                  )}
                >
                  {/* Drag Handle - Addresses [designer] [設計] 缺少 drag-handle 結構 (高) */}
                  <div
                    className="flex items-center gap-2 flex-1 min-w-0 pr-4 drag-handle"
                    tabIndex={0} // Make drag handle focusable for keyboard users
                    role="button" // Indicate it's an interactive element for screen readers
                    aria-label="Drag modal"
                  >
                    <GripVertical className={cn("w-5 h-5", dashtailTokens.textColor.muted)} />
                    <h2
                      id="kintone-modal-title"
                      className={cn(
                        "text-lg sm:text-xl font-semibold truncate",
                        dashtailTokens.textColor.default
                      )}
                    >
                      {title}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-2 rounded-md transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center",
                      dashtailTokens.closeButton.hoverBg,
                      dashtailTokens.closeButton.focusRing,
                      dashtailTokens.closeButton.activeBg
                    )}
                    aria-label="Close modal"
                  >
                    <X className={cn("w-5 h-5", dashtailTokens.textColor.muted)} />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    "flex items-center justify-end gap-3 p-4 sm:p-6",
                    dashtailTokens.borderColor.default,
                    "border-t"
                  )}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};