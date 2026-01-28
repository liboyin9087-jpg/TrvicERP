import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '../../src/store/useToastStore';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-brand-500',
};

export default function Toast({ toast, onClose }: ToastProps) {
  const Icon = iconMap[toast.type];
  const bgColor = colorMap[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`${bgColor} text-white rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-md`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="flex-1 font-medium text-sm">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        className="h-1 bg-white/30 origin-left focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
      />
    </motion.div>
  );
}
