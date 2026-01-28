import { create } from 'zustand';
import { produce } from 'immer'; // Recommended for immutable updates in complex state

// ============================================
// Type Definitions
// ============================================

export type ToastType = 'success' | 'error' | 'info' | 'warning'; // Added warning type for completeness
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'; // Common toast positions

/**
 * @interface ToastOptions
 * @description Configuration options for a single toast notification.
 * This is what consumers provide when adding a toast.
 */
export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // How long the toast should display, in milliseconds. 0 or negative means infinite.
  position?: ToastPosition;
  icon?: React.ReactNode; // Custom icon for the toast
  onClose?: () => void; // Callback function called when the toast is closed
  canCloseManually?: boolean; // If true, the toast can be closed by user interaction (e.g., clicking a close button).
}

/**
 * @interface Toast
 * @description Internal structure of a toast stored in the state.
 * Includes all resolved options and internal management IDs.
 */
export interface Toast extends Required<Omit<ToastOptions, 'icon'>> { // All core options become required internally
  id: string;
  icon?: React.ReactNode; // Icon remains optional
  timeoutId?: ReturnType<typeof setTimeout>; // Stores the timeout ID for cleanup to prevent memory leaks
}

/**
 * @interface ToastState
 * @description The state managed by the toast store.
 */
interface ToastState {
  toasts: Toast[];
}

/**
 * @interface useToastStoreConfig
 * @description Configuration for the toast store itself.
 * This allows customizing default behaviors for all toasts managed by this store.
 * This fulfills the `interface {file_path_name}Config` requirement for configurable behavior.
 */
export interface useToastStoreConfig {
  defaultDuration?: number; // Default duration for toasts if not specified (ms)
  defaultPosition?: ToastPosition; // Default position for toasts if not specified
  maxToasts?: number; // Maximum number of toasts to display concurrently. Oldest toast is removed if limit is reached.
}

/**
 * @interface ToastActions
 * @description Actions available to interact with the toast store.
 */
interface ToastActions {
  addToast: (options: ToastOptions) => string; // Adds a toast and returns its unique ID
  removeToast: (id: string) => void; // Removes a specific toast by ID
  clearAllToasts: () => void; // Removes all active toasts
  /**
   * @private
   * Internal action to clear a toast's auto-removal timeout.
   * Not exposed publicly, used for internal store management.
   */
  _clearToastTimeout: (id: string) => void;
}

type ToastStore = ToastState & ToastActions;

// ============================================
// Store Creation
// ============================================

// Define default configuration for the toast store
const defaultToastStoreConfig: useToastStoreConfig = {
  defaultDuration: 3000, // Default to 3 seconds
  defaultPosition: 'top-right', // Default toast position
  maxToasts: 5, // Allow a maximum of 5 toasts at any given time
};

/**
 * @function createToastStore
 * @description Factory function to create a Zustand toast store with configurable defaults.
 * This allows the store to be instantiated with specific configurations if needed,
 * adhering to the principle of Kintone independence and configurable widgets.
 */
export const createToastStore = (config?: Partial<useToastStoreConfig>) => {
  const finalConfig = { ...defaultToastStoreConfig, ...config };

  return create<ToastStore>((set, get) => ({
    toasts: [],

    addToast: (options) => {
      const {
        message,
        type = 'info', // Default type if not provided
        duration = finalConfig.defaultDuration!, // Use store's default duration
        position = finalConfig.defaultPosition!, // Use store's default position
        icon,
        onClose,
        canCloseManually = true, // Default to allowing manual closure
      } = options;

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        position,
        icon,
        onClose,
        canCloseManually,
      };

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      // Set up auto-removal timeout only if duration is positive
      if (duration > 0) {
        timeoutId = setTimeout(() => {
          get().removeToast(id); // Use get() to access the latest state and actions
        }, duration);
      }
      newToast.timeoutId = timeoutId; // Store the timeout ID for later cleanup

      set(produce((state: ToastState) => {
        // Enforce maximum number of toasts
        if (state.toasts.length >= finalConfig.maxToasts!) {
          const oldestToast = state.toasts.shift(); // Remove the oldest toast
          if (oldestToast) {
            get()._clearToastTimeout(oldestToast.id); // Clear its associated timeout
            oldestToast.onClose?.(); // Call its onClose callback
          }
        }
        state.toasts.push(newToast); // Add the new toast
      }));

      return id; // Return the ID for potential manual interaction
    },

    removeToast: (id) => {
      set(produce((state: ToastState) => {
        const index = state.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          const removedToast = state.toasts[index];
          get()._clearToastTimeout(removedToast.id); // Clear the timeout to prevent memory leaks
          state.toasts.splice(index, 1); // Remove toast from the array
          removedToast.onClose?.(); // Call the toast's onClose callback
        }
      }));
    },

    clearAllToasts: () => {
      set(produce((state: ToastState) => {
        state.toasts.forEach((toast) => {
          get()._clearToastTimeout(toast.id); // Clear all active timeouts
          toast.onClose?.(); // Call onClose for all cleared toasts
        });
        state.toasts = []; // Clear all toasts from the state
      }));
    },

    _clearToastTimeout: (id) => {
      const toast = get().toasts.find(t => t.id === id);
      if (toast?.timeoutId) {
        clearTimeout(toast.timeoutId); // Safely clear the timeout
      }
    }
  }));
};

// Export the default configured store instance for general use
export const useToastStore = createToastStore();

// ============================================
// Convenience Hook
// ============================================

/**
 * @hook useToast
 * @description A convenience hook to easily add different types of toast notifications.
 * It abstracts away the need to pass 'type' repeatedly.
 */
export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);

  return {
    addToast, // Expose the full addToast function for maximum flexibility with ToastOptions
    success: (message: string, duration?: number) => addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => addToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => addToast({ message, type: 'warning', duration }),
  };
};