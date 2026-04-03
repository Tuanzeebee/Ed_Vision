/**
 * Cache Service - Multi-layer caching implementation
 * Implements memory cache and session storage cache
 */

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  enableMemoryCache?: boolean;
  enableSessionCache?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>>= new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key =>`${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from memory cache
   */
  getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (entry && this.isValid(entry)) {
      return entry.data;
    }
    // Clean up expired entry
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  /**
   * Set data to memory cache
   */
  setMemoryCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T>= {
      data,
      timestamp: Date.now(),
      ttl,
    };
    this.memoryCache.set(key, entry);
  }

  /**
   * Get data from session storage
   */
  getSessionCache<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T>= JSON.parse(item);
      if (this.isValid(entry)) {
        return entry.data;
      }
      // Clean up expired entry
      sessionStorage.removeItem(key);
      return null;
    } catch (error) {
      console.error('Error reading from session cache:', error);
      return null;
    }
  }

  /**
   * Set data to session storage
   */
  setSessionCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    try {
      const entry: CacheEntry<T>= {
        data,
        timestamp: Date.now(),
        ttl,
      };
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing to session cache:', error);
    }
  }

  /**
   * Get data from cache (checks memory first, then session)
   */
  get<T>(key: string, config?: CacheConfig): T | null {
    const enableMemory = config?.enableMemoryCache !== false;
    const enableSession = config?.enableSessionCache !== false;

    // Check memory cache first (faster)
    if (enableMemory) {
      const memoryData = this.getMemoryCache<T>(key);
      if (memoryData !== null) {
        return memoryData;
      }
    }

    // Check session cache
    if (enableSession) {
      const sessionData = this.getSessionCache<T>(key);
      if (sessionData !== null) {
        // Populate memory cache for faster future access
        if (enableMemory) {
          this.setMemoryCache(key, sessionData, config?.ttl);
        }
        return sessionData;
      }
    }

    return null;
  }

  /**
   * Set data to cache (both memory and session)
   */
  set<T>(key: string, data: T, config?: CacheConfig): void {
    const ttl = config?.ttl || this.DEFAULT_TTL;
    const enableMemory = config?.enableMemoryCache !== false;
    const enableSession = config?.enableSessionCache !== false;

    if (enableMemory) {
      this.setMemoryCache(key, data, ttl);
    }

    if (enableSession) {
      this.setSessionCache(key, data, ttl);
    }
  }

  /**
   * Remove data from all caches
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from session cache:', error);
    }
  }

  /**
   * Clear all caches matching a prefix
   */
  clearByPrefix(prefix: string): void {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear session cache
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing session cache by prefix:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.memoryCache.clear();
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing session cache:', error);
    }
  }

  /**
   * Generate cache key for instructor availability
   */
  getAvailabilityKey(instructorId: number, startDate?: string, endDate?: string): string {
    return this.generateKey('instructor-availability', {
      instructorId,
      startDate: startDate || 'all',
      endDate: endDate || 'all',
    });
  }

  /**
   * Generate cache key for statistics
   */
  getStatisticsKey(instructorId: number): string {
    return `instructor-statistics:${instructorId}`;
  }

  /**
   * Invalidate all instructor-related caches
   */
  invalidateInstructorCache(instructorId: number): void {
    this.clearByPrefix(`instructor-availability:instructorId=${instructorId}`);
    this.clearByPrefix(`instructor-statistics:${instructorId}`);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
