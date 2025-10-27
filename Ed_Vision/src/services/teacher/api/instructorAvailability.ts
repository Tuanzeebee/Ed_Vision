import { API_CONFIG, buildUrl } from './config';
import type {
  AddAvailabilityDateDto,
  BulkCreateAvailabilityDto,
  AvailabilityResponse,
  AvailabilityStatistics,
} from './types';
import { cacheService } from '../../cache';

/**
 * Instructor Availability API Service
 * Handles all API calls related to instructor availability management
 * Implements multi-layer caching for optimal performance
 */
class InstructorAvailabilityApi {
  private baseUrl = API_CONFIG.ENDPOINTS.INSTRUCTOR_AVAILABILITY;
  
  // Cache TTL configurations (in milliseconds)
  private readonly CACHE_TTL = {
    AVAILABILITY: 5 * 60 * 1000,    // 5 minutes for availability data
    STATISTICS: 10 * 60 * 1000,     // 10 minutes for statistics
    SHORT: 2 * 60 * 1000,            // 2 minutes for frequently changing data
  };

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ message: string; timestamp: string }> {
    try {
      const url = buildUrl(`${this.baseUrl}/admin/test`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('API connection test failed');
      }
      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get instructor's availability
   * @param instructorId - Instructor ID
   * @param startDate - Optional start date (YYYY-MM-DD)
   * @param endDate - Optional end date (YYYY-MM-DD)
   * @param skipCache - Force skip cache and fetch fresh data
   */
  async getAvailability(
    instructorId: number,
    startDate?: string,
    endDate?: string,
    skipCache: boolean = false
  ): Promise<AvailabilityResponse> {
    try {
      // Generate cache key
      const cacheKey = cacheService.getAvailabilityKey(instructorId, startDate, endDate);

      // Check cache first (unless skipCache is true)
      if (!skipCache) {
        const cachedData = cacheService.get<AvailabilityResponse>(cacheKey, {
          ttl: this.CACHE_TTL.AVAILABILITY,
        });
        if (cachedData) {
          return cachedData;
        }
      }

      // Fetch from API if cache miss
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const url = buildUrl(`${this.baseUrl}/${instructorId}`, params);
      
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Không thể tải thời gian biểu');
      }

      const result = await response.json();
      
      // Store in cache for future requests
      cacheService.set(cacheKey, result, {
        ttl: this.CACHE_TTL.AVAILABILITY,
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get instructor's availability statistics
   * @param instructorId - Instructor ID
   * @param skipCache - Force skip cache and fetch fresh data
   */
  async getStatistics(instructorId: number, skipCache: boolean = false): Promise<AvailabilityStatistics> {
    try {
      // Generate cache key
      const cacheKey = cacheService.getStatisticsKey(instructorId);

      // Check cache first
      if (!skipCache) {
        const cachedData = cacheService.get<AvailabilityStatistics>(cacheKey, {
          ttl: this.CACHE_TTL.STATISTICS,
        });
        if (cachedData) {
          return cachedData;
        }
      }

      // Fetch from API
      const url = buildUrl(`${this.baseUrl}/${instructorId}/statistics`);
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'Không thể tải thống kê');
      }

      const result = await response.json();
      
      // Store in cache
      cacheService.set(cacheKey, result, {
        ttl: this.CACHE_TTL.STATISTICS,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a new availability date with optional time slots
   * @param instructorId - Instructor ID
   * @param data - Date and time slots data
   */
  async addAvailabilityDate(
    instructorId: number,
    data: AddAvailabilityDateDto
  ): Promise<any> {
    const url = buildUrl(`${this.baseUrl}/${instructorId}/dates`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Không thể thêm ngày có thể dạy');
    }

    // Invalidate cache after modification
    cacheService.invalidateInstructorCache(instructorId);

    return response.json();
  }

  /**
   * Bulk create availability dates with time slots
   * @param instructorId - Instructor ID
   * @param data - Bulk availability data
   */
  async bulkCreateAvailability(
    instructorId: number,
    data: BulkCreateAvailabilityDto
  ): Promise<any> {
    const url = buildUrl(`${this.baseUrl}/${instructorId}/dates/bulk`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Không thể tạo hàng loạt thời gian biểu');
    }

    // Invalidate cache after bulk modification
    cacheService.invalidateInstructorCache(instructorId);

    return response.json();
  }

  /**
   * Delete all time slots for a specific date
   * @param instructorId - Instructor ID
   * @param date - Date to delete (YYYY-MM-DD)
   */
  async deleteAvailabilityDate(instructorId: number, date: string): Promise<void> {
    const url = buildUrl(`${this.baseUrl}/${instructorId}/dates/${date}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Không thể xóa ngày có thể dạy');
    }

    // Invalidate cache after deletion
    cacheService.invalidateInstructorCache(instructorId);
  }

  /**
   * Add a time slot to an existing date
   * @param instructorId - Instructor ID
   * @param date - Date to add slot to (YYYY-MM-DD)
   * @param slotData - Time slot data
   */
  async addTimeSlot(
    instructorId: number,
    date: string,
    slotData: {
      startTime: string;
      endTime: string;
      meetingType: 'online' | 'offline' | 'both';
      capacity: number;
      note?: string;
    }
  ): Promise<any> {
    // Add time slot by adding the date with the new slot
    const result = await this.addAvailabilityDate(instructorId, {
      date,
      timeSlots: [slotData],
    });
    
    // Cache is already invalidated in addAvailabilityDate
    return result;
  }

  /**
   * Delete a specific time slot
   * @param instructorId - Instructor ID
   * @param slotId - Slot ID to delete
   */
  async deleteTimeSlot(instructorId: number, slotId: number): Promise<void> {
    const url = buildUrl(`${this.baseUrl}/${instructorId}/slots/${slotId}`);
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Không thể xóa khung giờ');
    }

    // Invalidate cache after deletion
    cacheService.invalidateInstructorCache(instructorId);
  }
}

// Export singleton instance
export const instructorAvailabilityApi = new InstructorAvailabilityApi();
