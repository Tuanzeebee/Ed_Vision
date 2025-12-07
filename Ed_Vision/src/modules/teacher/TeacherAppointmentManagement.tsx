import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Ban,
  Clock,
  Calendar,
  Video,
  MapPin,
  GraduationCap,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  MessageSquare,
  Phone,
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// Types
interface AppointmentData {
  id: number;
  parentName: string;
  parentAvatar: string;
  parentEmail?: string;
  parentPhone?: string;
  studentName: string;
  studentClass: string;
  type: 'online' | 'offline';
  status: 'pending' | 'confirmed' | 'completed' | 'canceled' | 'cancelled' | 'rejected';
  bookerRole: 'student' | 'parent';
  desiredDate: string;
  desiredTime: string;
  reason: string;
  requestedAt: string;
  platform?: string;
  location?: string;
  meetingLink?: string;
  cancelReason?: string;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'canceled' | 'rejected';
type TypeFilter = 'all' | 'online' | 'offline';
type RoleFilter = 'all' | 'student' | 'parent';

interface TeacherAppointmentManagementProps {
  showToast: (message: string, type: string) => void;
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('dev-token') || 
         localStorage.getItem('token') || 
         '';
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper function to get a consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-indigo-500 to-indigo-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-red-400 to-red-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper function to format date in Vietnamese
const formatDateVN = (dateStr: string): string => {
  if (!dateStr) return 'Chưa xác định';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Chưa xác định';
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  } catch {
    return 'Chưa xác định';
  }
};

// Helper function to extract time from ISO string or format time
const extractTime = (isoString: string | undefined): string => {
  if (!isoString) return '';
  // If already in HH:MM format
  if (typeof isoString === 'string' && /^\d{2}:\d{2}$/.test(isoString)) {
    return isoString;
  }
  // Try to extract from ISO string
  const match = isoString.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  // Try to parse as date
  try {
    const date = new Date(isoString);
    if (!isNaN(date.getTime())) {
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch {}
  return '';
};

// Helper function to format date/time from slot data
const formatDateTime = (slot: any, appt: any) => {
  if (!slot && !appt) return { date: 'Chưa xác định', time: 'Chưa xác định' };
  
  // Try to get specific_date from slot.date
  let dateStr = slot?.date?.specific_date || slot?.specificDate || appt?.createdAt || '';
  const formattedDate = formatDateVN(dateStr);
  
  // Get time
  const startTime = extractTime(slot?.start_time_local || slot?.startTime);
  const endTime = extractTime(slot?.end_time_local || slot?.endTime);
  const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa xác định';
  
  return {
    date: formattedDate,
    time: timeStr,
  };
};

export default function TeacherAppointmentManagement({
  showToast,
}: TeacherAppointmentManagementProps) {
  // State
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Pagination
  const [displayCount, setDisplayCount] = useState(6);
  const ITEMS_PER_PAGE = 6;
  
  // Modal states
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      
      // Fetch all appointments (pending, confirmed, etc.) from both student and parent
      const response = await fetch('/api/booking/instructor/requests', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách lịch hẹn');
      }

      const data = await response.json();
      
      // Transform API data
      const transformedData: AppointmentData[] = (Array.isArray(data) ? data : []).map((appt: any) => {
        const { date, time } = formatDateTime(appt.slot, appt);
        
        const formatRequestedAt = (dateStr: any) => {
          if (!dateStr) return '';
          try {
            const d = new Date(dateStr);
            return d.toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
          } catch {
            return '';
          }
        };
        
        return {
          id: appt.appointmentId || appt.id,
          parentName: appt.parentName || appt.studentName || 'Không xác định',
          parentAvatar: appt.parentAvatar || '',
          parentEmail: appt.parentEmail || appt.studentEmail || '',
          parentPhone: appt.parentPhone || appt.studentPhone || '',
          studentName: appt.studentName || 'Không xác định',
          studentClass: appt.studentClass || 'Không xác định',
          type: appt.meetingType === 'online' ? 'online' : 'offline',
          status: appt.status || 'pending',
          bookerRole: appt.bookerRole || 'parent',
          desiredDate: date,
          desiredTime: time,
          reason: appt.reason || appt.meetingPurpose || 'Không có lý do',
          requestedAt: formatRequestedAt(appt.requestedAt || appt.createdAt),
          platform: appt.platform || (appt.meetingType === 'online' ? 'Google Meet' : undefined),
          location: appt.location || appt.meetingLocation || '',
          meetingLink: appt.meetingLink || '',
          cancelReason: appt.cancelReason || '',
        };
      });

      setAppointments(transformedData);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !apt.parentName.toLowerCase().includes(searchLower) &&
          !apt.studentName.toLowerCase().includes(searchLower) &&
          !apt.reason.toLowerCase().includes(searchLower) &&
          !apt.studentClass.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'canceled') {
          // 'canceled' filter should match both 'canceled' and 'cancelled' for backward compatibility
          if (apt.status !== 'canceled' && apt.status !== 'cancelled') {
            return false;
          }
        } else if (apt.status !== statusFilter) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && apt.type !== typeFilter) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'all' && apt.bookerRole !== roleFilter) {
        return false;
      }

