import { useEffect, useCallback, useRef, useMemo, useId } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; // 假設此工具函數存在

// --- [Architect Fix] useScrollLock Hook: 處理 document.body.style.overflow，避免全域樣式衝突及 SSR 問題 ---
function useScrollLock(isEnabled: boolean) {
  useEffect(() => {
    // 處理 SSR 情境下的 document 存取
    if (typeof window === 'undefined') return;

    if (isEnabled) {
      document.body.style.overflow = 'hidden';
      // 建議: 為防止滾動條消失時內容跳動，可在此添加 padding-right
      // const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      // if (scrollbarWidth > 0) {
      //   document.body.style.paddingRight = `${scrollbarWidth}px`;
      // }
    } else {
      document.body.style.overflow = 'unset';
      // document.body.style.paddingRight = '';
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset';
        // document.body.style.paddingRight = '';
      }
    };
  }, [isEnabled]);
}
// --- 結束 useScrollLock Hook ---

// --- [Architect Fix] useFocusTrap Hook: 獨立焦點管理邏輯，降低耦合度並處理 SSR 問題 ---

// 輔助函數：獲取模態框內所有可聚焦的元素
const getTabbableElements = (container: HTMLElement) => {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0); // 確保元素可見
};

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>; // 指定初始焦點
  fallbackFocusRef?: React.RefObject<HTMLElement>; // 備用初始焦點 (例如關閉按鈕)
  containerRef: React.RefObject<HTMLElement>; // 模態框容器的引用
}

function useFocusTrap({
  isOpen,
  onClose,
  closeOnEscape,
  initialFocusRef,
  fallbackFocusRef,
  containerRef,
}: UseFocusTrapOptions) {
  const triggerElementRef = useRef<Element | null>(null); // 儲存打開模態框的元素，以便關閉時恢復焦點

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
    // 處理 SSR 情境下的 document 存取
    if (typeof window === 'undefined') return;

    if (isOpen) {
      triggerElementRef.current = document.activeElement; // 儲存打開模態框前的活躍元素

      document.addEventListener('keydown', handleEscape);

      // 設置初始焦點 (使用 requestAnimationFrame 確保模態框已渲染到 DOM)
      requestAnimationFrame(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (fallbackFocusRef?.current) {
          fallbackFocusRef.current.focus();
        } else if (containerRef.current) {
          containerRef.current.focus(); // 如果沒有其他指定，則將焦點設置到模態框容器本身
        }
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('keydown', handleEscape);

        // 恢復焦點到打開模態框的元素
        if (triggerElementRef.current instanceof HTMLElement) {
          triggerElementRef.current.focus();
        }
        triggerElementRef.current = null;
      }
    };
  }, [isOpen, handleEscape, initialFocusRef, fallbackFocusRef, containerRef]);

  // 焦點陷阱：處理 Tab 鍵在模態框內循環焦點
  const handleTabKey = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Tab' && containerRef.current) {
      e.preventDefault();

      const tabbable = getTabbableElements(containerRef.current);
      if (tabbable.length === 0) return;

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const currentActiveElement = document.activeElement;

      if (e.shiftKey) { // Shift + Tab (反向移動焦點)
        if (currentActiveElement === first || !containerRef.current.contains(currentActiveElement)) {
          last.focus();
        } else {
          const index = tabbable.indexOf(currentActiveElement as HTMLElement);
          if (index > 0) {
            tabbable[index - 1].focus();
          }
        }
      } else { // Tab (正向移動焦點)
        if (currentActiveElement === last || !containerRef.current.contains(currentActiveElement)) {
          first.focus();
        } else {
          const index = tabbable.indexOf(currentActiveElement as HTMLElement);
          if (index < tabbable.length - 1) {
            tabbable[index + 1].focus();
          }
        }
      }
    }
  }, [containerRef]);

  return { handleTabKey };
}
// --- 結束 useFocusTrap Hook ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // [Architect Fix] 尺寸配置改為可擴展設計: 允許預定義尺寸或直接傳入 Tailwind class
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  containerClassName?: string; // 最外層定位 div 的 class
  contentClassName?: string;  // 模態框內容 motion.div 的 class
  // [Designer Fix] 動畫參數配置選項: 允許覆寫 framer-motion 的動畫屬性
  backdropMotionProps?: HTMLMotionProps<'div'>;
  contentMotionProps?: HTMLMotionProps<'div'>;
  // [Architect Fix] Portal 使用支援: 允許指定傳送門的目標 DOM 節點
  portalContainer?: HTMLElement | null;
}

