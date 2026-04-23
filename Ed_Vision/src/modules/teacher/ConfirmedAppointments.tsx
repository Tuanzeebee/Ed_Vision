import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import type { AppointmentRequest } from './types/appointment.types';
import { Button } from '@/components/ui/teacher/teacher_button';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { useTranslation } from 'react-i18next';

interface ConfirmedAppointmentsProps {
  requests: AppointmentRequest[];
  setRequests: (requests: AppointmentRequest[]) => void;
  showToast: (message: string, type: string) => void;
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('dev-token') || 
         localStorage.getItem('token') || 
         '';
};

// Helper function to format date/time from slot data
const formatDateTime = (slot: any, t: any) => {
  if (!slot) return { date: t('appointments.management.unknown'), time: t('appointments.management.unknown') };
  
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = slot.dayOfWeek !== undefined && slot.dayOfWeek !== null 
    ? t(`scheduleManagement.detail.${dayKeys[slot.dayOfWeek]}`)
    : t('appointments.management.unknown');
  
  const formatTime = (timeStr: any) => {
    if (!timeStr) return '';
    
    // If it's already a formatted string (HH:MM), return it
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Handle Date object or ISO string
    try {
      const date = new Date(timeStr);
      // Check if valid date
      if (isNaN(date.getTime())) return '';
      
      // Extract just the time portion (HH:MM)
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };
  
  return {
    date: dayName,
    time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
  };
};

export default function ConfirmedAppointments({
  requests: propRequests,
  setRequests: propSetRequests,
  showToast,
}: ConfirmedAppointmentsProps) {
  const { t } = useTranslation('teacher');
  const { filterOptions, loading: loadingFilters } = useFilterOptions()
  const [requests, setRequests] = useState<AppointmentRequest[]>(propRequests);
  const [loading, setLoading] = useState(false);
  
  // Cancel confirmed appointment modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  // Confirmed page filter and sort state
  const [confirmedClassFilter, setConfirmedClassFilter] = useState<string>('all');
  const [confirmedSortBy, setConfirmedSortBy] = useState<'nearest' | 'latest'>('nearest');

  // Pagination state
  const [confirmedPage, setConfirmedPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch confirmed appointments from API
  const fetchConfirmedAppointments = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      // Fetch confirmed appointments from parent only
      const response = await fetch('/api/booking/instructor/requests?status=confirmed&bookerRole=parent', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch confirmed appointments:', response.statusText);
        return;
      }

      const data = await response.json();
      
      // Transform API data to match AppointmentRequest type
      const transformedRequests: AppointmentRequest[] = (Array.isArray(data) ? data : []).map((appt: any) => {
        const { date, time } = formatDateTime(appt.slot, t);
        
        // Format requestedAt date properly
        const formatRequestedAt = (dateStr: any) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            return date.toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
          } catch (e) {
            return '';
          }
        };
        
        return {
          id: appt.appointmentId || appt.id,
          parentName: appt.parentName || 'Unknown Parent',
          parentAvatar: appt.parentAvatar || 'https://via.placeholder.com/50',
          studentName: appt.studentName || 'Unknown Student',
          studentClass: appt.studentClass || 'Unknown Class',
          type: appt.type || (appt.meetingType === 'online' ? 'online' : 'offline'),
          status: 'accepted', // Map 'confirmed' to 'accepted' for frontend
          desiredDate: date,
          desiredTime: time,
          reason: appt.reason || appt.meetingPurpose || 'No reason provided',
          requestedAt: formatRequestedAt(appt.requestedAt),
          platform: appt.platform || (appt.meetingType === 'online' ? 'Google Meet' : undefined),
        };
      });

      setRequests(transformedRequests);
      propSetRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching confirmed appointments:', error);
      showToast('Không thể tải danh sách lịch hẹn đã xác nhận', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchConfirmedAppointments();
  }, []);

  const confirmedRequests = requests.filter((r) => r.status === 'accepted');

  // Get unique classes from confirmed requests
  const uniqueClasses = Array.from(new Set(confirmedRequests.map((r) => r.studentClass)));

  // Filter and sort confirmed requests
  let filteredConfirmedRequests = confirmedRequests.filter((req) => {
    if (confirmedClassFilter === 'all') return true;
    return req.studentClass === confirmedClassFilter;
  });

  // Sort by time (nearest first or latest first)
  filteredConfirmedRequests = [...filteredConfirmedRequests].sort((a, b) => {
    const getTime = (timeStr: string) => {
      const match = timeStr.match(/(\d{2}:\d{2})/);
      return match ? match[1] : '00:00';
    };

    const timeA = getTime(a.desiredTime);
    const timeB = getTime(b.desiredTime);

    if (confirmedSortBy === 'nearest') {
      return timeA.localeCompare(timeB);
    } else {
      return timeB.localeCompare(timeA);
    }
  });

  // Reset pagination when confirmed filter or sort changes
  useEffect(() => {
    setConfirmedPage(1);
  }, [confirmedClassFilter, confirmedSortBy]);

  const handleOpenCancelModal = (requestId: number) => {
    setCancelingRequestId(requestId);
    setCancelModalOpen(true);
    setCancelReason('');
    setCustomCancelReason('');
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setCancelingRequestId(null);
    setCancelReason('');
    setCustomCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      showToast('Vui lòng chọn lý do hủy lịch hẹn!', 'error');
      return;
    }

    if (cancelReason === 'custom' && !customCancelReason.trim()) {
      showToast('Vui lòng nhập lý do cụ thể!', 'error');
      return;
    }

    if (cancelingRequestId !== null) {
      setIsCanceling(true);
      try {
        const reasonMessages: Record<string, string> = {
          schedule_conflict: 'Có lịch đột xuất',
          personal_leave: 'Nghỉ phép',
          meeting_conflict: 'Có cuộc họp quan trọng',
          health_issue: 'Vấn đề sức khỏe',
          time_error: 'Nhầm lẫn thời gian',
          custom: customCancelReason,
        };

        const reasonText = reasonMessages[cancelReason];
        const token = getAuthToken();
        
        // Call API to cancel the appointment with reason
        const reasonParam = encodeURIComponent(reasonText);
        const response = await fetch(`/api/booking/${cancelingRequestId}?reason=${reasonParam}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to cancel appointment');
        }

        // Update local state
        setRequests(requests.filter((req) => req.id !== cancelingRequestId));

        showToast(`Đã hủy lịch hẹn. Lý do: ${reasonText}. Phụ huynh đã được thông báo.`, 'warning');
        handleCloseCancelModal();

        // Refresh data
        await fetchConfirmedAppointments();
      } catch (error: any) {
        console.error('Error canceling appointment:', error);
        showToast(error.message || 'Không thể hủy lịch hẹn', 'error');
      } finally {
        setIsCanceling(false);
      }
    }
  };

  // Pagination logic
  const totalConfirmedPages = Math.ceil(filteredConfirmedRequests.length / itemsPerPage);
  const startConfirmedIndex = (confirmedPage - 1) * itemsPerPage;
  const endConfirmedIndex = startConfirmedIndex + itemsPerPage;
  const paginatedConfirmed = filteredConfirmedRequests.slice(startConfirmedIndex, endConfirmedIndex);

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2"> Lịch hẹn đã xác nhận</h1>
          <p className="text-gray-600">
            Danh sách các cuộc hẹn đã được xác nhận ({confirmedRequests.length})
          </p>
        </div>

        {/* Filter and Sort Controls */}
        {confirmedRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Filter by Class */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lọc theo lớp:
                </label>
                <select
                  value={confirmedClassFilter}
                  onChange={(e) => setConfirmedClassFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={loadingFilters}
                >
                  <option value="all">Tất cả lớp ({confirmedRequests.length})</option>
                  {filterOptions.classes.map((className) => (
                    <option key={className} value={className}>
                      {className} ({confirmedRequests.filter((r) => r.studentClass === className).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by Time */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp theo thời gian:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmedSortBy('nearest')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                      confirmedSortBy === 'nearest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Clock className="inline w-4 h-4 mr-1" />
                    Giờ gần nhất
                  </button>
                  <button
                    onClick={() => setConfirmedSortBy('latest')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                      confirmedSortBy === 'latest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Clock className="inline w-4 h-4 mr-1" />
                    Giờ muộn nhất
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-gray-600">Đang tải lịch hẹn đã xác nhận...</p>
            </div>
          </div>
        ) : confirmedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có lịch hẹn đã xác nhận
            </h3>
            <p className="text-gray-600">Các cuộc hẹn được chấp nhận sẽ hiển thị ở đây</p>
          </div>
        ) : filteredConfirmedRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy lịch hẹn phù hợp
            </h3>
            <p className="text-gray-600">Thử thay đổi bộ lọc để xem thêm kết quả</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedConfirmed.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={request.parentAvatar}
                      alt={request.parentName}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.parentName}</h3>
                          <p className="text-sm text-gray-600">
                            Phụ huynh của {request.studentName} - {request.studentClass}
                            <span className="ml-2 text-xs text-gray-500">{t('appointments.requests.children')}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Đã xác nhận
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Ngày hẹn:</span>
                          <span className="ml-2">{request.desiredDate}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Thời gian:</span>
                          <span className="ml-2">{request.desiredTime}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            request.type === 'online'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {request.type === 'online' ? ' Trực tuyến' : ' Trực tiếp'}
                          {request.platform && ` - ${request.platform}`}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">Lý do hẹn:</p>
                        <p className="text-sm text-gray-600">{request.reason}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Yêu cầu lúc: {request.requestedAt}
                        </p>
                        <button
                          onClick={() => handleOpenCancelModal(request.id)}
                          className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Hủy lịch hẹn
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalConfirmedPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{startConfirmedIndex + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(endConfirmedIndex, filteredConfirmedRequests.length)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{filteredConfirmedRequests.length}</span> lịch hẹn
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmedPage((prev) => Math.max(1, prev - 1))}
                    disabled={confirmedPage === 1}
                  >
                    Trước
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalConfirmedPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={confirmedPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setConfirmedPage(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmedPage((prev) => Math.min(totalConfirmedPages, prev + 1))}
                    disabled={confirmedPage === totalConfirmedPages}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Confirmed Appointment Modal */}
      {cancelModalOpen && cancelingRequestId && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertTriangle className="text-orange-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hủy lịch hẹn</h3>
                  <p className="text-xs text-gray-600">Chọn lý do hủy</p>
                </div>
              </div>

              {/* Thông tin lịch hẹn */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
                {(() => {
                  const request = requests.find((r) => r.id === cancelingRequestId);
                  if (!request) return null;

                  return (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{request.parentName}</p>
                      <p className="text-xs text-gray-600">
                        Phụ huynh của {request.studentName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-700 mt-2">
                        <span> {request.desiredDate}</span>
                        <span>•</span>
                        <span> {request.desiredTime}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Lý do hủy - Compact version */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">Lý do hủy:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="schedule_conflict"
                      checked={cancelReason === 'schedule_conflict'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Có lịch đột xuất</span>
                  </label>

                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="personal_leave"
                      checked={cancelReason === 'personal_leave'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Nghỉ phép</span>
                  </label>

                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="meeting_conflict"
                      checked={cancelReason === 'meeting_conflict'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Có cuộc họp quan trọng</span>
                  </label>

                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="health_issue"
                      checked={cancelReason === 'health_issue'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Vấn đề sức khỏe</span>
                  </label>

                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="time_error"
                      checked={cancelReason === 'time_error'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Nhầm lẫn thời gian</span>
                  </label>

                  <label className="flex items-center px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value="custom"
                      checked={cancelReason === 'custom'}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Lý do khác</span>
                  </label>
                </div>
              </div>

              {/* Lý do tùy chỉnh */}
              {cancelReason === 'custom' && (
                <div className="mb-3">
                  <textarea
                    id="customCancelReason"
                    rows={2}
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nhập lý do hủy..."
                  />
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                <div className="flex gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-800">Cảnh báo</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Hủy lịch hẹn sẽ gửi thông báo đến phụ huynh. Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCloseCancelModal}
                  disabled={isCanceling}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCanceling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCanceling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Xác nhận hủy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
