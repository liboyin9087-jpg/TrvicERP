import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { KintoneModalProps } from "../kintone/types";

/**
 * KintoneModal - A Kintone-styled modal component
 * Mobile-responsive with full-screen option on small devices
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
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const sizeStyles = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 overlay backdrop-blur-sm z-[1040]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[1050] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative w-full bg-white rounded-lg shadow-xl",
                  "max-h-[90vh] sm:max-h-[85vh]",
                  "flex flex-col",
                  sizeStyles[size],
                  className,
                )}
                style={style}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-md hover:bg-secondary-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
                    {footer}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
