import { create } from 'zustand';

// ============================================
// Type Definitions
// ============================================

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'showing' | 'removing' | 'removed';
}

interface ToastState {
  toasts: Toast[];
  auditLog: Array<{
    id: string;
    toastId: string;
    action: string;
    fromState?: string;
    toState?: string;
    timestamp: string;
  }>;
}

interface ToastActions {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  _logAudit: (toastId: string, action: string, fromState?: string, toState?: string) => void;
}

type ToastStore = ToastState & ToastActions;

const TOAST_STATE_MACHINE: Record<Toast['status'], Toast['status'][]> = {
  pending: ['showing', 'removed'],
  showing: ['removing', 'removed'],
  removing: ['removed'],
  removed: [],
};

function canTransition(from: Toast['status'], to: Toast['status']): boolean {
  return TOAST_STATE_MACHINE[from]?.includes(to) ?? false;
}

// ============================================
// Store Creation
// ============================================

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  auditLog: [],

  _logAudit: (toastId, action, fromState, toState) => {
    set((state) => ({
      auditLog: [
        ...state.auditLog,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          toastId,
          action,
          fromState,
          toState,
          timestamp: new Date().toISOString()
        }
      ]
    }));
  },

  addToast: (message, type, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    set((state) => {
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        createdAt: now,
        updatedAt: now,
        status: 'pending'
      };

      state._logAudit(id, 'create', undefined, 'pending');

      return {
        toasts: [...state.toasts, newToast]
      };
    });

    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (!toast || !canTransition(toast.status, 'showing')) return state;

      state._logAudit(id, 'transition', toast.status, 'showing');

      return {
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, status: 'showing', updatedAt: new Date().toISOString() } : t
        )
      };
    });

    setTimeout(() => {
      set((state) => {
        const toast = state.toasts.find((t) => t.id === id);
        if (!toast || !canTransition(toast.status, 'removing')) return state;

        state._logAudit(id, 'transition', toast.status, 'removing');

        return {
          toasts: state.toasts.map((t) =>
            t.id === id ? { ...t, status: 'removing', updatedAt: new Date().toISOString() } : t
          )
        };
      });

      setTimeout(() => {
        set((state) => {
          const toast = state.toasts.find((t) => t.id === id);
          if (!toast || !canTransition(toast.status, 'removed')) return state;

          state._logAudit(id, 'remove', toast.status, 'removed');

          return {
            toasts: state.toasts.filter((t) => t.id !== id)
          };
        });
      }, 300);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (!toast || !canTransition(toast.status, 'removed')) return state;

      state._logAudit(id, 'manual_remove', toast.status, 'removed');

      return {
        toasts: state.toasts.filter((t) => t.id !== id)
      };
    });
  },

  clearAllToasts: () => {
    set((state) => {
      state.toasts.forEach((toast) => {
        if (canTransition(toast.status, 'removed')) {
          state._logAudit(toast.id, 'clear_all', toast.status, 'removed');
        }
      });

      return {
        toasts: []
      };
    });
  }
}));

// ============================================
// Convenience Hook
// ============================================

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);

  return {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };
};