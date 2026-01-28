interface DebouncedFunction<T extends (...args: any[]) => any> extends T {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined; // flush might return last result or undefined if no pending calls
}

interface ThrottledFunction<T extends (...args: any[]) => any> extends T {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined; // flush might return last result or undefined if no pending calls
}

interface MemoizedFunction<T extends (...args: any[]) => any> extends T {
  clear: () => void;
  readonly size: number; // Use readonly getter for size
}

/**
 * 效能優化工具
 * 提供 memoization、debounce、throttle 等效能優化函數
 */

/**
 * 簡單的 memoization 快取 (LRU 策略)
 *
 * @issue 1: 工具函數直接修改輸入函數的類型 -> 改為返回 MemoizedFunction<T>
 * @issue 2: 快取清除策略過於簡單 -> 改為 LRU (Least Recently Used) 策略
 * @issue 3: 缺乏記憶體洩漏防護 -> maxSize 和 ttl 已經是主要防護，LRU 進一步優化。對於複雜物件參數，`JSON.stringify` 仍是限制。
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number; // Time to live in milliseconds
  } = {}
): MemoizedFunction<T> {
  const { maxSize = 100, ttl } = options;
  // Using Map for LRU: items are re-inserted on access to move to the end (most recently used)
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args); // JSON.stringify can be a bottleneck for complex objects, or lead to different keys for same-content objects if property order differs. A custom key resolver could be an enhancement.
    const cached = cache.get(key);

    // 檢查快取是否有效
    if (cached) {
      const isExpired = ttl && Date.now() - cached.timestamp > ttl;
      if (!isExpired) {
        // LRU: move item to end (most recently used)
        cache.delete(key);
        cache.set(key, cached); // Re-insert to update order
        return cached.value;
      }
      cache.delete(key); // Remove expired item
    }

    // 計算新值
    const result = fn(...args);

    // LRU: If cache exceeds maxSize, remove the least recently used item (the first one in the Map)
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    // Add new result to cache (becomes most recently used)
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as MemoizedFunction<T>; // Cast to new interface

  // 添加清除快取的方法
  memoized.clear = () => cache.clear();
  // 添加獲取快取大小的方法 (作為 getter 屬性，更符合 TypeScript 慣例)
  Object.defineProperty(memoized, 'size', {
    get: () => cache.size,
    enumerable: true,
    configurable: true,
  });

  return memoized;
}

/**
 * Debounce 函數
 * 延遲執行，直到停止呼叫一段時間後才執行
 *
 * @issue 1: 工具函數直接修改輸入函數的類型 -> 已使用 DebouncedFunction<T> 介面
 * @issue 3: 缺乏記憶體洩漏防護 -> cancel 和 flush 已妥善處理內部狀態清除
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  options: {
    leading?: boolean;  // 是否在延遲開始時執行
    trailing?: boolean; // 是否在延遲結束時執行
  } = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  let lastResult: ReturnType<T> | undefined;
  let lastCallTime: number | null = null; // Time when the debounced function was last *called*

  const invokeFunc = (time: number) => {
    if (lastArgs) {
      lastResult = fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null; // Clear references
    }
    lastCallTime = time; // Update lastCallTime when function is actually invoked
    return lastResult;
  };

  const timerExpired = () => {
    const time = Date.now();
    // If we're using trailing edge invocation and there's a pending call
    if (trailing && lastArgs) {
      invokeFunc(time);
    }
    timeoutId = null;
    lastArgs = lastThis = null; // Clear any remaining pending args/this
  };

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    const isInvoking = !lastCallTime || (now - (lastCallTime || 0) >= delay); // Check if enough time has passed since last *invocation*
    
    lastArgs = args;
    lastThis = this;
    
    // For leading edge
    if (leading && isInvoking && !timeoutId) {
      lastResult = invokeFunc(now); // Execute immediately
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set up timer for trailing edge
    if (trailing) {
        timeoutId = setTimeout(timerExpired, delay);
    } else if (timeoutId && !trailing && leading && !isInvoking) {
        // If only leading, and we just executed, but another call comes in within delay, do nothing more.
        // If leading is true and no trailing, we only care about the first call.
        // No new timer if already set and no trailing.
    } else if (!trailing && !leading) {
        // Debounce with neither leading nor trailing means it never executes. This is likely an error case,
        // but for completeness, if both are false, nothing should happen.
        // We can short-circuit or throw here, but following the original structure.
        return lastResult as ReturnType<T>; // Return last known result, or undefined
    }


    return lastResult as ReturnType<T>; // Return the result of leading call or previous result
  } as DebouncedFunction<T>;


  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastResult = undefined;
    lastCallTime = null; // Reset lastCallTime
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) { // If there's a pending trailing call
      clearTimeout(timeoutId);
      const result = invokeFunc(Date.now()); // Invoke it immediately
      debounced.cancel(); // Clear all state
      return result;
    } else if (lastArgs && lastCallTime && (Date.now() - lastCallTime < delay) && leading) {
        // Special case: if leading was true, and function was called but no trailing, and we flush before delay ends,
        // we might want to re-execute the leading part. However, a typical flush only focuses on pending *trailing* calls.
        // For simplicity and typical use-cases, we'll only flush if there's an actual `timeoutId` that implies a pending execution.
        // If a leading call was just made, `lastResult` holds its value.
        debounced.cancel(); // Clear state
        return lastResult; // Return the result from the leading call
    }
    debounced.cancel(); // Always clear state on flush
    return lastResult; // Return the last result, which might be undefined
  };

  return debounced;
}

/**
 * Throttle 函數
 * 限制函數執行頻率
 *
 * @issue 1: 工具函數直接修改輸入函數的類型 -> 已使用 ThrottledFunction<T> 介面
 * @issue 3: 缺乏記憶體洩漏防護 -> cancel 和 flush 已妥善處理內部狀態清除
 * @issue 4: throttle 函數未完整實作 -> 重新實作以確保 leading/trailing 邏輯正確
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number, // renamed from delay to limit for clarity, consistent with common throttle usage
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  let lastResult: ReturnType<T> | undefined;
  let lastExecTime: number = 0; // The timestamp when the function was last *executed*

  // This function is called when the throttle timer expires (for trailing call)
  const timerExpired = () => {
    timeoutId = null; // Clear the timer ID
    if (trailing && lastArgs) {
      lastExecTime = Date.now(); // Update last execution time
      lastResult = fn.apply(lastThis, lastArgs);
      lastArgs = lastThis = null; // Clear references
    }
  };

  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    // Handle initial call when leading is false
    if (!lastExecTime && !leading) {
      lastExecTime = now; // Pretend it was executed now to start the timer
    }

    const remaining = limit - (now - lastExecTime);

    if (remaining <= 0 || remaining > limit) { // Time has elapsed, or system clock changed significantly
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastExecTime = now; // Update last execution time immediately
      lastResult = fn.apply(this, args); // Execute the function
      lastArgs = lastThis = null; // Clear references
    } else if (!timeoutId && trailing) { // Set up a timer for a trailing call
      timeoutId = setTimeout(timerExpired, remaining);
    }
    // If leading is true and remaining > 0, we've just executed, no need to do anything.
    // If leading is false and remaining > 0, we're waiting for the first execution,
    // or for a trailing execution, which is handled by the timeoutId check.

    return lastResult as ReturnType<T>;
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastExecTime = 0; // Reset last execution time
    lastArgs = null;
    lastThis = null;
    lastResult = undefined;
  };

  throttled.flush = () => {
    if (timeoutId) { // If there's a pending trailing call
      clearTimeout(timeoutId);
      timeoutId = null;
      lastExecTime = Date.now(); // Update last execution time
      if (lastArgs) { // Ensure there are args to call with
        lastResult = fn.apply(lastThis, lastArgs);
        lastArgs = lastThis = null; // Clear references
      }
    }
    throttled.cancel(); // Always clear state on flush
    return lastResult;
  };

  return throttled;
}

/**
 * 批次處理函數
 * 將多次呼叫合併為一次批次處理
 *
 * @issue 3: 缺乏記憶體洩漏防護 -> flush 函數已妥善清除 queue 和 timeoutId
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
    if (queue.length === 0) return; // Nothing to flush

    const currentQueue = queue; // Capture current queue
    queue = []; // Reset queue immediately for new incoming items

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    try {
      const items = currentQueue.map((q) => q.item);
      const results = processor(items);

      if (results.length !== items.length) {
        throw new Error('Processor must return a result for each item in the batch.');
      }

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
  return ((this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> => { // Preserve 'this' context
    const start = performance.now();
    const result = fn.apply(this, args); // Apply 'this' context

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
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) { // Add typeof window check for SSR environments
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

    // 讓出主線程，但避免在最後一個 chunk 處理後不必要的等待
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
  // Add a check for client-side environment if this might be used in SSR
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Provide a no-op observer or throw error if not in browser context
    console.warn("IntersectionObserver is not available in this environment. Lazy loading might not work.");
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
      takeRecords: () => [],
      root: null,
      rootMargin: "",
      thresholds: [],
    } as IntersectionObserver; // Return a mock object
  }

  return new IntersectionObserver((entries, observer) => { // Pass observer to callback
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          // Once loaded, stop observing to save resources
          observer.unobserve(entry.target); // Use the passed observer instance
        }
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
}