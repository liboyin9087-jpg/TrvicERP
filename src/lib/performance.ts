/**
 * 效能優化工具
 * 提供 memoization、debounce、throttle 等效能優化函數
 */

/**
 * 簡單的 memoization 快取
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number; // Time to live in milliseconds
  } = {}
): T {
  const { maxSize = 100, ttl } = options;
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    // 檢查快取是否有效
    if (cached) {
      const isExpired = ttl && Date.now() - cached.timestamp > ttl;
      if (!isExpired) {
        return cached.value;
      }
      cache.delete(key);
    }

    // 計算新值
    const result = fn(...args);

    // 清除過舊的快取
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;

  // 添加清除快取的方法
  (memoized as any).clear = () => cache.clear();
  (memoized as any).size = () => cache.size;

  return memoized;
}

/**
 * Debounce 函數
 * 延遲執行，直到停止呼叫一段時間後才執行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: {
    leading?: boolean;  // 是否在延遲開始時執行
    trailing?: boolean; // 是否在延遲結束時執行
  } = {}
): T & { cancel: () => void; flush: () => void } {
  const { leading = false, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let result: ReturnType<T>;

  const invokeFunc = (time: number) => {
    if (lastArgs) {
      result = fn(...lastArgs);
      lastArgs = null;
    }
    lastCallTime = time;
    return result;
  };

  const debounced = ((...args: Parameters<T>): ReturnType<T> => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking && leading && !timeoutId) {
      result = invokeFunc(time);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (lastArgs) {
          result = invokeFunc(Date.now());
        }
      }, delay);
    }

    return result;
  }) as T & { cancel: () => void; flush: () => void };

  function shouldInvoke(time: number): boolean {
    return lastCallTime === null || time - lastCallTime >= delay;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      result = invokeFunc(Date.now());
      debounced.cancel();
    }
    return result;
  };

  return debounced;
}

/**
 * Throttle 函數
 * 限制函數執行頻率
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options;

  let lastCallTime: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T>;

  const throttled = ((...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();

    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = limit - (now - (lastCallTime || 0));

    if (remaining <= 0 || remaining > limit) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      result = fn(...args);
      lastArgs = null;
    } else if (!timeoutId && trailing) {
      lastArgs = args;
      timeoutId = setTimeout(() => {
        lastCallTime = leading ? Date.now() : null;
        timeoutId = null;
        if (lastArgs) {
          result = fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }

    return result;
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = null;
    lastArgs = null;
  };

  return throttled;
}

/**
 * 批次處理函數
 * 將多次呼叫合併為一次批次處理
 */
export function batch<T, R>(
  processor: (items: T[]) => R[],
  options: {
    maxBatchSize?: number;
    maxWait?: number;
  } = {}
): (item: T) => Promise<R> {
  const { maxBatchSize = 50, maxWait = 50 } = options;

  let queue: { item: T; resolve: (value: R) => void; reject: (error: any) => void }[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const currentQueue = queue;
    queue = [];

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (currentQueue.length === 0) return;

    try {
      const items = currentQueue.map((q) => q.item);
      const results = processor(items);

      currentQueue.forEach((q, index) => {
        q.resolve(results[index]);
      });
    } catch (error) {
      currentQueue.forEach((q) => {
        q.reject(error);
      });
    }
  };

  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      queue.push({ item, resolve, reject });

      if (queue.length >= maxBatchSize) {
        flush();
      } else if (!timeoutId) {
        timeoutId = setTimeout(flush, maxWait);
      }
    });
  };
}

/**
 * 測量函數執行時間
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);

    // 處理 Promise
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.debug(`[Performance] ${label || fn.name || 'anonymous'}: ${duration.toFixed(2)}ms`);
      }) as ReturnType<T>;
    }

    const duration = performance.now() - start;
    console.debug(`[Performance] ${label || fn.name || 'anonymous'}: ${duration.toFixed(2)}ms`);
    return result;
  }) as T;
}

/**
 * 請求空閒時執行（低優先級任務）
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, options);
  } else {
    // Fallback for Safari and older browsers
    setTimeout(callback, 1);
  }
}

/**
 * 分塊處理大量資料
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);

    // 讓出主線程
    if (i + chunkSize < items.length) {
      await new Promise((resolve) => requestIdleCallback(resolve as () => void));
    }
  }

  return results;
}

/**
 * 懶加載圖片觀察器
 */
export function createLazyImageObserver(
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
}
