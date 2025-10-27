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
  const DEBOUNCE_THRESHOLD = 1000; // 1 second

  /**
   * Convert backend response to frontend AvailableDate format
   */
  const convertToFrontendFormat = useCallback(
    (response: AvailabilityResponse): AvailableDate[] => {
      return response.availabilities.map((avail: AvailabilityDateResponse) => ({
        date: avail.date,
        weekId: avail.weekId,
        timeSlots: avail.timeSlots.map((slot: TimeSlotResponse) => ({
          slotId: slot.slotId,
          start: slot.startTime,
          end: slot.endTime,
          meetingType: slot.meetingType as 'online' | 'offline' | 'both',
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
      return dates.map((date) => ({
        date: date.date,
        timeSlots: date.timeSlots.map((slot) => ({
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
    async (startDate?: string, endDate?: string, forceRefresh: boolean = false): Promise<AvailableDate[]> => {
      // Prevent duplicate concurrent requests
      if (fetchInProgressRef.current && !forceRefresh) {
        console.log('⚠ Fetch already in progress, skipping duplicate request');
        return [];
      }

      // Implement debouncing - prevent rapid successive calls
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < DEBOUNCE_THRESHOLD && !forceRefresh) {
        console.log('⚠ Debounced: Too soon since last fetch');
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
          forceRefresh // Skip cache if force refresh
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
   * Fetch statistics
   * Utilizes caching for improved performance
   */
  const fetchStatistics = useCallback(async (forceRefresh: boolean = false): Promise<AvailabilityStatistics> => {
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
    async (date: string, timeSlots?: AvailableDate['timeSlots']): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const dto: AddAvailabilityDateDto = {
          date,
          timeSlots: timeSlots?.map((slot) => ({
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
    async (dates: AvailableDate[]): Promise<void> => {
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
    async (date: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await instructorAvailabilityApi.deleteAvailabilityDate(instructorId, date);
      } catch (err) {
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
        meetingType: 'online' | 'offline' | 'both';
        capacity: number;
      }
    ): Promise<void> => {
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
    fetchStatistics,
    addAvailabilityDate,
    bulkCreateAvailability,
    deleteAvailabilityDate,
    addTimeSlot,
  };
}