// [Architect Fix] 尺寸配置 (sizeClasses) 改為可擴展設計
const defaultSizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
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
  containerClassName,
  contentClassName,
  backdropMotionProps,
  contentMotionProps,
  portalContainer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null); // 關閉按鈕的引用，作為備用初始焦點

  // [Architect Fix] 使用 useScrollLock Hook 管理 body 滾動
  useScrollLock(isOpen);

  // [Architect Fix] 使用 useFocusTrap Hook 管理焦點邏輯
  const { handleTabKey } = useFocusTrap({
    isOpen,
    onClose,
    closeOnEscape,
    initialFocusRef,
    fallbackFocusRef: closeButtonRef,
    containerRef: modalRef,
  });

  // [Designer Fix] 焦點管理缺少 ARIA 屬性: 使用 useId 生成唯一 ID
  const uniqueId = useId();
  const titleId = title ? `modal-title-${uniqueId}` : undefined;

  // 預設的背景遮罩動畫參數
  const defaultBackdropMotionProps: HTMLMotionProps<'div'> = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  // 預設的模態框內容動畫參數
  const defaultContentMotionProps: HTMLMotionProps<'div'> = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  };

  // 根據 size prop 選擇預設尺寸或使用自定義 class
  const currentSizeClass = defaultSizeClasses[size] || size;

  // [Architect Fix] 處理 SSR 情境下的 document 存取和 Portal 渲染
  if (typeof window === 'undefined') {
    return null; // 在伺服器端不渲染 Portal
  }

  // Portal 目標節點，預設為 document.body
  const targetElement = portalContainer || document.body;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 z-[9998] flex items-center justify-center p-4", containerClassName)}>
          {/* 背景遮罩 */}
          <motion.div
            {...defaultBackdropMotionProps}
            {...backdropMotionProps} // 允許外部覆寫動畫參數
            className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* 模態框內容 */}
          <motion.div
            ref={modalRef}
            role="dialog" // [Designer Fix] ARIA 屬性: 對話框角色
            aria-modal="true" // [Designer Fix] ARIA 屬性: 模態對話框
            aria-labelledby={titleId} // [Designer Fix] ARIA 屬性: 關聯標題
            tabIndex={-1} // [Designer Fix] ARIA 屬性: 允許 JS 聚焦但不參與 Tab 順序
            {...defaultContentMotionProps}
            {...contentMotionProps} // 允許外部覆寫動畫參數
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden text-sm max-h-[90vh] flex flex-col',
              currentSizeClass,
              contentClassName
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleTabKey} // 添加 Tab 鍵處理器以實現焦點陷阱
          >
            {/* 標頭 */}
            {(title || showCloseButton) && (
              <div className="relative flex items-center justify-between px-6 py-4 border-b border-primary-100 shrink-0">
                {/* [Designer Fix] 缺少 drag-handle 結構: 添加 drag-handle 類別，使整個標頭區域可作為拖拽把手 */}
                {/* 實際拖拽功能需整合如 framer-motion 的 `drag` prop，並可透過 `dragControls` 指定此 handle。
                    此處僅提供結構，使整個標頭區域可被拖拽庫識別為拖拽把手。
                */}
                <div className="drag-handle absolute inset-0 cursor-grab" aria-hidden="true" />

                {/* 標題，置於 drag-handle 之上 */}
                {title && (
                  <h3 id={titleId} className="relative z-10 text-lg font-semibold text-primary-900 truncate">
                    {title}
                  </h3>
                )}

                {/* 關閉按鈕，置於 drag-handle 之上 */}
                {showCloseButton && (
                  <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    className="relative z-10 p-2 hover:bg-primary-100 rounded-lg transition-colors text-primary-400 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 active:bg-primary-200"
                    aria-label="Close modal" // [Designer Fix] ARIA 屬性: 關閉按鈕的描述
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* 主體內容 */}
            <div className="px-6 py-4 max-h-full overflow-y-auto flex-grow">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // [Architect Fix] 使用 ReactDOM.createPortal 將模態框渲染到 body 或指定容器
  return ReactDOM.createPortal(modalContent, targetElement);
}