import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>; // 新增：用於指定模態框打開時的初始焦點
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

// 輔助函數：獲取模態框內所有可聚焦的元素
const getTabbableElements = (container: HTMLElement) => {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement); // 確保元素可見或為當前焦點
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null); // 關閉按鈕的引用，用於設置初始焦點
  const triggerElementRef = useRef<Element | null>(null); // 用於儲存打開模態框的元素，以便關閉時恢復焦點

  // 處理 ESC 鍵關閉模態框
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // 焦點管理：儲存觸發元素、設置初始焦點、恢復焦點
  useEffect(() => {
    if (isOpen) {
      // 儲存打開模態框前的活躍元素
      triggerElementRef.current = document.activeElement;

      // 註冊事件監聽器
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 防止背景滾動

      // 設置初始焦點 (使用 requestAnimationFrame 確保模態框已渲染到 DOM)
      requestAnimationFrame(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus(); // 如果沒有其他指定，則將焦點設置到模態框容器本身
        }
      });
    }

    return () => {
      // 清理事件監聽器和背景滾動
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';

      // 恢復焦點到打開模態框的元素
      if (triggerElementRef.current) {
        (triggerElementRef.current as HTMLElement).focus();
      }
      triggerElementRef.current = null; // 清除引用，為下一次打開做準備
    };
  }, [isOpen, handleEscape, initialFocusRef]);

  // 焦點陷阱：處理 Tab 鍵在模態框內循環焦點
  const handleTabKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && modalRef.current) {
      e.preventDefault(); // 阻止瀏覽器默認的 Tab 行為

      const tabbable = getTabbableElements(modalRef.current);
      if (tabbable.length === 0) return;

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const currentActiveElement = document.activeElement;

      if (e.shiftKey) { // Shift + Tab (反向移動焦點)
        if (currentActiveElement === first || !modalRef.current.contains(currentActiveElement)) {
          last.focus(); // 如果在第一個元素或模態框外部，則移動到最後一個
        } else {
          const index = tabbable.indexOf(currentActiveElement as HTMLElement);
          if (index > 0) {
            tabbable[index - 1].focus();
          }
        }
      } else { // Tab (正向移動焦點)
        if (currentActiveElement === last || !modalRef.current.contains(currentActiveElement)) {
          first.focus(); // 如果在最後一個元素或模態框外部，則移動到第一個
        } else {
          const index = tabbable.indexOf(currentActiveElement as HTMLElement);
          if (index < tabbable.length - 1) {
            tabbable[index + 1].focus();
          }
        }
      }
    }
  }, []);

  const titleId = title ? `modal-title-${Date.now()}` : undefined; // 為模態框標題生成唯一 ID

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* 模態框內容 */}
          <motion.div
            ref={modalRef} // 附加引用
            role="dialog" // ARIA 角色：對話框
            aria-modal="true" // ARIA 屬性：表示這是一個模態對話框
            aria-labelledby={titleId} // 將模態框與其標題關聯
            tabIndex={-1} // 允許通過 JavaScript 聚焦，但不參與自然 Tab 順序
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden text-sm', // 設置最小字體大小為 text-sm
              sizeClasses[size]
            )}
            onClick={(e) => e.stopPropagation()} // 阻止點擊模態框內容關閉模態框
            onKeyDown={handleTabKey} // 添加 Tab 鍵處理器以實現焦點陷阱
          >
            {/* 標頭 */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100"> {/* 使用 primary-100 邊框 */}
                {title && (
                  <h3 id={titleId} className="text-lg font-semibold text-primary-900"> {/* 使用 primary-900 字體顏色 */}
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    ref={closeButtonRef} // 附加引用
                    onClick={onClose}
                    className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-primary-400 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 active:bg-primary-200" // 更新顏色為 primary-* token
                    aria-label="Close" // ARIA 標籤：關閉按鈕
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* 主體內容 */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}