/**
 * Simple in-memory cache service với TTL (Time To Live)
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set data vào cache với TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get data từ cache, trả về null nếu expired hoặc không tồn tại
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check nếu key exists và chưa expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Xóa một key khỏi cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Xóa tất cả cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Xóa tất cả cache có prefix
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get hoặc fetch nếu không có cache
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Generate cache key for availability data
   */
  getAvailabilityKey(instructorId: number, startDate?: string, endDate?: string): string {
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : 'all';
    return `availability:${instructorId}:${dateRange}`;
  }

  /**
   * Generate cache key for statistics
   */
  getStatisticsKey(instructorId: number): string {
    return `statistics:${instructorId}`;
  }

  /**
   * Invalidate all cache entries for a specific instructor
   */
  invalidateInstructorCache(instructorId: number): void {
    // Clear availability data - match the pattern used in getAvailabilityKey
    this.clearByPrefix(`availability:${instructorId}`);
    // Clear statistics
    this.clearByPrefix(`statistics:${instructorId}`);
    // Clear any other instructor-related cache
    this.clearByPrefix(`instructor:${instructorId}`);
  }
}

export const cacheService = new CacheService();
export default cacheService;
