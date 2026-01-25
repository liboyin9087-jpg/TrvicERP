/**
 * Virtual List Hook
 * 用於大量資料列表的虛擬化渲染，提升效能
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface UseVirtualListOptions {
  itemHeight: number;       // 單一項目高度
  overscan?: number;        // 額外渲染的項目數量（上下各多少）
  containerHeight?: number; // 容器高度（未提供時自動偵測）
}

interface VirtualItem<T> {
  index: number;
  item: T;
  style: React.CSSProperties;
}

interface UseVirtualListReturn<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  isScrolling: boolean;
}

export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
): UseVirtualListReturn<T> {
  const { itemHeight, overscan = 3 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(options.containerHeight || 400);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<number>();

  // 監聽容器尺寸變化
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 監聽滾動事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setIsScrolling(true);

      // 滾動結束後重設狀態
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
  }, []);

  // 計算可見範圍
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 生成虛擬項目
  const virtualItems = useMemo(() => {
    const result: VirtualItem<T>[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i] !== undefined) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
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
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: index * itemHeight,
          behavior,
        });
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
    isScrolling,
  };
}

/**
 * 簡化版的 Virtual List Hook（適用於固定高度列表）
 */
export function useSimpleVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [startIndex, setStartIndex] = useState(0);
  const overscan = 5;

  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(startIndex + visibleCount, items.length);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
      offsetTop: (startIndex + idx) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      setStartIndex(newStartIndex);
    },
    [itemHeight]
  );

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    paddingTop: startIndex * itemHeight,
    handleScroll,
  };
}

export default useVirtualList;
