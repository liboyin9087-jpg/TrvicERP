import { AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { useToastStore } from '@/store/useToastStore';
import Toast from './Toast';
import type { Toast as ToastType } from '@/types/toast';

interface Props {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<Props> = memo(({ toasts, removeToast }) => {
  return (
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;