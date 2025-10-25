import { useState, useCallback, useEffect } from 'react';
import { cacheService } from '../../../services/cache';

/**
 * Custom hook for managing cached data with automatic invalidation
 * Reduces abstraction and provides simple caching interface
 */
export function useCachedData<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    enableCache?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableCache = options?.enableCache !== false;
  const ttl = options?.ttl || 5 * 60 * 1000; // Default 5 minutes

  /**
   * Load data from cache or fetch from source
   */
  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        // Try cache first
        if (enableCache && !forceRefresh) {
          const cached = cacheService.get<T>(cacheKey, { ttl });
          if (cached) {
            console.log(`✓ Cache hit: ${cacheKey}`);
            setData(cached);
            setLoading(false);
            return cached;
          }
        }

        // Fetch fresh data
        console.log(`⚡ Fetching fresh data: ${cacheKey}`);
        const freshData = await fetcher();
        setData(freshData);

        // Store in cache
        if (enableCache) {
          cacheService.set(cacheKey, freshData, { ttl });
        }

        return freshData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, fetcher, enableCache, ttl]
  );

  /**
   * Invalidate cache and optionally reload
   */
  const invalidate = useCallback(
    async (reload: boolean = false) => {
      cacheService.remove(cacheKey);
      console.log(`✓ Cache invalidated: ${cacheKey}`);
      if (reload) {
        await loadData(true);
      }
    },
    [cacheKey, loadData]
  );

  /**
   * Update cache with new data
   */
  const updateCache = useCallback(
    (newData: T) => {
      setData(newData);
      if (enableCache) {
        cacheService.set(cacheKey, newData, { ttl });
        console.log(`✓ Cache updated: ${cacheKey}`);
      }
    },
    [cacheKey, enableCache, ttl]
  );

  // Auto-refresh if enabled
  useEffect(() => {
    if (options?.autoRefresh && options.refreshInterval) {
      const interval = setInterval(() => {
        loadData(true);
      }, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options?.autoRefresh, options?.refreshInterval, loadData]);

  return {
    data,
    loading,
    error,
    loadData,
    invalidate,
    updateCache,
    refresh: () => loadData(true),
  };
}
