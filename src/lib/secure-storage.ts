/**
 * Secure wrapper around localStorage with error handling.
 * Prevents unhandled exceptions when storage is unavailable (e.g., private browsing, quota exceeded).
 */

function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isStorageAvailable();

export const secureStorage = {
  getItem(key: string): string | null {
    if (!storageAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      console.warn(`secureStorage: failed to read key "${key}"`);
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`secureStorage: failed to write key "${key}"`, e);
    }
  },

  removeItem(key: string): void {
    if (!storageAvailable) return;
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`secureStorage: failed to remove key "${key}"`);
    }
  },

  clear(): void {
    if (!storageAvailable) return;
    try {
      localStorage.clear();
    } catch {
      console.warn('secureStorage: failed to clear storage');
    }
  },
};
