import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { BookingApiService, type Appointment } from "@/services/api/booking.api";
import Header from "../../components/layout/Header"
import { useToast } from '@/lib/useToast'
import { ToastContainer } from '@/components/ui/Toast'
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

type Props = {
  // Add any props here if needed
}

interface User {
  id: string;
  role: string;
  name: string;
  email: string;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'canceled' | 'rejected';
type TimeFilter = 'all' | 'upcoming' | 'past' | 'this_week' | 'this_month';

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
  const date = new Date(dateStr);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
};

// Helper function to get time period label
const getTimePeriod = (timeStr: string): string => {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 12) return 'Sáng';
  if (hour < 18) return 'Chiều';
  return 'Tối';
};

// Helper function to extract time from ISO string
const extractTime = (isoString: string | undefined): string => {
  if (!isoString) return '';
  const match = isoString.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

export default function AllAppointments({}: Props) {
  const navigate = useNavigate();
  const { toasts, error: showErrorToast, success: showSuccessToast, hideToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and UI state
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Pagination - show 6 items initially, load more on demand
  const [displayCount, setDisplayCount] = useState(6);
  const ITEMS_PER_PAGE = 6;

  // Real-time notification socket
  const { newNotification } = useNotificationSocket();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      console.log('Current user:', parsedUser);
    }

    // Load appointments from API
    loadAppointments();
  }, []);

  // Listen for appointment status change notifications
  useEffect(() => {
    if (newNotification) {
      console.log('📬 [AllAppointments] Received notification:', newNotification);
      
      // Reload appointments if notification is about appointment status change
      if (newNotification.type === 'appointment_confirmed' || 
          newNotification.type === 'appointment_rejected' ||
          newNotification.type === 'appointment_canceled') {
        console.log('🔄 [AllAppointments] Reloading appointments due to status change');
        loadAppointments();
      }
    }
  }, [newNotification]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await BookingApiService.getAppointments();
      console.log('Loaded appointments:', data);
      // Auto-complete is now handled by backend cron job (every 5 minutes)
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate time ranges for better performance
  const timeRanges = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      now,
      startOfWeek,
      endOfWeek,
      startOfMonth,
      endOfMonth
    };
  }, []); // Recalculate only when component mounts or when we want to refresh

  // Filter appointments based on search and filters
  const filteredAppointments = useMemo(() => {
    const result = appointments.filter(apt => {
      // Filter by current user as booker
      if (user) {
        const userId = parseInt(user.id);
        if (!isNaN(userId) && apt.booker_account_id !== userId) {
          console.log(`Filtering out appointment ${apt.appointment_id}: booker_account_id ${apt.booker_account_id} !== user.id ${userId}`);
          return false;
        }
      }

      // Search filter
      if (debouncedSearchQuery) {
        const instructorName = apt.instructor?.account?.profile?.full_name || '';
        const purpose = apt.meeting_purpose || '';
        const searchLower = debouncedSearchQuery.toLowerCase();
        if (!instructorName.toLowerCase().includes(searchLower) && 
            !purpose.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (apt.status !== statusFilter) {
          return false;
        }
      }

      // Time filter
      if (timeFilter !== 'all') {
        const aptDate = new Date(apt.slot?.date?.specific_date || apt.created_at);

        switch (timeFilter) {
          case 'upcoming':
            if (aptDate < timeRanges.now) return false;
            break;
          case 'past':
            if (aptDate >= timeRanges.now) return false;
            break;
          case 'this_week':
            if (aptDate < timeRanges.startOfWeek || aptDate > timeRanges.endOfWeek) return false;
            break;
          case 'this_month':
            if (aptDate < timeRanges.startOfMonth || aptDate > timeRanges.endOfMonth) return false;
            break;
        }
      }

      return true;
    });
    
    console.log(`Filtered ${result.length} out of ${appointments.length} appointments`);
    return result;
  }, [appointments, user, debouncedSearchQuery, statusFilter, timeFilter, timeRanges]);

  // Get only the appointments to display (pagination)
  const displayedAppointments = useMemo(() => {
    return filteredAppointments.slice(0, displayCount);
  }, [filteredAppointments, displayCount]);

  // Check if there are more appointments to load
  const hasMore = displayCount < filteredAppointments.length;

  // Load more appointments
  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(6);
  }, [debouncedSearchQuery, statusFilter, timeFilter]);

  const openDeleteModal = (appointment: Appointment) => {
    console.log('Opening delete modal for appointment:', appointment.appointment_id);
    setSelectedAppointment(appointment);
    setCancelReason('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const confirmDelete = async () => {
    if (!selectedAppointment) return;

    // Validate that cancel reason is provided
    if (!cancelReason.trim()) {
      showErrorToast('Vui lòng nhập lý do hủy lịch hẹn.');
      return;
    }

    try {
      await BookingApiService.cancelAppointment(selectedAppointment.appointment_id, cancelReason.trim());
      await loadAppointments();
      closeDeleteModal();
      showSuccessToast('Đã hủy lịch hẹn thành công.');
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      showErrorToast('Không thể hủy lịch hẹn. Vui lòng thử lại.');
    }
  };

  const markAsCompleted = async (appointment: Appointment) => {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu buổi học này là đã hoàn thành?')) return;

    try {
      await BookingApiService.updateAppointmentStatus(appointment.appointment_id, 'completed');
      await loadAppointments();
    } catch (err) {
      console.error('Failed to mark appointment as completed:', err);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const restoreCanceledAppointment = async (appointment: Appointment) => {
    try {
      // Determine new status based on booker role
      const newStatus = appointment.booker_role === 'student' ? 'confirmed' : 'pending';
      await BookingApiService.updateAppointmentStatus(appointment.appointment_id, newStatus);
      await loadAppointments();
    } catch (err) {
      console.error('Failed to restore canceled appointment:', err);
      alert('Không thể khôi phục lịch hẹn. Vui lòng thử lại.');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Đã xác nhận' };
      case 'pending':
        return { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Chờ xác nhận' };
      case 'completed':
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Hoàn thành' };
      case 'canceled':
      case 'cancelled':
        return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Đã hủy' };
      case 'rejected':
        return { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Bị từ chối' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
    }
  };

  // Check if appointment is past
  const isPastAppointment = (appointment: Appointment) => {
    const aptDate = new Date(appointment.slot?.date?.specific_date || appointment.created_at);
    return aptDate < new Date() || appointment.status === 'completed' || appointment.status === 'canceled' || appointment.status === 'cancelled' || appointment.status === 'rejected';
  };

  // Check if appointment is past but not completed (for showing complete button)
  const isPastButNotCompleted = (appointment: Appointment) => {
    const aptDate = new Date(appointment.slot?.date?.specific_date || appointment.created_at);
    const endTime = appointment.slot?.end_time_local;
    if (endTime) {
      // Parse end time and add to date
      const [hours, minutes] = endTime.split(':').map(Number);
      aptDate.setHours(hours, minutes, 0, 0);
    }
    return aptDate < new Date() && appointment.status === 'confirmed';
  };

  // Render appointment card with new design
  const renderAppointmentCard = (appointment: Appointment) => {
    const isOnline = appointment.meeting_type === 'online';
    const isPast = isPastAppointment(appointment);
    const instructorName = appointment.instructor?.account?.profile?.full_name || 'Giảng viên';
    const initials = getInitials(instructorName);
    const avatarColor = getAvatarColor(instructorName);
    const statusBadge = getStatusBadge(appointment.status);
    
    // Date and time formatting
    const appointmentDate = appointment.slot?.date?.specific_date || appointment.created_at;
    const dateFormatted = formatDateVN(appointmentDate);
    const startTime = extractTime(appointment.slot?.start_time_local);
    const endTime = extractTime(appointment.slot?.end_time_local);
    const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa xác định';
    const timePeriod = startTime ? getTimePeriod(startTime) : '';

    // Theme colors based on status and meeting type
    let cardBg = 'bg-white';
    let borderColor = 'border-gray-200';
    let headerBg = 'bg-gradient-to-r from-gray-50 to-gray-100';
    let headerBorder = 'border-gray-200';
    let footerBg = 'bg-gray-50';
    let typeIconColor = 'text-gray-400';
    let typeTextColor = 'text-gray-500';

    if (appointment.status === 'canceled' || appointment.status === 'cancelled' || appointment.status === 'completed') {
      // Gray background for canceled and completed
      cardBg = 'bg-gray-50';
      borderColor = 'border-gray-200';
      headerBg = 'bg-gradient-to-r from-gray-50 to-gray-100';
      headerBorder = 'border-gray-200';
      footerBg = 'bg-gray-50';
      typeIconColor = 'text-gray-400';
      typeTextColor = 'text-gray-500';
    } else if (appointment.status === 'confirmed' && isOnline) {
      // Light green background for confirmed online
      cardBg = 'bg-green-50';
      borderColor = 'border-green-200';
      headerBg = 'bg-gradient-to-r from-green-50 to-green-100';
      headerBorder = 'border-green-200';
      footerBg = 'bg-green-50';
      typeIconColor = 'text-green-600';
      typeTextColor = 'text-green-700';
    } else if (appointment.status === 'confirmed' && !isOnline) {
      // Light orange background for confirmed offline
      cardBg = 'bg-orange-50';
      borderColor = 'border-orange-200';
      headerBg = 'bg-gradient-to-r from-orange-50 to-orange-100';
      headerBorder = 'border-orange-200';
      footerBg = 'bg-orange-50';
      typeIconColor = 'text-orange-600';
      typeTextColor = 'text-orange-700';
    } else if (appointment.status === 'pending') {
      // Default colors for pending
      cardBg = 'bg-white';
      borderColor = 'border-gray-200';
      headerBg = 'bg-gradient-to-r from-gray-50 to-gray-100';
      headerBorder = 'border-gray-200';
      footerBg = 'bg-gray-50';
      typeIconColor = 'text-gray-400';
      typeTextColor = 'text-gray-500';
    }

    return (
      <div 
        key={appointment.appointment_id} 
        className={`${cardBg} rounded-xl shadow-sm border-2 ${borderColor} overflow-hidden hover:shadow-md transition-shadow ${isPast ? 'opacity-90' : ''}`}
      >
        {/* Header */}
        <div className={`px-4 py-3 ${headerBg} border-b ${headerBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isPast ? 'from-gray-400 to-gray-500' : avatarColor} flex items-center justify-center text-white font-semibold text-sm`}>
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{instructorName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <i className={`fas fa-video ${typeIconColor} text-xs`}></i>
                    <span className={`text-xs ${typeTextColor} font-medium`}>Trực tuyến</span>
                  </>
                ) : (
                  <>
                    <i className={`fas fa-location-dot ${typeIconColor} text-xs`}></i>
                    <span className={`text-xs ${typeTextColor} font-medium`}>Trực tiếp</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 ${statusBadge.bg} ${statusBadge.text} text-xs font-medium rounded-full`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5">
          {/* Date & Time */}
          <div className="flex items-start gap-2.5">
            <i className="fas fa-calendar-day text-gray-400 text-sm mt-0.5"></i>
            <div>
              <p className="text-gray-900 font-medium text-sm">{dateFormatted}</p>
              <p className="text-xs text-gray-500">{timeStr} ({timePeriod})</p>
            </div>
          </div>

          {/* Meeting Purpose */}
          {appointment.meeting_purpose && (
            <div className="flex items-start gap-2.5">
              <i className="fas fa-comment-dots text-gray-400 text-sm mt-0.5"></i>
              <p className="text-xs text-gray-600">{appointment.meeting_purpose}</p>
            </div>
          )}

          {/* Meeting Link (Online) */}
          {isOnline && appointment.status !== 'canceled' && appointment.status !== 'cancelled' && (
            <div className="flex items-start gap-2.5">
              <i className="fas fa-link text-gray-400 text-sm mt-0.5"></i>
              {appointment.slot?.meeting_link ? (
                <a href={appointment.slot.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                  {appointment.slot.meeting_link}
                </a>
              ) : (
                <span className="text-xs text-gray-500">(Chờ cố vấn thêm link)</span>
              )}
            </div>
          )}

          {/* Meeting Location (Offline) */}
          {!isOnline && appointment.status !== 'canceled' && appointment.status !== 'cancelled' && (
            <div className="flex items-start gap-2.5">
              <i className="fas fa-map-marker-alt text-gray-400 text-sm mt-0.5"></i>
              {appointment.slot?.meeting_location ? (
                <p className="text-xs text-gray-600">{appointment.slot.meeting_location}</p>
              ) : (
                <span className="text-xs text-gray-500">(Chờ cố vấn thêm vị trí)</span>
              )}
            </div>
          )}

          {/* Parent Contact Info */}
          {appointment.appointmentContact && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-medium text-gray-700 mb-1.5">Đặt bởi phụ huynh</p>
              <div className="space-y-0.5">
                {appointment.appointmentContact.contact_name && (
                  <p className="text-xs text-gray-600">
                    <i className="fas fa-user text-gray-400 w-3.5"></i> {appointment.appointmentContact.contact_name}
                    {appointment.appointmentContact.relationship_to_student && ` (${appointment.appointmentContact.relationship_to_student})`}
                  </p>
                )}
                {appointment.appointmentContact.contact_phone && (
                  <p className="text-xs text-gray-600">
                    <i className="fas fa-phone text-gray-400 w-3.5"></i> {appointment.appointmentContact.contact_phone}
                  </p>
                )}
                {appointment.appointmentContact.contact_email && (
                  <p className="text-xs text-gray-600">
                    <i className="fas fa-envelope text-gray-400 w-3.5"></i> {appointment.appointmentContact.contact_email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Completed status */}
          {appointment.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <i className="fas fa-check-circle"></i>
              <span>Buổi họp đã hoàn thành</span>
            </div>
          )}

          {/* Canceled info */}
          {appointment.status === 'canceled' || appointment.status === 'cancelled' ? (
            <div className="bg-red-50 rounded-lg p-2.5 border border-red-100">
              <p className="text-xs text-red-500">
                Đã hủy {appointment.canceled_at ? `vào ${new Date(appointment.canceled_at).toLocaleDateString('vi-VN')}` : ''}
              </p>
              {appointment.cancel_reason && (
                <p className="text-xs text-red-400 mt-1">Lý do: {appointment.cancel_reason}</p>
              )}
            </div>
          ) : null}

          {/* Rejected info */}
          {appointment.status === 'rejected' ? (
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
              <p className="text-xs text-gray-600">
                Đã bị từ chối {appointment.canceled_at ? `vào ${new Date(appointment.canceled_at).toLocaleDateString('vi-VN')}` : ''}
              </p>
              {appointment.cancel_reason && (
                <p className="text-xs text-gray-500 mt-1">Lý do: {appointment.cancel_reason}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer with Actions */}
        <div className={`px-4 py-3 ${footerBg} flex gap-2`}>
          {appointment.status === 'confirmed' && isOnline && (
            <>
              <button 
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-sm cursor-pointer"
                onClick={() => {
                  if (appointment.slot?.meeting_link) {
                    window.open(appointment.slot.meeting_link, '_blank');
                  }
                }}
              >
                <i className="fas fa-play text-xs"></i>
                <span>Tham gia</span>
              </button>
              {isPastButNotCompleted(appointment) && (
                <button 
                  onClick={() => markAsCompleted(appointment)} 
                  className="px-3 py-2 border border-green-200 rounded-lg text-green-600 hover:bg-green-50 transition-colors text-sm cursor-pointer"
                  title="Đánh dấu hoàn thành"
                >
                  <i className="fas fa-check text-xs"></i>
                </button>
              )}
              <button 
                onClick={() => openDeleteModal(appointment)} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm cursor-pointer"
                title="Hủy lịch"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </>
          )}
          
          {appointment.status === 'confirmed' && !isOnline && (
            <>
              <button className="flex-1 bg-gray-300 text-gray-600 px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-sm">
                <i className="fas fa-map-marker-alt text-xs"></i>
                <span>Gặp trực tiếp</span>
              </button>
              {isPastButNotCompleted(appointment) && (
                <button 
                  onClick={() => markAsCompleted(appointment)} 
                  className="px-3 py-2 border border-green-200 rounded-lg text-green-600 hover:bg-green-50 transition-colors text-sm cursor-pointer"
                  title="Đánh dấu hoàn thành"
                >
                  <i className="fas fa-check text-xs"></i>
                </button>
              )}
              <button 
                onClick={() => openDeleteModal(appointment)} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm cursor-pointer"
                title="Hủy lịch"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </>
          )}

          {appointment.status === 'pending' && (
            <>
              <button className="flex-1 bg-gray-300 text-gray-500 px-3 py-2 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-1.5 text-sm">
                <i className="fas fa-clock text-xs"></i>
                <span>Đang chờ</span>
              </button>
              <button 
                onClick={() => openDeleteModal(appointment)} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm cursor-pointer"
                title="Hủy lịch"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </>
          )}

          {appointment.status === 'completed' && (
            <button className="w-full bg-gray-200 text-gray-500 px-3 py-2 rounded-lg font-medium cursor-not-allowed text-sm">
              Đã kết thúc
            </button>
          )}

          {appointment.status === 'canceled' || appointment.status === 'cancelled' ? (
            (() => {
              // Check if the slot time has already passed
              const slotDate = appointment.slot?.date?.specific_date;
              const slotStartTime = appointment.slot?.start_time_local;
              
              let isPast = false;
              if (slotDate && slotStartTime) {
                try {
                  // Parse date and time to create full datetime
                  const dateObj = new Date(slotDate);
                  const year = dateObj.getFullYear();
                  const month = dateObj.getMonth();
                  const day = dateObj.getDate();
                  
                  // Parse time (HH:MM format)
                  const timeObj = new Date(slotStartTime);
                  const hours = timeObj.getUTCHours();
                  const minutes = timeObj.getUTCMinutes();
                  
                  // Create slot start datetime
                  const slotStartDateTime = new Date(year, month, day, hours, minutes, 0, 0);
                  const now = new Date();
                  
                  isPast = slotStartDateTime <= now;
                } catch (error) {
                  // Fallback to date-only check if parsing fails
                  const aptDate = new Date(appointment.slot?.date?.specific_date || appointment.created_at);
                  isPast = aptDate < new Date();
                }
              } else {
                // Fallback if slot info is missing
                const aptDate = new Date(appointment.slot?.date?.specific_date || appointment.created_at);
                isPast = aptDate < new Date();
              }
              
              return (
                <button 
                  className={`w-full px-3 py-2 rounded-lg font-medium text-sm ${
                    isPast 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer'
                  }`}
                  onClick={isPast ? undefined : () => restoreCanceledAppointment(appointment)}
                  disabled={isPast}
                >
                  {isPast ? 'Quá thời gian đặt lại' : 'Đặt lại lịch'}
                </button>
              );
            })()
          ) : null}

          {appointment.status === 'rejected' && (
            <button className="w-full bg-gray-200 text-gray-500 px-3 py-2 rounded-lg font-medium cursor-not-allowed text-sm">
              Đã bị từ chối
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen w-full font-sans antialiased">
      {/* Header Section */}
      <Header />
      
      {/* Page Title Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lịch Hẹn Của Tôi</h1>
              <p className="text-xs text-gray-500 mt-0.5">Quản lý các buổi gặp gỡ cố vấn</p>
            </div>
            <button 
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
              onClick={() => navigate('/booking/scheduler')}
            >
              <i className="fas fa-plus"></i>
              <span>Đặt Lịch Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tên giảng viên hoặc mục đích..." 
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select 
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value as StatusFilter;
                  startTransition(() => {
                    setStatusFilter(value);
                  });
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Hoàn thành</option>
                <option value="canceled">Đã hủy</option>
                <option value="rejected">Đã từ chối</option>
              </select>
              
              <select 
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                value={timeFilter}
                onChange={(e) => {
                  const value = e.target.value as TimeFilter;
                  startTransition(() => {
                    setTimeFilter(value);
                  });
                }}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="upcoming">Sắp tới</option>
                <option value="past">Đã qua</option>
                <option value="this_week">Tuần này</option>
                <option value="this_month">Tháng này</option>
              </select>
              
              <div className="flex gap-1 border border-gray-200 rounded-xl p-0.5">
                <button 
                  className={`px-3 py-2 rounded-lg text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th"></i>
                </button>
                <button 
                  className={`px-3 py-2 rounded-lg text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {(loading || isPending) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">{isPending ? 'Đang lọc dữ liệu...' : 'Đang tải danh sách lịch hẹn...'}</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={loadAppointments} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !isPending && !error && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="fas fa-calendar-xmark"></i>
            </div>
            <div className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' || timeFilter !== 'all' 
                ? 'Không tìm thấy lịch hẹn phù hợp với bộ lọc'
                : 'Bạn chưa có lịch hẹn nào'}
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
              onClick={() => navigate('/booking/scheduler')}
            >
              Đặt lịch hẹn đầu tiên
            </button>
          </div>
        )}

        {!loading && !isPending && !error && filteredAppointments.length > 0 && (
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
                  <i className="fas fa-chevron-down"></i>
                  <span>Xem thêm ({filteredAppointments.length - displayCount} lịch hẹn còn lại)</span>
                </button>
              </div>
            )}
            
            {/* Showing count */}
            <div className="text-center mt-4 text-sm text-gray-500">
              Đang hiển thị {displayedAppointments.length} / {filteredAppointments.length} lịch hẹn
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận hủy lịch hẹn
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Bạn có chắc chắn muốn hủy lịch hẹn với{' '}
                <span className="font-semibold text-gray-900">
                  {selectedAppointment?.instructor?.account?.profile?.full_name || 'Giảng viên'}
                </span>?
              </p>
              <p className="text-sm text-gray-500">
                Hành động này không thể hoàn tác.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do hủy <span className="text-red-500">*</span> (bắt buộc)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-100 text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Nhập lý do hủy lịch hẹn..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  );
}