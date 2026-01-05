// =====================================================
// TravelCanvas - Toast Notification System
// 替代 alert() 的現代化通知系統
// =====================================================

import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from '../components/Icons';

// =====================================================
// Types
// =====================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// =====================================================
// Context
// =====================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// =====================================================
// Provider
// =====================================================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 8000 }); // Longer for errors
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// =====================================================
// Hook
// =====================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// =====================================================
// Toast Container Component
// =====================================================

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

// =====================================================
// Individual Toast Component
// =====================================================

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const config: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string }> = {
    success: {
      icon: <CheckCircle2 size={20} />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-600'
    },
    error: {
      icon: <AlertCircle size={20} />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600'
    },
    info: {
      icon: <Info size={20} />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600'
    }
  };

  const { icon, bg, border, iconColor } = config[toast.type];

  return (
    <div
      className={`${bg} ${border} border rounded-xl p-4 shadow-lg animate-slide-in-right flex items-start gap-3 min-w-[300px]`}
      role="alert"
    >
      <div className={`${iconColor} flex-shrink-0 mt-0.5`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm">{toast.title}</p>
        {toast.message && <p className="text-slate-600 text-sm mt-1">{toast.message}</p>}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="關閉通知"
      >
        <X size={16} />
      </button>
    </div>
  );
};

// =====================================================
// CSS Animation (add to index.css)
// =====================================================

/*
Add this to your index.css:

@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
*/

export default ToastProvider;
