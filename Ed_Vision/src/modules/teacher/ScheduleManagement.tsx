import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Plus,
  X,
  Info,
  Monitor,
  MapPin,
  Globe,
  Users,
  Clock,
  Check,
} from 'lucide-react';
import type { AvailableDate } from './types/appointment.types';
import {
  formatDate,
  calculateEndTime,
  isTimeSlotOverlapping,
} from './utils/appointmentUtils';
import { useInstructorAvailability } from './hooks/useInstructorAvailability';
import { useInstructorProfile } from './hooks/useInstructorProfile';
import { instructorAvailabilityApi } from '../../services/teacher/api';
import {
  getCurrentWeek,
  formatDateForAPI,
  getDayName,
  getDatesInWeek,
} from '../../lib/weekUtils';

interface ScheduleManagementProps {
  availableDates: AvailableDate[];
  setAvailableDates: (dates: AvailableDate[]) => void;
  showToast: (message: string, type: string) => void;
}

export default function ScheduleManagement({
  availableDates,
  setAvailableDates,
  showToast,
}: ScheduleManagementProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');

  // Chỉ quản lý tuần hiện tại
  const currentWeek = getCurrentWeek();

  // Get instructor profile from logged-in account
  const { instructorId, loading: profileLoading, error: profileError } = useInstructorProfile();

  // Use the custom hook for API integration (only if instructorId is available)
  const {
    loading,
    error: apiError,
    fetchWeeklyAvailability,
    // fetchStatistics, // TODO: Use this for real-time statistics
    addAvailabilityDate,
    // bulkCreateAvailability, // TODO: Use this for bulk operations
    deleteAvailabilityDate,
    addTimeSlot,
  } = useInstructorAvailability(instructorId || 0);

  // Time modal state
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [currentDateForTime, setCurrentDateForTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [endTime, setEndTime] = useState('');
  const [meetingType, setMeetingType] = useState<'online' | 'offline' | 'both'>('both');
  const [capacity, setCapacity] = useState('10');

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<{ index: number; date: AvailableDate } | null>(null);

  // Helper function to parse date string correctly to avoid timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Chỉ load dữ liệu tuần hiện tại
  const loadCurrentWeekData = useCallback(async () => {
    if (!instructorId) return;
    
    const week = getCurrentWeek();
    try {
      const startDate = formatDateForAPI(week.startDate);
      const endDate = formatDateForAPI(week.endDate);
      // Chỉ load những ngày có sẵn, không tự động tạo tuần mới
      const data = await fetchWeeklyAvailability(startDate, endDate, false);
      
      // Nếu không có dữ liệu (tuần chưa được tạo), tạo template tuần rỗng
      if (!data || data.length === 0) {
        const weekDates = getDatesInWeek(week);
        const emptyWeekData: AvailableDate[] = weekDates.map((date: Date) => ({
          date: formatDateForAPI(date),
          isAvailable: false,
          timeSlots: [],
        }));
        setAvailableDates(emptyWeekData);
        showToast(`Khởi tạo tuần hiện tại ${week.displayText}`, 'info');
      } else {
        setAvailableDates(data);
        showToast(`Đã tải lịch tuần hiện tại`, 'success');
      }
    } catch (err) {
      // Nếu API lỗi, tạo template tuần rỗng để UI vẫn hiển thị được
      const weekDates = getDatesInWeek(week);
      const emptyWeekData: AvailableDate[] = weekDates.map((date: Date) => ({
        date: formatDateForAPI(date),
        isAvailable: false,
        timeSlots: [],
      }));
      setAvailableDates(emptyWeekData);
      showToast('Không thể tải dữ liệu. Hiển thị tuần trống.', 'warning');
    }
  }, [instructorId, fetchWeeklyAvailability, setAvailableDates, showToast]);



  // Show profile error if any
  useEffect(() => {
    if (profileError) {
      showToast(`Lỗi: ${profileError}`, 'error');
    }
  }, [profileError, showToast]);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (startTime && duration) {
      setEndTime(calculateEndTime(startTime, parseInt(duration)));
    }
  }, [startTime, duration]);

  // Load availability data cho tuần hiện tại
  useEffect(() => {
    // Don't load if instructor profile is still loading or not available
    if (profileLoading || !instructorId) {
      return;
    }

    const loadInitialData = async () => {
      // Check if this is truly the first load (session-based tracking)
      const hasLoadedThisSession = sessionStorage.getItem('scheduleDataLoaded');

      // Load current week data if never loaded this session
      if (!hasLoadedThisSession && availableDates.length === 0) {
        try {
          // Chỉ load tuần hiện tại
          await loadCurrentWeekData();

          // Mark as loaded for this session
          sessionStorage.setItem('scheduleDataLoaded', 'true');
        } catch (err) {
          // Still mark as loaded to prevent retry loops
          sessionStorage.setItem('scheduleDataLoaded', 'true');
        }
      }
    };
    loadInitialData();
  }, [instructorId, profileLoading, loadCurrentWeekData]); // Reload when instructorId becomes available

  // Show API errors via toast
  useEffect(() => {
    if (apiError) {
      showToast(apiError, 'error');
    }
  }, [apiError, showToast]);

  const handleAddDate = async (date: string) => {
    if (!date) {
      showToast('Vui lòng chọn ngày!', 'error');
      return;
    }

    // Prevent adding dates in the past
    const selectedDateObj = parseLocalDate(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayDate) {
      showToast('Không thể thêm ngày trong quá khứ!', 'error');
      return;
    }

    // Check if date already exists and is enabled
    const existingDate = availableDates.find((d) => d.date === date);
    if (existingDate?.isAvailable) {
      showToast('Ngày này đã được bật!', 'warning');
      return;
    }

    try {
      // Enable date in backend
      await addAvailabilityDate(date, []);
      
      // Update local state - set isAvailable = true for existing date
      const updatedDates = availableDates.map((d) =>
        d.date === date ? { ...d, isAvailable: true } : d
      );
      setAvailableDates(updatedDates);
      setSelectedDate('');
      showToast('Đã bật ngày rảnh thành công!', 'success');
    } catch (err) {
      showToast('Không thể bật ngày rảnh. Vui lòng thử lại!', 'error');
    }
  };

  const handleRemoveDate = async (index: number, skipConfirm: boolean = false) => {
    const dateToDisable = availableDates[index];
    const hasTimeSlots = (dateToDisable?.timeSlots?.length || 0) > 0;

    // Check if the date is in the past
    const selectedDateObj = parseLocalDate(dateToDisable.date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayDate) {
      showToast('Không thể xóa ngày rảnh đã qua!', 'error');
      return;
    }

    if (!skipConfirm) {
      // Open custom confirmation modal instead of browser confirm
      setDateToDelete({ index, date: dateToDisable });
      setDeleteConfirmOpen(true);
      return;
    }

    try {
      // Disable date in backend (sets is_available = false and removes time slots)
      await deleteAvailabilityDate(dateToDisable.date);
      
      // Update local state - set isAvailable = false and clear time slots
      const updatedDates = availableDates.map((d) =>
        d.date === dateToDisable.date 
          ? { ...d, isAvailable: false, timeSlots: [] } 
          : d
      );
      setAvailableDates(updatedDates);

      // Show appropriate message
      if (hasTimeSlots) {
        showToast(`Đã tắt ngày ${formatDate(dateToDisable.date)} và xóa ${dateToDisable.timeSlots?.length || 0} khung giờ!`, 'success');
      } else {
        showToast(`Đã tắt ngày ${formatDate(dateToDisable.date)}!`, 'success');
      }
    } catch (err) {
      showToast('Không thể tắt ngày. Vui lòng thử lại!', 'error');
    }
  };

  const confirmDeleteDate = async () => {
    if (!dateToDelete) return;

    // Check if the date is in the past (double-check)
    const selectedDateObj = parseLocalDate(dateToDelete.date.date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayDate) {
      showToast('Không thể xóa ngày rảnh đã qua!', 'error');
      setDeleteConfirmOpen(false);
      setDateToDelete(null);
      return;
    }

    showToast('Đang tắt ngày rảnh...', 'info');
    setDeleteConfirmOpen(false);

    try {
      const dateToDisable = dateToDelete.date;
      const hasTimeSlots = (dateToDisable?.timeSlots?.length || 0) > 0;

      // Disable date in backend (sets is_available = false and removes time slots)
      await deleteAvailabilityDate(dateToDisable.date);
      
      // Update local state - set isAvailable = false and clear time slots (không xóa khỏi array)
      const updatedDates = availableDates.map((d) =>
        d.date === dateToDisable.date 
          ? { ...d, isAvailable: false, timeSlots: [] } 
          : d
      );
      setAvailableDates(updatedDates);

      // Show appropriate message
      if (hasTimeSlots) {
        showToast(`Đã tắt ngày ${formatDate(dateToDisable.date)} và xóa ${dateToDisable.timeSlots?.length || 0} khung giờ!`, 'success');
      } else {
        showToast(`Đã tắt ngày ${formatDate(dateToDisable.date)}!`, 'success');
      }
    } catch (err) {
      showToast('Không thể tắt ngày. Vui lòng thử lại!', 'error');
    } finally {
      setDateToDelete(null);
    }
  };

  const cancelDeleteDate = () => {
    setDeleteConfirmOpen(false);
    setDateToDelete(null);
    showToast('Đã hủy xóa ngày rảnh', 'info');
  };

  const handleOpenTimeModal = (date: string) => {
    // Check if the date is in the past
    const selectedDateObj = parseLocalDate(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayDate) {
      showToast('Không thể thêm khung giờ vào ngày đã qua!', 'error');
      return;
    }

    setCurrentDateForTime(date);
    setTimeModalOpen(true);
    setStartTime('');
    setEndTime('');
    setDuration('60');
    setMeetingType('both');
    setCapacity('10');
  };

  const handleAddTimeSlot = async () => {
    if (!currentDateForTime || !startTime || !endTime) {
      showToast('Vui lòng nhập đầy đủ thời gian!', 'error');
      return;
    }

    // Check if the date is in the past
    const selectedDateObj = parseLocalDate(currentDateForTime);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDateObj < todayDate) {
      showToast('Không thể thêm khung giờ vào ngày đã qua!', 'error');
      setTimeModalOpen(false);
      return;
    }

    if (startTime >= endTime) {
      showToast('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!', 'error');
      return;
    }

    const dateIndex = availableDates.findIndex((d) => d.date === currentDateForTime);
    if (dateIndex === -1) {
      showToast('Lỗi: Không tìm thấy ngày để thêm khung giờ!', 'error');
      return;
    }

    if (isTimeSlotOverlapping(startTime, endTime, availableDates[dateIndex].timeSlots)) {
      showToast('Khung giờ này bị trùng với khung giờ đã có!', 'warning');
      return;
    }

    try {
      // Add to backend first
      await addTimeSlot(currentDateForTime, {
        startTime,
        endTime,
        meetingType,
        capacity: parseInt(capacity) || 10,
      });

      // Update local state
      const newDates = [...availableDates];
      newDates[dateIndex].timeSlots.push({
        start: startTime,
        end: endTime,
        meetingType: meetingType,
        capacity: parseInt(capacity) || 10,
      });
      newDates[dateIndex].timeSlots.sort((a, b) => a.start.localeCompare(b.start));
      setAvailableDates(newDates);
      setTimeModalOpen(false);
      showToast(`Đã thêm khung giờ ${startTime} - ${endTime} thành công!`, 'success');
    } catch (err) {
      showToast('Không thể thêm khung giờ. Vui lòng thử lại!', 'error');
    }
  };

  const handleRemoveTimeSlot = async (dateIndex: number, slotIndex: number) => {
    if (!instructorId) {
      showToast('Không tìm thấy thông tin giảng viên!', 'error');
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa khung giờ này?')) {
      const newDates = [...availableDates];
      const removedSlot = newDates[dateIndex].timeSlots[slotIndex];

      try {
        // Delete from backend if slotId exists
        if (removedSlot.slotId) {
          await instructorAvailabilityApi.deleteTimeSlot(instructorId, removedSlot.slotId);
        }

        // Update local state
        newDates[dateIndex].timeSlots.splice(slotIndex, 1);
        setAvailableDates(newDates);
        showToast(`Đã xóa khung giờ ${removedSlot.start} - ${removedSlot.end}!`, 'warning');
      } catch (err) {
        showToast('Không thể xóa khung giờ. Vui lòng thử lại!', 'error');
      }
    }
  };

  // Statistics - Only count enabled dates
  const enabledDates = availableDates.filter(date => date.isAvailable);
  const totalDates = enabledDates.length;
  const totalTimeSlots = enabledDates.reduce((sum, date) => sum + (date.timeSlots?.length || 0), 0);
  const totalHours = enabledDates.reduce((sum, date) => {
    return (
      sum +
      (date.timeSlots || []).reduce((slotSum, slot) => {
        const start = new Date(`2000-01-01T${slot.start}`);
        const end = new Date(`2000-01-01T${slot.end}`);
        return slotSum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0)
    );
  }, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates

  const upcomingDates = enabledDates.filter((date) => parseLocalDate(date.date) >= today).length;



  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Loading overlay for profile or API operations */}
        {(profileLoading || loading) && (
          <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-700 font-medium">
                  {profileLoading ? 'Đang tải thông tin...' : 'Đang xử lý...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Show error if instructor profile couldn't be loaded */}
        {!profileLoading && !instructorId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Không thể tải thông tin giảng viên
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{profileError || 'Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Thiết lập lịch rảnh</h1>
              <p className="text-teal-100">
                Thiết lập ngày và giờ rảnh để sinh viên có thể đặt lịch hẹn
              </p>
            </div>
            {/* Hiển thị thông tin tuần hiện tại và refresh */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-center">
                  <div className="text-sm font-medium">{currentWeek.displayText}</div>
                  <div className="text-xs text-teal-200">Tuần hiện tại</div>
                </div>
              </div>
              
              {/* Refresh button */}
              <button
                onClick={() => {
                  sessionStorage.removeItem('scheduleDataLoaded');
                  loadCurrentWeekData();
                }}
                disabled={loading}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors border border-white/30 disabled:opacity-50"
                title="Tải lại dữ liệu"
              >
                🔄 Tải lại
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-blue-50 border-blue-200 border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Thống kê lịch hẹn</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalDates}</div>
              <div className="text-sm text-gray-600">Tổng ngày rảnh</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600 mb-1">{totalTimeSlots}</div>
              <div className="text-sm text-gray-600">Khung giờ</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">{totalHours.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Tổng giờ rảnh</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">{upcomingDates}</div>
              <div className="text-sm text-gray-600">Ngày sắp tới</div>
            </div>
          </div>
        </div>

        {/* Add Date Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm ngày rảnh mới</h2>

          {/* Quick Date Selection - Week View */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn nhanh ngày trong tuần hiện tại ({currentWeek.displayText})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
              {availableDates.map((dateEntry, index) => {
                // Use dates directly from API response - no client-side generation
                const dateString = dateEntry.date;
                const date = new Date(dateString + 'T00:00:00'); // Parse API date

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = date.getTime() === today.getTime();
                const isPast = date < today;
                
                // Data is already from availableDates, no need to find again
                const dateIndex = index;
                const isEnabled = dateEntry.isAvailable || false;
                const hasTimeSlots = isEnabled && (dateEntry.timeSlots?.length || 0) > 0;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isPast && !isEnabled) {
                        showToast('Không thể thêm ngày trong quá khứ!', 'error');
                        return;
                      }

                      if (isPast && isEnabled) {
                        showToast('Không thể xóa ngày rảnh đã qua!', 'error');
                        return;
                      }
                      
                      if (isEnabled) {
                        // Validate dateIndex before removing
                        if (dateIndex === -1) {
                          showToast('Lỗi: Không tìm thấy ngày để xóa!', 'error');
                          return;
                        }
                        // Toggle: Disable date if currently enabled
                        // Don't skip confirm if there are time slots
                        handleRemoveDate(dateIndex, !hasTimeSlots);
                      } else {
                        // Enable date if not enabled
                        handleAddDate(dateString);
                      }
                    }}
                    disabled={!instructorId || (isPast && isEnabled)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 text-center ${!instructorId
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : isPast && isEnabled
                          ? 'bg-green-50 border-green-300 cursor-not-allowed opacity-60'
                        : isPast && !isEnabled
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                          : isEnabled
                            ? 'bg-green-50 border-green-500 hover:bg-green-100'
                            : isToday
                              ? 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    title={
                      isPast && isEnabled 
                        ? 'Không thể xóa ngày đã qua'
                        : isPast && !isEnabled
                          ? 'Ngày đã qua'
                          : isEnabled
                            ? 'Click để tắt ngày này'
                            : 'Click để bật ngày này'
                    }
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {getDayName(date.getDay())}
                    </div>
                    <div className={`text-lg font-bold ${isPast && !isEnabled ? 'text-gray-400' : 'text-gray-900'}`}>
                      {date.getDate().toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Th{date.getMonth() + 1}
                    </div>
                    {isEnabled && (
                      <div className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> 
                        {hasTimeSlots ? `${dateEntry?.timeSlots?.length || 0} slot` : 'Đã bật'}
                      </div>
                    )}
                    {!isEnabled && !isPast && (
                      <div className="text-xs text-gray-500 mt-1">
                        Chưa bật
                      </div>
                    )}
                    {isPast && !isEnabled && (
                      <div className="text-xs text-gray-400 mt-1">
                        Đã qua
                      </div>
                    )}
                    {isToday && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        Hôm nay
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Date Input */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="dateInput" className="block text-sm font-medium text-gray-700 mb-2">
                Hoặc chọn ngày cụ thể trong tuần hiện tại
              </label>
              <input
                type="date"
                id="dateInput"
                min={formatDateForAPI(currentWeek.startDate)}
                max={formatDateForAPI(currentWeek.endDate)}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!instructorId}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Chọn ngày trong tuần hiện tại"
              />
              <div className="text-xs text-gray-500 mt-1">
                Chỉ có thể chọn ngày trong tuần hiện tại ({currentWeek.displayText})
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleAddDate(selectedDate)}
                disabled={!instructorId || !selectedDate}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Thêm ngày rảnh
              </button>
            </div>
          </div>
        </div>

        {/* Available Dates List - Only show enabled dates */}
        {availableDates.filter(d => d.isAvailable).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ngày rảnh nào được bật</h3>
            <p className="text-gray-600">
              Hãy bật ngày rảnh đầu tiên để sinh viên có thể đặt lịch hẹn với bạn
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableDates.filter(d => d.isAvailable).map((dateObj, index) => {
              const isUpcoming = parseLocalDate(dateObj.date) >= today;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${!isUpcoming ? 'opacity-75' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div
                      className="flex items-center gap-3 mb-4 sm:mb-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate('/teacher/meeting-detail', {
                        state: {
                          date: dateObj.date,
                          timeSlots: dateObj.timeSlots
                        }
                      })}
                    >
                      <div className="p-3 rounded-lg bg-blue-100">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(dateObj.date)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <Clock className="inline w-4 h-4 mr-1" />
                          {dateObj.timeSlots.length} khung giờ
                          {!isUpcoming && ' • Đã qua'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenTimeModal(dateObj.date)}
                        disabled={!isUpcoming}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                          isUpcoming
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        }`}
                        title={!isUpcoming ? 'Không thể thêm giờ vào ngày đã qua' : 'Thêm khung giờ mới'}
                      >
                        <Plus className="w-4 h-4" />
                        Thêm giờ
                      </button>
                      <button
                        onClick={() => {
                          // Tìm index thực tế trong availableDates array
                          const actualIndex = availableDates.findIndex(d => d.date === dateObj.date);
                          if (actualIndex === -1) {
                            showToast('Lỗi: Không tìm thấy ngày để xóa!', 'error');
                            return;
                          }
                          
                          // Auto-detect: skip confirm if no time slots
                          const hasTimeSlots = dateObj.timeSlots.length > 0;
                          handleRemoveDate(actualIndex, !hasTimeSlots);
                        }}
                        disabled={!isUpcoming}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center transition-colors ${
                          isUpcoming
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        }`}
                        title={!isUpcoming ? 'Không thể xóa ngày đã qua' : 'Tắt ngày rảnh này'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {dateObj.timeSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {dateObj.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="font-semibold">
                                {slot.start} - {slot.end}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {slot.meetingType === 'online' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Monitor className="w-3 h-3 mr-1" />
                                  Online
                                </span>
                              )}
                              {slot.meetingType === 'offline' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Offline
                                </span>
                              )}
                              {slot.meetingType === 'both' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Both
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Users className="w-3 h-3 mr-1" />
                                {slot.capacity || 10} slots
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Tìm index thực tế trong availableDates array
                              const actualIndex = availableDates.findIndex(d => d.date === dateObj.date);
                              if (actualIndex === -1) {
                                showToast('Lỗi: Không tìm thấy ngày để xóa khung giờ!', 'error');
                                return;
                              }
                              handleRemoveTimeSlot(actualIndex, slotIndex);
                            }}
                            className="ml-3 text-blue-600 hover:text-red-600 transition-colors"
                            title="Xóa khung giờ"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <p className="font-medium">Chưa có khung giờ nào</p>
                      <p className="text-sm">Hãy thêm khung giờ rảnh cho ngày này!</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Modal */}
      {timeModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTimeModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Thêm khung giờ rảnh</h3>
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {currentDateForTime && formatDate(currentDateForTime)}
              </p>

              {/* Quick Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn nhanh khung giờ phổ biến
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { start: '08:00', duration: 60, label: '8:00 - 9:00 (1h)' },
                    { start: '09:00', duration: 60, label: '9:00 - 10:00 (1h)' },
                    { start: '14:00', duration: 60, label: '14:00 - 15:00 (1h)' },
                    { start: '16:00', duration: 60, label: '16:00 - 17:00 (1h)' },
                    { start: '19:00', duration: 60, label: '19:00 - 20:00 (1h)' },
                    { start: '20:00', duration: 60, label: '20:00 - 21:00 (1h)' },
                  ].map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.start);
                        setDuration(slot.duration.toString());
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 text-sm transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hoặc tùy chỉnh thời gian
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-medium text-gray-600 mb-2">
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-xs font-medium text-gray-600 mb-2">
                      Giờ kết thúc
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Meeting Type and Capacity */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thông tin bổ sung
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="meetingType" className="block text-xs font-medium text-gray-600 mb-2">
                      Loại cuộc họp
                    </label>
                    <select
                      id="meetingType"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as 'online' | 'offline' | 'both')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="both">🌍 Both (Cả hai)</option>
                      <option value="online">🌐 Online</option>
                      <option value="offline">🏫 Offline (Trực tiếp)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="capacity" className="block text-xs font-medium text-gray-600 mb-2">
                      Số lượng slot
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Số lượng slot là số phụ huynh tối đa có thể đặt lịch trong khung giờ này
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTimeSlot}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm giờ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Toast */}
      {deleteConfirmOpen && dateToDelete && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center p-4">
          <div className="pointer-events-auto w-full max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 animate-in slide-in-from-top duration-300">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Xác nhận xóa ngày rảnh
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatDate(dateToDelete.date.date)}
                  </p>
                  {dateToDelete.date.timeSlots.length > 0 && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Sẽ xóa {dateToDelete.date.timeSlots.length} khung giờ
                    </p>
                  )}
                </div>
                <button
                  onClick={cancelDeleteDate}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={cancelDeleteDate}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteDate}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}