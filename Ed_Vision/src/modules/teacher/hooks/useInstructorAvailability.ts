import { useState, useCallback, useRef } from 'react';
import { instructorAvailabilityApi } from '../../../services/teacher/api';
import type {
  AvailabilityResponse,
  AvailabilityStatistics,
  AddAvailabilityDateDto,
  BulkCreateAvailabilityDto,
  TimeSlotResponse,
  AvailabilityDateResponse,
} from '../../../services/teacher/api';
import type { AvailableDate } from '../types/appointment.types';

/**
 * Custom hook for managing instructor availability
 * Handles API calls and state management for availability data
 * Implements optimized caching and reduces unnecessary re-renders
 */
export function useInstructorAvailability(instructorId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track ongoing requests and prevent duplicate calls
  const fetchInProgressRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Debounce threshold (minimum time between fetches in ms)
  const DEBOUNCE_THRESHOLD = 200; // Reduced from 1000ms to 200ms for better responsiveness

  /**
   * Convert backend response to frontend AvailableDate format
   */
  const convertToFrontendFormat = useCallback(
    (response: AvailabilityResponse): AvailableDate[] => {
      return response.availabilities.map((avail: AvailabilityDateResponse) =>({
        date: avail.date,
        weekId: avail.weekId,
        isAvailable: avail.isAvailable,
        timeSlots: avail.timeSlots.map((slot: TimeSlotResponse) =>({
          slotId: slot.slotId,
          start: slot.startTime,
          end: slot.endTime,
          meetingType: slot.meetingType as 'online'| 'offline'| 'both',
          capacity: slot.capacity,
        })),
      }));
    },
    []
  );

  /**
   * Convert frontend AvailableDate to backend format
   */
  const convertToBackendFormat = useCallback(
    (dates: AvailableDate[]): AddAvailabilityDateDto[] => {
      return dates.map((date) =>({
        date: date.date,
        timeSlots: date.timeSlots.map((slot) =>({
          startTime: slot.start,
          endTime: slot.end,
          meetingType: slot.meetingType || 'both',
          capacity: slot.capacity || 10,
          note: undefined,
        })),
      }));
    },
    []
  );

  /**
   * Fetch availability data from backend
   * Implements debouncing and prevents duplicate requests
   */
  const fetchAvailability = useCallback(
    async (startDate?: string, endDate?: string, forceRefresh: boolean = false, autoCreate: boolean = true): Promise<AvailableDate[]>=> {
      // Validate instructorId
      if (!instructorId || instructorId <= 0) {
        console.warn('Invalid instructorId, skipping fetch');
        return [];
      }

      // Prevent duplicate concurrent requests
      if (fetchInProgressRef.current && !forceRefresh) {
        return [];
      }

      // Implement debouncing - prevent rapid successive calls
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < DEBOUNCE_THRESHOLD && !forceRefresh) {
        return [];
      }

      fetchInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      setLoading(true);
      setError(null);
      
      try {
        // skipCache parameter added to API - will use cache unless forceRefresh is true
        const response = await instructorAvailabilityApi.getAvailability(
          instructorId,
          startDate,
          endDate,
          forceRefresh, // Skip cache if force refresh
          autoCreate // Whether to auto-create week if not exists
        );
        const frontendData = convertToFrontendFormat(response);
        return frontendData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải thời gian biểu';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [instructorId, convertToFrontendFormat]
  );

  /**
   * Fetch availability data for a specific week
   * Returns exactly what backend provides - no client-side date generation
   * @param forceRefresh - Force skip cache and fetch fresh data (default: true for consistency)
   */
  const fetchWeeklyAvailability = useCallback(
    async (weekStartDate: string, weekEndDate: string, autoCreateWeek: boolean = false, forceRefresh: boolean = true): Promise<AvailableDate[]>=> {
      // autoCreateWeek = false nghĩa là không tự động tạo tuần mới nếu chưa có
      // forceRefresh = true by default to always get fresh data
      const backendData = await fetchAvailability(weekStartDate, weekEndDate, forceRefresh, autoCreateWeek);
      return backendData;
    },
    [fetchAvailability]
  );

  /**
   * Fetch statistics
   * Utilizes caching for improved performance
   */
  const fetchStatistics = useCallback(async (forceRefresh: boolean = false): Promise<AvailabilityStatistics>=> {
    // Validate instructorId
    if (!instructorId || instructorId <= 0) {
      throw new Error('Invalid instructorId');
    }

    setLoading(true);
    setError(null);
    try {
      const stats = await instructorAvailabilityApi.getStatistics(instructorId, forceRefresh);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thống kê';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  /**
   * Add a single availability date with time slots
   */
  const addAvailabilityDate = useCallback(
    async (date: string, timeSlots?: AvailableDate['timeSlots']): Promise<void>=> {
      // Validate instructorId
      if (!instructorId || instructorId <= 0) {
        throw new Error('Invalid instructorId');
      }

      setLoading(true);
      setError(null);
      try {
        const dto: AddAvailabilityDateDto = {
          date,
          timeSlots: timeSlots?.map((slot) =>({
            startTime: slot.start,
            endTime: slot.end,
            meetingType: slot.meetingType || 'both',
            capacity: slot.capacity || 10,
          })),
        };
        await instructorAvailabilityApi.addAvailabilityDate(instructorId, dto);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể thêm ngày có thể dạy';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructorId]
  );

  /**
   * Bulk create availability dates
   */
  const bulkCreateAvailability = useCallback(
    async (dates: AvailableDate[]): Promise<void>=> {
      // Validate instructorId
      if (!instructorId || instructorId <= 0) {
        throw new Error('Invalid instructorId');
      }

      setLoading(true);
      setError(null);
      try {
        const availabilities = convertToBackendFormat(dates);
        const dto: BulkCreateAvailabilityDto = { availabilities };
        await instructorAvailabilityApi.bulkCreateAvailability(instructorId, dto);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Không thể tạo hàng loạt thời gian biểu';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructorId, convertToBackendFormat]
  );

  /**
   * Delete availability date
   */
  const deleteAvailabilityDate = useCallback(
    async (date: string): Promise<void>=> {
      // Validate instructorId
      if (!instructorId || instructorId <= 0) {
        console.error('Invalid instructorId:', instructorId);
        throw new Error('Invalid instructorId');
      }

      setLoading(true);
      setError(null);
      try {
        await instructorAvailabilityApi.deleteAvailabilityDate(instructorId, date);
      } catch (err) {
        console.error('API deleteAvailabilityDate failed:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Không thể xóa ngày có thể dạy';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructorId]
  );

  /**
   * Add a time slot to an existing date
   */
  const addTimeSlot = useCallback(
    async (
      date: string,
      slotData: {
        startTime: string;
        endTime: string;
        meetingType: 'online'| 'offline'| 'both';
        capacity: number;
      }
    ): Promise<void>=> {
      // Validate instructorId
      if (!instructorId || instructorId <= 0) {
        throw new Error('Invalid instructorId');
      }

      setLoading(true);
      setError(null);
      try {
        await instructorAvailabilityApi.addTimeSlot(instructorId, date, slotData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add time slot';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instructorId]
  );

  return {
    loading,
    error,
    fetchAvailability,
    fetchWeeklyAvailability,
    fetchStatistics,
    addAvailabilityDate,
    bulkCreateAvailability,
    deleteAvailabilityDate,
    addTimeSlot,
  };
}
