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

interface ConfirmedAppointmentsProps {
  requests: AppointmentRequest[];
  setRequests: (requests: AppointmentRequest[]) => void;
  showToast: (message: string, type: string) => void;
}

export default function ConfirmedAppointments({
  requests,
  setRequests,
  showToast,
}: ConfirmedAppointmentsProps) {
  // Cancel confirmed appointment modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Confirmed page filter and sort state
  const [confirmedClassFilter, setConfirmedClassFilter] = useState<string>('all');
  const [confirmedSortBy, setConfirmedSortBy] = useState<'nearest' | 'latest'>('nearest');

  // Pagination state
  const [confirmedPage, setConfirmedPage] = useState(1);
  const itemsPerPage = 5;

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

  const handleConfirmCancel = () => {
    if (!cancelReason) {
      showToast('Vui lòng chọn lý do hủy lịch hẹn!', 'error');
      return;
    }

    if (cancelReason === 'custom' && !customCancelReason.trim()) {
      showToast('Vui lòng nhập lý do cụ thể!', 'error');
      return;
    }

    if (cancelingRequestId !== null) {
      setRequests(requests.filter((req) => req.id !== cancelingRequestId));

      const reasonMessages: Record<string, string> = {
        schedule_conflict: 'Có lịch đột xuất',
        personal_leave: 'Nghỉ phép',
        meeting_conflict: 'Có cuộc họp quan trọng',
        health_issue: 'Vấn đề sức khỏe',
        time_error: 'Nhầm lẫn thời gian',
        custom: customCancelReason,
      };

      const reasonText = reasonMessages[cancelReason];
      showToast(`Đã hủy lịch hẹn. Lý do: ${reasonText}. Phụ huynh đã được thông báo.`, 'warning');

      handleCloseCancelModal();
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">✅ Lịch hẹn đã xác nhận</h1>
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
                >
                  <option value="all">Tất cả lớp ({confirmedRequests.length})</option>
                  {uniqueClasses.map((className) => (
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

        {confirmedRequests.length === 0 ? (
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
                          {request.type === 'online' ? '🌐 Trực tuyến' : '🏫 Trực tiếp'}
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
                        <span>📅 {request.desiredDate}</span>
                        <span>•</span>
                        <span>⏰ {request.desiredTime}</span>
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
