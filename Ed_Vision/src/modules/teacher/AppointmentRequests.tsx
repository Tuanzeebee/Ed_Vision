import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import type { AppointmentRequest, FilterType } from './types/appointment.types';
import { Button } from '@/components/ui/teacher/teacher_button';

interface AppointmentRequestsProps {
  requests: AppointmentRequest[];
  setRequests: (requests: AppointmentRequest[]) => void;
  showToast: (message: string, type: string) => void;
  setCurrentPage: (page: 'schedule' | 'requests' | 'confirmed') => void;
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('dev-token') || 
         localStorage.getItem('token') || 
         '';
};

// Helper function to format date/time from slot data
const formatDateTime = (slot: any, t: any) => {
  if (!slot) return { date: 'Unknown', time: 'Unknown' };
  
  const dayNames = [
    t('appointments.sunday', 'Chủ Nhật'),
    t('appointments.monday', 'Thứ 2'),
    t('appointments.tuesday', 'Thứ 3'),
    t('appointments.wednesday', 'Thứ 4'),
    t('appointments.thursday', 'Thứ 5'),
    t('appointments.friday', 'Thứ 6'),
    t('appointments.saturday', 'Thứ 7')
  ];
  const dayName = slot.dayOfWeek !== undefined && slot.dayOfWeek !== null 
    ? dayNames[slot.dayOfWeek] 
    : 'Unknown';
  
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

export default function AppointmentRequests({
  requests: propRequests,
  setRequests: propSetRequests,
  showToast,
  setCurrentPage,
}: AppointmentRequestsProps) {
  const { t } = useTranslation('teacher');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [requests, setRequests] = useState<AppointmentRequest[]>(propRequests);
  const [loading, setLoading] = useState(false);

  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTime, setSuggestTime] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Pagination state
  const [requestsPage, setRequestsPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch appointments from API
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      // Only fetch pending appointments from parent
      const response = await fetch('/api/booking/instructor/requests?status=pending&bookerRole=parent', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch appointments:', response.statusText);
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
          status: appt.status || 'pending',
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
      console.error('Error fetching appointments:', error);
      showToast(t('appointments.noRequests'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setRequestsPage(1);
  }, [filterType]);

  const handleRequestAction = (requestId: number, action: 'accept' | 'reject') => {
    if (action === 'reject') {
      setRejectingRequestId(requestId);
      setRejectModalOpen(true);
      return;
    }

    if (action === 'accept') {
      setAcceptingRequestId(requestId);
      setAcceptModalOpen(true);
      return;
    }
  };

  const handleConfirmAccept = async () => {
    if (acceptingRequestId !== null) {
      setIsAccepting(true);
      try {
        const token = getAuthToken();
        const response = await fetch(`/api/booking/${acceptingRequestId}/accept`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to accept appointment');
        }

        // Update local state
        setRequests(
          requests.map((req) =>
            req.id === acceptingRequestId ? { ...req, status: 'accepted' } : req
          )
        );
        
        showToast(t('appointments.acceptSuccess'), 'success');
        setAcceptModalOpen(false);
        setAcceptingRequestId(null);

        // Refresh data
        await fetchAppointments();

        setTimeout(() => {
          setCurrentPage('confirmed');
        }, 1000);
      } catch (error: any) {
        console.error('Error accepting appointment:', error);
        showToast(error.message || t('appointments.acceptError'), 'error');
      } finally {
        setIsAccepting(false);
      }
    }
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setRejectingRequestId(null);
    setRejectReason('');
    setCustomReason('');
    setSuggestDate('');
    setSuggestTime('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason) {
      showToast(t('appointments.selectReason'), 'error');
      return;
    }

    if (rejectReason === 'custom' && !customReason.trim()) {
      showToast(t('appointments.enterReason'), 'error');
      return;
    }

    if (rejectingRequestId !== null) {
      setIsRejecting(true);
      try {
        const reasonMessages: Record<string, string> = {
          schedule_conflict: t('appointments.scheduleConflict'),
          personal_leave: t('appointments.personalLeave'),
          meeting_conflict: t('appointments.meetingConflict'),
          health_issue: t('appointments.healthIssue'),
          reschedule: t('appointments.reschedule'),
          custom: customReason,
        };

        const reasonText = reasonMessages[rejectReason];
        const token = getAuthToken();
        
        const response = await fetch(`/api/booking/${rejectingRequestId}/reject`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            reason: reasonText,
            suggestedDate: suggestDate || undefined,
            suggestedTime: suggestTime || undefined,
            notes: rejectReason === 'reschedule' && suggestDate && suggestTime 
              ? t('appointments.suggestedTimeNote', 'Đề xuất thời gian: {{date}} lúc {{time}}', { date: suggestDate, time: suggestTime })
              : undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to reject appointment');
        }

        // Update local state
        setRequests(
          requests.map((req) =>
            req.id === rejectingRequestId ? { ...req, status: 'rejected' } : req
          )
        );

        showToast(`${t('appointments.rejectSuccess')} ${reasonText}`, 'warning');
        handleCloseRejectModal();

        // Refresh data
        await fetchAppointments();
      } catch (error: any) {
        console.error('Error rejecting appointment:', error);
        showToast(error.message || t('appointments.rejectError'), 'error');
      } finally {
        setIsRejecting(false);
      }
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  // Filter requests - KHÔNG hiển thị requests đã chấp nhận (accepted)
  const filteredRequests = requests.filter((req) => {
    if (req.status === 'accepted') return false;

    if (filterType === 'all') return true;
    if (filterType === 'pending') return req.status === 'pending';
    return req.type === filterType;
  });

  // Pagination logic
  const totalRequestsPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startRequestsIndex = (requestsPage - 1) * itemsPerPage;
  const endRequestsIndex = startRequestsIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startRequestsIndex, endRequestsIndex);

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">⏰ {t('appointments.title')}</h1>
          <p className="text-gray-600">{t('appointments.subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `${t('appointments.all')} (${requests.length})` },
              { id: 'pending', label: `${t('appointments.pending')} (${pendingCount})` },
              {
                id: 'online',
                label: `${t('appointments.online')} (${requests.filter((r) => r.type === 'online').length})`,
              },
              {
                id: 'offline',
                label: `${t('appointments.offline')} (${requests.filter((r) => r.type === 'offline').length})`,
              },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id as FilterType)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterType === filter.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">{t('appointments.loadingRequests')}</p>
              </div>
            </div>
          ) : paginatedRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">{t('appointments.noRequestsFound')}</p>
            </div>
          ) : (
            paginatedRequests.map((request) => {
              if (request.status !== 'pending') return null;

            return (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={request.parentAvatar}
                        alt="Parent"
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{request.parentName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${
                              request.type === 'online' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                          >
                            {request.type === 'online' ? t('appointments.online') : t('appointments.offline')}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${
                              request.status === 'pending'
                                ? 'bg-yellow-500'
                                : request.status === 'accepted'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {request.status === 'pending'
                              ? t('appointments.pending')
                              : request.status === 'accepted'
                              ? t('appointments.accepted')
                              : t('appointments.rejected')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(request.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          <X className="inline w-4 h-4 mr-1" />
                          {t('appointments.reject')}
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          <Check className="inline w-4 h-4 mr-1" />
                          {t('appointments.accept')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <h4 className="font-bold text-blue-900 text-lg">
                      <GraduationCap className="inline w-5 h-5 mr-2" />
                      {t('appointments.parentOf')}: {request.studentName} ({request.studentClass})
                    </h4>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <h4 className="font-bold text-purple-900 mb-1">{t('appointments.desiredTime', 'Thời gian mong muốn')}</h4>
                    <p className="text-xl font-bold text-purple-800">
                      {request.desiredDate} - {request.desiredTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium text-gray-700 mb-1">{t('appointments.meetingReason', 'Lý do gặp mặt')}</h5>
                      <p className="text-gray-800 text-sm">{request.reason}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium text-gray-700 mb-1">{t('appointments.requestTime', 'Thời gian yêu cầu')}</h5>
                      <p className="text-gray-800 text-sm">{request.requestedAt}</p>
                    </div>
                    {request.platform && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">{t('appointments.platform')}</h5>
                        <p className="text-gray-800 text-sm font-medium">{request.platform}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* Pagination Controls */}
        {totalRequestsPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-700">
              {t('appointments.showing', 'Hiển thị')} <span className="font-medium">{startRequestsIndex + 1}</span> {t('appointments.to', 'đến')}{' '}
              <span className="font-medium">
                {Math.min(endRequestsIndex, filteredRequests.length)}
              </span>{' '}
              {t('appointments.outOf', 'trong tổng số')} <span className="font-medium">{filteredRequests.length}</span> {t('appointments.requests', 'yêu cầu')}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestsPage((prev) => Math.max(1, prev - 1))}
                disabled={requestsPage === 1}
              >
                {t('appointments.previous')}
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalRequestsPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={requestsPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestsPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestsPage((prev) => Math.min(totalRequestsPages, prev + 1))}
                disabled={requestsPage === totalRequestsPages}
              >
                {t('appointments.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && acceptingRequestId && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('appointments.confirmAccept', 'Xác nhận chấp nhận lịch hẹn')}</h3>
                  <p className="text-sm text-gray-600">{t('appointments.sureToAccept', 'Bạn có chắc chắn muốn chấp nhận lịch hẹn này?')}</p>
                </div>
              </div>

              {/* Thông tin lịch hẹn */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                {(() => {
                  const request = requests.find((r) => r.id === acceptingRequestId);
                  if (!request) return null;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={request.parentAvatar}
                          alt="Parent"
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900">{request.parentName}</h4>
                          <p className="text-sm text-gray-600">
                            {t('appointments.parentOf')} {request.studentName}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-blue-200 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">{t('appointments.time', 'Thời gian')}</p>
                            <p className="font-medium text-gray-900">
                              {request.desiredDate}
                              <br />
                              {request.desiredTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">{t('appointments.format', 'Hình thức')}</p>
                            <p className="font-medium text-gray-900">
                              {request.type === 'online' ? t('appointments.online') : t('appointments.offline')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-1">{t('appointments.reason')}</p>
                          <p className="text-sm text-gray-800">{request.reason}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">{t('appointments.note', 'Lưu ý')}</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('appointments.acceptWarning', 'Sau khi chấp nhận, phụ huynh sẽ nhận được thông báo xác nhận. Vui lòng đảm bảo bạn có thể tham gia đúng thời gian đã hẹn.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAcceptModalOpen(false);
                    setAcceptingRequestId(null);
                  }}
                  disabled={isAccepting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('appointments.cancel')}
                </button>
                <button
                  onClick={handleConfirmAccept}
                  disabled={isAccepting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('appointments.processing', 'Đang xử lý...')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('appointments.confirmAcceptButton', 'Xác nhận chấp nhận')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-white/5 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <X className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('appointments.rejectAppointment', 'Từ chối lịch hẹn')}</h3>
                  <p className="text-xs text-gray-600">{t('appointments.selectRejectReason')}</p>
                </div>
              </div>

              {/* Lý do có sẵn */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">{t('appointments.rejectReasonLabel', 'Lý do từ chối:')}:</label>
                <div className="space-y-1.5">
                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="schedule_conflict"
                      checked={rejectReason === 'schedule_conflict'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.scheduleConflictTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.scheduleConflictDesc')}</div>
                    </div>
                  </label>

                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="personal_leave"
                      checked={rejectReason === 'personal_leave'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.personalLeaveTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.personalLeaveDesc')}</div>
                    </div>
                  </label>

                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="meeting_conflict"
                      checked={rejectReason === 'meeting_conflict'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.meetingConflictTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.meetingConflictDesc')}</div>
                    </div>
                  </label>

                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="health_issue"
                      checked={rejectReason === 'health_issue'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.healthIssueTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.healthIssueDesc')}</div>
                    </div>
                  </label>

                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="reschedule"
                      checked={rejectReason === 'reschedule'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.rescheduleTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.rescheduleDesc')}</div>
                    </div>
                  </label>

                  <label className="flex items-start px-2.5 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value="custom"
                      checked={rejectReason === 'custom'}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="mr-2 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t('appointments.customReasonTitle')}</div>
                      <div className="text-xs text-gray-600">{t('appointments.customReasonDesc')}</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Lý do tùy chỉnh */}
              {rejectReason === 'custom' && (
                <div className="mb-3">
                  <textarea
                    id="customReason"
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={t('appointments.enterCustomReason')}
                  />
                </div>
              )}

              {/* Gợi ý thời gian khác */}
              {rejectReason === 'reschedule' && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {t('appointments.suggestNewTime')}:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={suggestDate}
                      onChange={(e) => setSuggestDate(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="time"
                      value={suggestTime}
                      onChange={(e) => setSuggestTime(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCloseRejectModal}
                  disabled={isRejecting}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('appointments.cancel')}
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={isRejecting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRejecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t('appointments.processing', 'Đang xử lý...')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('appointments.sendReject', 'Gửi từ chối')}
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
