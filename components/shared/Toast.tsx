import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { memo, useCallback } from 'react';
import type { Toast as ToastType } from '@/store/useToastStore';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
} as const;

const colorMap = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
} as const;

const Toast = memo(({ toast, onClose }: ToastProps) => {
  const Icon = iconMap[toast.type];
  const bgColor = colorMap[toast.type];

  const handleClose = useCallback(() => {
    onClose(toast.id);
  }, [onClose, toast.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`${bgColor} text-white rounded-xl shadow-2xl overflow-hidden min-w-[300px] max-w-md`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        <p className="flex-1 font-medium text-sm" id={`toast-message-${toast.id}`}>
          {toast.message}
        </p>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          aria-label="關閉通知"
          aria-describedby={`toast-message-${toast.id}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        className="h-1 bg-white/30 origin-left"
        aria-hidden="true"
      />
    </motion.div>
  );
});

Toast.displayName = 'Toast';

export default Toast;