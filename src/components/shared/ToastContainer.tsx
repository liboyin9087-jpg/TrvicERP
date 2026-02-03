import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import type { Toast as ToastType } from '@/store/useToastStore';

/**
 * @interface ToastContainerConfig
 * @description 定義 ToastContainer 元件的配置屬性。
 *              取代了對全域 Store 的依賴，使得元件可以獨立運作並透過 props 傳遞資料。
 */
interface ToastContainerConfig {
  /**
   * 欲顯示的 Toast 訊息陣列。
   */
  toasts: ToastType[];
  /**
   * 關閉 Toast 訊息的回調函數，當 Toast 被關閉時會被呼叫，並傳遞該 Toast 的 ID。
   */
  onClose: (id: string) => void;
}

/**
 * @component ToastContainer
 * @description 顯示和管理多個 Toast 訊息的容器。
 *              透過 props 接收 Toast 資料和關閉回調，實現 Kintone 獨立性。
 *              不具備 Card 結構或 Drag Handle，因其作為全域通知容器的性質不適用這些特性。
 *              樣式使用 Tailwind Utility Class，符合 Dashtail UI 規範的顏色使用。
 *
 * @param {ToastContainerConfig} props - 包含 toasts 陣列和 onClose 回調的配置物件。
 */
export default function ToastContainer({ toasts, onClose }: ToastContainerConfig) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          // Map toast type, filtering out 'warning' which isn't supported by Toast component
          const supportedType = toast.type === 'warning' ? 'info' : toast.type;
          return (
            <Toast 
              key={toast.id} 
              config={{
                id: toast.id,
                type: supportedType as 'success' | 'error' | 'info',
                message: toast.message,
                duration: toast.duration,
              }} 
              onClose={onClose} 
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}