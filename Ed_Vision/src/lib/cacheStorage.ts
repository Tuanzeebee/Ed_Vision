/**
 * Enhanced localStorage utility with async operations and caching
 */

type CacheItem<T> = {
  value: T;
  timestamp: number;
  expiry?: number;
};

const memoryCache = new Map<string, any>();

/**
 * Get item from localStorage with memory cache fallback
 */
export function getCachedItem<T>(
  key: string,
  defaultValue?: T
): T | null {
  // Check memory cache first
  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    const now = Date.now();
    
    // Check if expired
    if (cached.expiry && cached.expiry < now) {
      memoryCache.delete(key);
      localStorage.removeItem(key);
      return defaultValue ?? null;
    }
    
    return cached.value;
  }

  // Fall back to localStorage
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue ?? null;

    const parsed: CacheItem<T> = JSON.parse(item);
    const now = Date.now();

    // Check expiry
    if (parsed.expiry && parsed.expiry < now) {
      localStorage.removeItem(key);
      return defaultValue ?? null;
    }

    // Update memory cache
    memoryCache.set(key, parsed);
    return parsed.value;
  } catch (error) {
    console.error(`Error reading from cache: ${key}`, error);
    return defaultValue ?? null;
  }
}

/**
 * Set item to localStorage with memory cache
 */
export function setCachedItem<T>(
  key: string,
  value: T,
  expiryMs?: number
): void {
  const cacheItem: CacheItem<T> = {
    value,
    timestamp: Date.now(),
    expiry: expiryMs ? Date.now() + expiryMs : undefined,
  };

  // Update memory cache immediately
  memoryCache.set(key, cacheItem);

  // Schedule localStorage update using requestIdleCallback
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      try {
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.error(`Error writing to cache: ${key}`, error);
      }
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.error(`Error writing to cache: ${key}`, error);
      }
    }, 0);
  }
}

/**
 * Async version of setCachedItem for non-blocking updates
 */
export async function setCachedItemAsync<T>(
  key: string,
  value: T,
  expiryMs?: number
): Promise<void> {
  const cacheItem: CacheItem<T> = {
    value,
    timestamp: Date.now(),
    expiry: expiryMs ? Date.now() + expiryMs : undefined,
  };

  // Update memory cache immediately
  memoryCache.set(key, cacheItem);

  // Use requestIdleCallback for async localStorage update
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        try {
          localStorage.setItem(key, JSON.stringify(cacheItem));
          resolve();
        } catch (error) {
          console.error(`Error writing to cache: ${key}`, error);
          resolve();
        }
      });
    } else {
      setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(cacheItem));
          resolve();
        } catch (error) {
          console.error(`Error writing to cache: ${key}`, error);
          resolve();
        }
      }, 0);
    }
  });
}

/**
 * Remove item from cache
 */
export function removeCachedItem(key: string): void {
  memoryCache.delete(key);
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      localStorage.removeItem(key);
    });
  } else {
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 0);
  }
}

/**
 * Clear all cache (both memory and localStorage)
 */
export function clearCache(prefix?: string): void {
  if (prefix) {
    // Clear items with specific prefix
    const keysToDelete: string[] = [];
    memoryCache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => {
      memoryCache.delete(key);
      localStorage.removeItem(key);
    });
  } else {
    // Clear all
    memoryCache.clear();
    localStorage.clear();
  }
}

/**
 * Get cache size information
 */
export function getCacheInfo(): {
  memorySize: number;
  localStorageSize: number;
} {
  const memorySize = memoryCache.size;
  const localStorageSize = Object.keys(localStorage).length;

  return {
    memorySize,
    localStorageSize,
  };
}

/**
 * Batch set multiple items efficiently
 */
export function batchSetCached<T extends Record<string, any>>(
  items: T,
  expiryMs?: number
): void {
  const updates = Object.entries(items);
  
  // Update memory cache immediately for all items
  updates.forEach(([key, value]) => {
    const cacheItem: CacheItem<any> = {
      value,
      timestamp: Date.now(),
      expiry: expiryMs ? Date.now() + expiryMs : undefined,
    };
    memoryCache.set(key, cacheItem);
  });

  // Batch update localStorage
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      updates.forEach(([key, value]) => {
        try {
          const cacheItem: CacheItem<any> = {
            value,
            timestamp: Date.now(),
            expiry: expiryMs ? Date.now() + expiryMs : undefined,
          };
          localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
          console.error(`Error writing to cache: ${key}`, error);
        }
      });
    });
  } else {
    setTimeout(() => {
      updates.forEach(([key, value]) => {
        try {
          const cacheItem: CacheItem<any> = {
            value,
            timestamp: Date.now(),
            expiry: expiryMs ? Date.now() + expiryMs : undefined,
          };
          localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
          console.error(`Error writing to cache: ${key}`, error);
        }
      });
    }, 0);
  }
}