      return true;
    });
  }, [appointments, searchQuery, statusFilter, typeFilter, roleFilter]);

  // Displayed appointments
  const displayedAppointments = useMemo(() => {
    return filteredAppointments.slice(0, displayCount);
  }, [filteredAppointments, displayCount]);

  const hasMore = displayCount < filteredAppointments.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(6);
  }, [searchQuery, statusFilter, typeFilter, roleFilter]);

  // Action handlers
  const handleAccept = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setAcceptModalOpen(true);
  };

  const handleReject = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleCancel = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedAppointment) return;
    setIsProcessing(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/booking/${selectedAppointment.id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Không thể chấp nhận lịch hẹn');
      }

      showToast('Đã chấp nhận lịch hẹn thành công!', 'success');
      setAcceptModalOpen(false);
      setSelectedAppointment(null);
      await fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Không thể chấp nhận lịch hẹn', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedAppointment || !rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/booking/${selectedAppointment.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        throw new Error('Không thể từ chối lịch hẹn');
      }

      showToast('Đã từ chối lịch hẹn!', 'warning');
      setRejectModalOpen(false);
      setSelectedAppointment(null);
      setRejectReason('');
      await fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Không thể từ chối lịch hẹn', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const token = getAuthToken();
      // Sử dụng reject API thay vì delete để sinh viên không thể đặt lại
      const response = await fetch(`/api/booking/${selectedAppointment.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) {
        throw new Error('Không thể từ chối lịch hẹn');
      }

      showToast('Đã từ chối lịch hẹn!', 'warning');
      setCancelModalOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
      await fetchAppointments();
    } catch (err: any) {
      showToast(err.message || 'Không thể từ chối lịch hẹn', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Đã xác nhận', icon: CheckCircle };
      case 'pending':
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Chờ xác nhận', icon: Clock };
      case 'completed':
        return { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Hoàn thành', icon: CheckCircle };
      case 'canceled':
      case 'cancelled':
        return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Đã hủy', icon: XCircle };
      case 'rejected':
        return { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Đã từ chối', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: status, icon: AlertTriangle };
    }
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: AppointmentData) => {
    const isOnline = appointment.type === 'online';
    const isPending = appointment.status === 'pending';
    const isConfirmed = appointment.status === 'confirmed';
    const isCompleted = appointment.status === 'completed';
    const isCanceled = appointment.status === 'canceled' || appointment.status === 'cancelled' || appointment.status === 'rejected';
    
    const initials = getInitials(appointment.parentName);
    const avatarColor = getAvatarColor(appointment.parentName);
    const statusBadge = getStatusBadge(appointment.status);
    const StatusIcon = statusBadge.icon;

    // Theme colors based on status and meeting type
    let cardBg = 'bg-white';
    let borderColor = 'border-gray-200';
    let headerBg = 'bg-gradient-to-r from-gray-50 to-gray-100';

    if (isCanceled || isCompleted) {
      cardBg = 'bg-gray-50';
      borderColor = 'border-gray-200';
    } else if (isConfirmed && isOnline) {
      cardBg = 'bg-green-50';
      borderColor = 'border-green-200';
      headerBg = 'bg-gradient-to-r from-green-50 to-green-100';
    } else if (isConfirmed && !isOnline) {
      cardBg = 'bg-orange-50';
      borderColor = 'border-orange-200';
      headerBg = 'bg-gradient-to-r from-orange-50 to-orange-100';
    } else if (isPending) {
      cardBg = 'bg-amber-50';
      borderColor = 'border-amber-200';
      headerBg = 'bg-gradient-to-r from-amber-50 to-amber-100';
    }

    return (
      <div 
        key={appointment.id} 
        className={`${cardBg} rounded-xl shadow-sm border-2 ${borderColor} overflow-hidden hover:shadow-md transition-all duration-200`}
      >
        {/* Header */}
        <div className={`px-4 py-3 ${headerBg} border-b ${borderColor} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {appointment.parentAvatar ? (
              <img 
                src={appointment.parentAvatar} 
                alt={appointment.parentName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-sm`}>
                {initials}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{appointment.parentName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isOnline ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {isOnline ? 'Online' : 'Trực tiếp'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  appointment.bookerRole === 'student' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                }`}>
                  {appointment.bookerRole === 'student' ? 'Sinh viên' : 'Phụ huynh'}
                </span>
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 ${statusBadge.bg} ${statusBadge.text} text-xs font-medium rounded-full flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusBadge.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5">
          {/* Student Info */}
          <div className="flex items-start gap-2.5">
            <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium text-sm">{appointment.studentName}</p>
              <p className="text-xs text-gray-500">{appointment.studentClass}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-900 font-medium text-sm">{appointment.desiredDate}</p>
              <p className="text-xs text-gray-500">{appointment.desiredTime}</p>
            </div>
          </div>

          {/* Meeting Purpose */}
          {appointment.reason && (
            <div className="flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-600 line-clamp-2">{appointment.reason}</p>
            </div>
          )}

          {/* Meeting Link (Online) */}
          {isOnline && isConfirmed && (
            <div className="flex items-start gap-2.5">
              <Video className="w-4 h-4 text-gray-400 mt-0.5" />
              {appointment.meetingLink ? (
                <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                  {appointment.meetingLink}
                </a>
              ) : (
                <span className="text-xs text-gray-500">(Chờ thêm link)</span>
              )}
            </div>
          )}

          {/* Location (Offline) */}
          {!isOnline && isConfirmed && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              {appointment.location ? (
                <p className="text-xs text-gray-600">{appointment.location}</p>
              ) : (
                <span className="text-xs text-gray-500">(Chờ thêm địa điểm)</span>
              )}
            </div>
          )}

          {/* Contact Info */}
          {(appointment.parentEmail || appointment.parentPhone) && (
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100 space-y-1">
              {appointment.parentEmail && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="w-3 h-3 text-blue-500" />
                  <span>{appointment.parentEmail}</span>
                </div>
              )}
              {appointment.parentPhone && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3 h-3 text-blue-500" />
                  <span>{appointment.parentPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Requested At */}
          <div className="text-xs text-gray-400 pt-1">
            Yêu cầu lúc: {appointment.requestedAt}
          </div>

          {/* Cancel Reason */}
          {isCanceled && appointment.cancelReason && (
            <div className="bg-red-50 rounded-lg p-2.5 border border-red-100">
              <p className="text-xs text-red-500">
                Lý do: {appointment.cancelReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
          {isPending && (
            <>
              <button 
                onClick={() => handleAccept(appointment)}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 text-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Chấp nhận
              </button>
              <button 
                onClick={() => handleReject(appointment)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 text-sm cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                Từ chối
              </button>
            </>
          )}
          
          {isConfirmed && (
            <>
              {isOnline && appointment.meetingLink && (
                <a 
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
                >
                  <Video className="w-4 h-4" />
                  Tham gia
                </a>
              )}
              <button 
                onClick={() => handleCancel(appointment)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 text-sm cursor-pointer"
                title="Từ chối lịch hẹn"
              >
                <Ban className="w-4 h-4" />
                Từ chối lịch hẹn
              </button>
            </>
          )}

          {isCompleted && (
            <div className="w-full text-center py-2 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Đã hoàn thành
            </div>
          )}

          {isCanceled && (
            <div className={`w-full text-center py-2 text-sm font-medium ${appointment.status === 'rejected' ? 'text-gray-600' : 'text-red-500'}`}>
              <Ban className="w-4 h-4 inline mr-1" />
              {appointment.status === 'rejected' ? 'Đã từ chối' : 'Đã hủy'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Statistics
  const stats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    canceled: appointments.filter(a => a.status === 'canceled' || a.status === 'cancelled' || a.status === 'rejected').length,
  }), [appointments]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📅 Quản Lý Lịch Hẹn</h1>
            <p className="text-sm text-gray-500 mt-1">Xem và quản lý các yêu cầu gặp mặt từ sinh viên và phụ huynh</p>
          </div>
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Tổng số</div>
        </div>
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-sm text-amber-600">Chờ xử lý</div>
        </div>
        <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.confirmed}</div>
          <div className="text-sm text-emerald-600">Đã xác nhận</div>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-sm text-blue-600">Hoàn thành</div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-500">{stats.canceled}</div>
          <div className="text-sm text-red-500">Đã hủy</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên, lớp, lý do..." 
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="canceled">Đã hủy</option>
              <option value="rejected">Đã từ chối</option>
            </select>
            
            <select 
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            >
              <option value="all">Tất cả loại</option>
              <option value="online">Online</option>
              <option value="offline">Trực tiếp</option>
            </select>

            <select 
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="all">Tất cả nguồn</option>
              <option value="student">Sinh viên</option>
              <option value="parent">Phụ huynh</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 border border-gray-200 rounded-xl p-0.5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Đang tải danh sách lịch hẹn...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={fetchAppointments} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && filteredAppointments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <div className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || roleFilter !== 'all'
              ? 'Không tìm thấy lịch hẹn phù hợp với bộ lọc'
              : 'Chưa có yêu cầu lịch hẹn nào'}
          </div>
        </div>
      )}

      {!loading && !error && filteredAppointments.length > 0 && (
        <>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
            : 'flex flex-col gap-4'
          }>
            {displayedAppointments.map(renderAppointmentCard)}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-sm"
              >
                <ChevronDown className="w-4 h-4" />
                Xem thêm ({filteredAppointments.length - displayCount} còn lại)
              </button>
            </div>
          )}
          
          {/* Showing count */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Đang hiển thị {displayedAppointments.length} / {filteredAppointments.length} lịch hẹn
          </div>
        </>
      )}

      {/* Accept Confirmation Modal */}
      {acceptModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận chấp nhận</h3>
                <p className="text-sm text-gray-500">Bạn có chắc chắn muốn chấp nhận lịch hẹn này?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Người đặt:</span> {selectedAppointment.parentName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Sinh viên:</span> {selectedAppointment.studentName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Thời gian:</span> {selectedAppointment.desiredDate} - {selectedAppointment.desiredTime}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setAcceptModalOpen(false); setSelectedAppointment(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isProcessing}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Chấp nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Từ chối lịch hẹn</h3>
                <p className="text-sm text-gray-500">Vui lòng nhập lý do từ chối</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white text-gray-900 placeholder-gray-400"
                rows={3}
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModalOpen(false); setSelectedAppointment(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isProcessing}
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Từ chối
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Từ chối lịch hẹn</h3>
                <p className="text-sm text-gray-500">Hành động này sẽ thông báo cho người đặt</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white text-gray-900 placeholder-gray-400"
                rows={3}
                placeholder="Nhập lý do từ chối lịch hẹn..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModalOpen(false); setSelectedAppointment(null); setCancelReason(''); }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={isProcessing}
              >
                Quay lại
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Xác nhận từ chối
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
