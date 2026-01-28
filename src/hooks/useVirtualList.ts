/**
 * Virtual List Hook
 * 用於大量資料列表的虛擬化渲染，提升效能
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// Basic throttle utility for performance optimization
// This is a trailing-edge throttle: the function will be called at most once per `limit` ms,
// and if invoked multiple times within that period, it will execute with the *last* arguments
// after the period ends.
const throttle = <T extends (...args: any[]) => void>(func: T, limit: number) => {
  let timeoutId: number | undefined;
  let lastArgs: Parameters<T>;
  let lastThis: ThisParameterType<T>;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        func.apply(lastThis, lastArgs);
        timeoutId = undefined;
        // Reset args to avoid re-execution if no new calls come in
        (lastArgs as any) = undefined;
      }, limit);
    }
  };
};

interface UseVirtualListOptions {
  itemHeight: number;       // 單一項目高度
  overscan?: number;        // 額外渲染的項目數量（上下各多少）
  containerHeight?: number; // 容器高度（若提供，則不再自動偵測，除非未提供滾動容器）
  // 允許使用者提供外部滾動容器的 Ref，而非內部自動創建
  scrollRef?: React.RefObject<HTMLDivElement>;
}

interface VirtualItem<T> {
  index: number;
  item: T;
  style: React.CSSProperties;
}

interface UseVirtualListReturn<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>; // 返回實際使用的容器 Ref
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  isScrolling: boolean;
}

export function useVirtualList<T>(
  items: T[] | null | undefined, // 處理 items 為空或 null 的邊界情況
  options: UseVirtualListOptions
): UseVirtualListReturn<T> {
  const { itemHeight, overscan = 3, containerHeight: initialContainerHeight, scrollRef } = options;

  // 內部用於自動偵測容器的 Ref，若外部未提供 scrollRef 則使用此 Ref
  const internalContainerRef = useRef<HTMLDivElement>(null);
  // 實際使用的滾動容器 Ref，優先使用外部提供的 scrollRef
  const actualContainerRef = scrollRef || internalContainerRef;

  // 容器高度。若 options.containerHeight 存在，則使用該值，否則預設為 0
  // ResizeObserver 會負責更新實際高度。避免初始值耦合
  const [containerHeight, setContainerHeight] = useState(initialContainerHeight ?? 0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<number>();

  // 處理 items 為空或 null 的邊界情況
  if (!items || items.length === 0) {
    return {
      virtualItems: [],
      totalHeight: 0,
      containerRef: actualContainerRef,
      scrollToIndex: () => {},
      isScrolling: false,
    };
  }

  // 監聽容器尺寸變化，處理 SSR 環境相容性
  useEffect(() => {
    // 檢查是否在瀏覽器環境且實際容器 Ref 已連接
    if (typeof window === 'undefined' || !actualContainerRef.current || initialContainerHeight !== undefined) {
      // 如果提供了 initialContainerHeight，則不再使用 ResizeObserver 自動偵測
      // 或者在 SSR 環境下不執行 ResizeObserver
      return;
    }

    const container = actualContainerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [actualContainerRef, initialContainerHeight]); // 依賴 actualContainerRef 和 initialContainerHeight

  // 監聽滾動事件並節流
  useEffect(() => {
    const container = actualContainerRef.current;
    if (!container) return;

    // 使用節流優化 setScrollTop 的頻率
    const throttledSetScrollTop = throttle((scrollValue: number) => {
      setScrollTop(scrollValue);
    }, 100); // 100ms 節流

    const handleScroll = () => {
      throttledSetScrollTop(container.scrollTop);
      setIsScrolling(true);

      // 滾動結束後重設狀態 (debounce 效果)
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
      scrollingTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [actualContainerRef]); // 依賴 actualContainerRef

  // 計算可見範圍
  const { startIndex, endIndex } = useMemo(() => {
    // 如果容器高度為 0 (例如初始渲染或 SSR 環境下)，則不渲染任何項目
    if (containerHeight === 0) {
      return { startIndex: 0, endIndex: -1 }; // 返回一個無效範圍
    }
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 生成虛擬項目
  const virtualItems = useMemo(() => {
    const result: VirtualItem<T>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      // 確保索引有效且項目存在
      if (i >= 0 && i < items.length && items[i] !== undefined) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
            // 設計規範：不包含硬編碼顏色、字體、間距的 Tailwind Class
            // 這些屬性是虛擬化渲染的必需定位屬性，不應被 Tailwind Class 取代
          },
        });
      }
    }

    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  // 總高度
  const totalHeight = items.length * itemHeight;

  // 滾動到指定索引
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (actualContainerRef.current) {
        actualContainerRef.current.scrollTo({
          top: index * itemHeight,
          behavior,
        });
      }
    },
    [itemHeight, actualContainerRef]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef: actualContainerRef, // 返回實際使用的 Ref
    scrollToIndex,
    isScrolling,
  };
}

/**
 * 簡化版的 Virtual List Hook（適用於固定高度列表）
 * 此 Hook 不處理容器尺寸偵測和滾動事件監聽，而是依賴外部提供 containerHeight 和 scrollTop
 */
export function useSimpleVirtualList<T>(
  items: T[] | null | undefined, // 處理 items 為空或 null 的邊界情況
  itemHeight: number,
  containerHeight: number
) {
  // 處理 items 為空或 null 的邊界情況
  if (!items || items.length === 0) {
    return {
      visibleItems: [],
      totalHeight: 0,
      paddingTop: 0,
      handleScroll: () => {},
    };
  }

  const [startIndex, setStartIndex] = useState(0);
  const overscan = 5;

  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(startIndex + visibleCount, items.length);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i < endIndex; i++) {
      if (items[i] !== undefined) {
        result.push({
          item: items[i],
          index: i,
          offsetTop: i * itemHeight,
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      setStartIndex(newStartIndex);
    },
    [itemHeight, overscan]
  );

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    paddingTop: startIndex * itemHeight,
    handleScroll,
  };
}

export default useVirtualList;