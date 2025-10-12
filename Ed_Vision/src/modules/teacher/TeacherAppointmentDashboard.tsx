import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  ChevronDown,
  BarChart3,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle,
  Settings,
  Plus,
  X,
  Check,
} from 'lucide-react';
import type { AvailableDate, AppointmentRequest, FilterType } from './types/appointment.types';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  formatDate,
  getTodayString,
  getMaxDateString,
  getDateString,
  calculateEndTime,
  isTimeSlotOverlapping,
} from './utils/appointmentUtils';
import { Card, CardContent } from '@/components/ui/teacher/teacher_card';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Input } from '@/components/ui/teacher/teacher_input';

type Page = 'schedule' | 'requests' | 'confirmed';

export default function TeacherAppointmentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('schedule');
  const [appointmentDropdownOpen, setAppointmentDropdownOpen] = useState(true);
  
  // Appointment schedule state
  const [availableDates, setAvailableDates] = useLocalStorage<AvailableDate[]>(
    'availableDates',
    []
  );
  const [selectedDate, setSelectedDate] = useState('');
  
  // Time modal state
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [currentDateForTime, setCurrentDateForTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [endTime, setEndTime] = useState('');
  
  // Request state
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [requests, setRequests] = useState<AppointmentRequest[]>([
    {
      id: 1,
      parentName: 'Bà Nguyễn Thị Lan',
      parentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      studentName: 'Nguyễn Văn Nam',
      studentClass: 'Lớp K28 CMU TPM 1',
      type: 'offline',
      status: 'pending',
      desiredDate: 'Thứ 3, 15/01/2024',
      desiredTime: '14:00-15:00',
      reason: 'Trao đổi về tình hình học tập và hành vi của con',
      requestedAt: '10:30 - 14/01/2024',
    },
    {
      id: 2,
      parentName: 'Ông Trần Văn Minh',
      parentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      studentName: 'Trần Thị Mai',
      studentClass: 'Lớp K29 CMU TPM 2',
      type: 'online',
      status: 'pending',
      desiredDate: 'Thứ 4, 16/01/2024',
      desiredTime: '16:00-17:00',
      reason: 'Tư vấn hướng nghiệp và lựa chọn chuyên ngành',
      requestedAt: '09:15 - 14/01/2024',
      platform: 'Google Meet',
    },
    {
      id: 3,
      parentName: 'Bà Lê Thị Hoa',
      parentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      studentName: 'Lê Văn Đức',
      studentClass: 'Lớp K30 CMU TPM 3',
      type: 'offline',
      status: 'pending',    
      desiredDate: 'Thứ 5, 17/01/2024',
      desiredTime: '09:00-10:00',
      reason: 'Thảo luận về kết quả học tập học kỳ I và kế hoạch cải thiện',
      requestedAt: '14:20 - 14/01/2024',
    },
     {
      id: 4,
      parentName: 'Bà Lê Thị Hoa',
      parentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      studentName: 'Lê Văn Đức',
      studentClass: 'Lớp K30 CMU TPM 3',
      type: 'offline',
      status: 'pending',    
      desiredDate: 'Thứ 5, 17/01/2024',
      desiredTime: '09:00-10:00',
      reason: 'Thảo luận về kết quả học tập học kỳ I và kế hoạch cải thiện',
      requestedAt: '14:20 - 14/01/2024',
    }, {
      id: 5,
      parentName: 'Bà Lê Thị Hoa',
      parentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      studentName: 'Lê Văn Đức',
      studentClass: 'Lớp K30 CMU TPM 3',
      type: 'offline',
      status: 'pending',    
      desiredDate: 'Thứ 5, 17/01/2024',
      desiredTime: '09:00-10:00',
      reason: 'Thảo luận về kết quả học tập học kỳ I và kế hoạch cải thiện',
      requestedAt: '14:20 - 14/01/2024',
    }, {
      id: 6,
      parentName: 'Bà Lê Thị Hoa',
      parentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      studentName: 'Lê Văn Đức',
      studentClass: 'Lớp K30 CMU TPM 3',
      type: 'offline',
      status: 'pending',    
      desiredDate: 'Thứ 5, 17/01/2024',
      desiredTime: '09:00-10:00',
      reason: 'Thảo luận về kết quả học tập học kỳ I và kế hoạch cải thiện',
      requestedAt: '14:20 - 14/01/2024',
    },
  ]);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  
  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(null);
  
  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTime, setSuggestTime] = useState('');
  
  // Cancel confirmed appointment modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Pagination state
  const [requestsPage, setRequestsPage] = useState(1);
  const [confirmedPage, setConfirmedPage] = useState(1);
  const itemsPerPage = 5; // Số lượng items trên mỗi trang

  // Confirmed page filter and sort state
  const [confirmedClassFilter, setConfirmedClassFilter] = useState<string>('all');
  const [confirmedSortBy, setConfirmedSortBy] = useState<'nearest' | 'latest'>('nearest');

  // Initialize with sample data
  useEffect(() => {
    if (availableDates.length === 0) {
      const sampleData: AvailableDate[] = [
        {
          date: getDateString(1),
          timeSlots: [
            { start: '09:00', end: '10:00' },
            { start: '14:00', end: '15:00' },
            { start: '16:00', end: '17:00' },
          ],
        },
        {
          date: getDateString(3),
          timeSlots: [
            { start: '08:00', end: '09:00' },
            { start: '10:00', end: '10:30' },
            { start: '13:00', end: '14:00' },
          ],
        },
      ];
      setAvailableDates(sampleData);
    }
  }, []);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (startTime && duration) {
      setEndTime(calculateEndTime(startTime, parseInt(duration)));
    }
  }, [startTime, duration]);

  // Toast listener
  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent;
      showToast(event.detail.message, event.detail.type);
    };
    window.addEventListener('show-toast', handler);
    return () => window.removeEventListener('show-toast', handler);
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setRequestsPage(1);
  }, [filterType]);

  // Reset pagination when requests change (e.g., after accepting/rejecting)
  useEffect(() => {
    setConfirmedPage(1);
  }, [requests.length]);

  // Reset pagination when confirmed filter or sort changes
  useEffect(() => {
    setConfirmedPage(1);
  }, [confirmedClassFilter, confirmedSortBy]);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddDate = (date: string) => {
    if (!date) {
      showToast('Vui lòng chọn ngày!', 'error');
      return;
    }
    if (availableDates.find((d) => d.date === date)) {
      showToast('Ngày này đã được thêm!', 'warning');
      return;
    }
    setAvailableDates([...availableDates, { date, timeSlots: [] }]);
    setSelectedDate('');
    showToast('Đã thêm ngày rảnh thành công!', 'success');
  };

  const handleRemoveDate = (index: number, skipConfirm: boolean = false) => {
    const removedDate = availableDates[index];
    
    // Nếu ngày có khung giờ và không skip confirm, hiển thị cảnh báo
    if (!skipConfirm && removedDate.timeSlots.length > 0) {
      if (!window.confirm('Bạn có chắc chắn muốn xóa ngày này và tất cả khung giờ?')) {
        return;
      }
    }
    
    setAvailableDates(availableDates.filter((_, i) => i !== index));
    showToast(`Đã xóa ngày ${formatDate(removedDate.date)}!`, 'warning');
  };

  const handleOpenTimeModal = (date: string) => {
    setCurrentDateForTime(date);
    setTimeModalOpen(true);
    setStartTime('');
    setEndTime('');
    setDuration('60');
  };

  const handleAddTimeSlot = () => {
    if (!currentDateForTime || !startTime || !endTime) {
      showToast('Vui lòng nhập đầy đủ thời gian!', 'error');
      return;
    }
    if (startTime >= endTime) {
      showToast('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!', 'error');
      return;
    }

    const dateIndex = availableDates.findIndex((d) => d.date === currentDateForTime);
    if (dateIndex === -1) return;

    if (isTimeSlotOverlapping(startTime, endTime, availableDates[dateIndex].timeSlots)) {
      showToast('Khung giờ này bị trùng với khung giờ đã có!', 'warning');
      return;
    }

    const newDates = [...availableDates];
    newDates[dateIndex].timeSlots.push({ start: startTime, end: endTime });
    newDates[dateIndex].timeSlots.sort((a, b) => a.start.localeCompare(b.start));
    setAvailableDates(newDates);
    setTimeModalOpen(false);
    showToast(`Đã thêm khung giờ ${startTime} - ${endTime} thành công!`, 'success');
  };

  const handleRemoveTimeSlot = (dateIndex: number, slotIndex: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khung giờ này?')) {
      const newDates = [...availableDates];
      const removedSlot = newDates[dateIndex].timeSlots[slotIndex];
      newDates[dateIndex].timeSlots.splice(slotIndex, 1);
      setAvailableDates(newDates);
      showToast(`Đã xóa khung giờ ${removedSlot.start} - ${removedSlot.end}!`, 'warning');
    }
  };

  const handleRequestAction = (requestId: number, action: 'accept' | 'reject') => {
    if (action === 'reject') {
      // Mở modal từ chối
      setRejectingRequestId(requestId);
      setRejectModalOpen(true);
      return;
    }
    
    if (action === 'accept') {
      // Mở modal chấp nhận
      setAcceptingRequestId(requestId);
      setAcceptModalOpen(true);
      return;
    }
  };
  
  const handleConfirmAccept = () => {
    if (acceptingRequestId !== null) {
      setRequests(
        requests.map((req) =>
          req.id === acceptingRequestId ? { ...req, status: 'accepted' } : req
        )
      );
      showToast('Đã chấp nhận lịch hẹn!', 'success');
      setAcceptModalOpen(false);
      setAcceptingRequestId(null);
      
      // Tự động chuyển sang trang "Lịch hẹn đã xác nhận" sau 1 giây
      setTimeout(() => {
        setCurrentPage('confirmed');
      }, 1000);
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
  
  const handleConfirmReject = () => {
    if (!rejectReason) {
      showToast('Vui lòng chọn lý do từ chối!', 'error');
      return;
    }
    
    if (rejectReason === 'custom' && !customReason.trim()) {
      showToast('Vui lòng nhập lý do cụ thể!', 'error');
      return;
    }
    
    if (rejectingRequestId !== null) {
      setRequests(
        requests.map((req) =>
          req.id === rejectingRequestId ? { ...req, status: 'rejected' } : req
        )
      );
      
      // Tạo thông báo dựa trên lý do
      const reasonMessages: Record<string, string> = {
        schedule_conflict: 'Có lịch đột xuất',
        personal_leave: 'Nghỉ phép',
        meeting_conflict: 'Có cuộc họp quan trọng',
        health_issue: 'Vấn đề sức khỏe',
        reschedule: 'Đề xuất lịch khác',
        custom: customReason,
      };
      
      const reasonText = reasonMessages[rejectReason];
      showToast(`Đã từ chối lịch hẹn. Lý do: ${reasonText}`, 'warning');
      
      handleCloseRejectModal();
    }
  };
  
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
      // Xóa lịch hẹn khỏi danh sách
      setRequests(requests.filter((req) => req.id !== cancelingRequestId));
      
      // Tạo thông báo dựa trên lý do
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

  // Statistics
  const totalDates = availableDates.length;
  const totalTimeSlots = availableDates.reduce((sum, date) => sum + date.timeSlots.length, 0);
  const totalHours = availableDates.reduce((sum, date) => {
    return (
      sum +
      date.timeSlots.reduce((slotSum, slot) => {
        const start = new Date(`2000-01-01T${slot.start}`);
        const end = new Date(`2000-01-01T${slot.end}`);
        return slotSum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0)
    );
  }, 0);
  const upcomingDates = availableDates.filter((date) => new Date(date.date) >= new Date()).length;

  // Quick dates
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Filter requests
  // Filter requests - KHÔNG hiển thị requests đã chấp nhận (accepted)
  const filteredRequests = requests.filter((req) => {
    // Loại bỏ các request đã được chấp nhận
    if (req.status === 'accepted') return false;
    
    if (filterType === 'all') return true;
    if (filterType === 'pending') return req.status === 'pending';
    return req.type === filterType;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
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
    // Extract time from desiredTime (e.g., "14:00-15:00" -> "14:00")
    const getTime = (timeStr: string) => {
      const match = timeStr.match(/(\d{2}:\d{2})/);
      return match ? match[1] : '00:00';
    };
    
    const timeA = getTime(a.desiredTime);
    const timeB = getTime(b.desiredTime);
    
    if (confirmedSortBy === 'nearest') {
      return timeA.localeCompare(timeB); // Sắp xếp tăng dần (giờ gần nhất)
    } else {
      return timeB.localeCompare(timeA); // Sắp xếp giảm dần (giờ muộn nhất)
    }
  });

  // Pagination logic for requests
  const totalRequestsPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startRequestsIndex = (requestsPage - 1) * itemsPerPage;
  const endRequestsIndex = startRequestsIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startRequestsIndex, endRequestsIndex);

  // Pagination logic for confirmed appointments
  const totalConfirmedPages = Math.ceil(filteredConfirmedRequests.length / itemsPerPage);
  const startConfirmedIndex = (confirmedPage - 1) * itemsPerPage;
  const endConfirmedIndex = startConfirmedIndex + itemsPerPage;
  const paginatedConfirmed = filteredConfirmedRequests.slice(startConfirmedIndex, endConfirmedIndex);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <img
              src="https://images.unsplash.com/photo-1562774053-701939374585?w=40&h=40&fit=crop&crop=center"
              alt="Logo"
              className="w-8 h-8 md:w-10 md:h-10 rounded"
            />
            <h1 className="text-lg md:text-xl font-bold text-blue-900">Giảng viên Dashboard</h1>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Tìm lớp học, sinh viên..."
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                  alt="Avatar"
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                />
                <span className="hidden md:block font-medium">TS. Nguyễn Văn A</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-full bg-white shadow-lg border-r border-gray-200 w-64 transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'classes', label: 'Quản lý lớp học', icon: GraduationCap },
            { id: 'grades', label: 'Quản lý điểm', icon: ClipboardList },
            { id: 'progress', label: 'Theo dõi tiến độ', icon: TrendingUp },
            { id: 'reports', label: 'Báo cáo & Cảnh báo', icon: AlertTriangle },
            { id: 'messages', label: 'Tin nhắn/Thông báo', icon: MessageSquare },
          ].map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* Appointment Dropdown */}
          <div className="relative">
            <button
              onClick={() => setAppointmentDropdownOpen(!appointmentDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5" />
                <span>Quản lý lịch hẹn</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  appointmentDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {appointmentDropdownOpen && (
              <div className="mt-2 ml-4 space-y-1">
                {[
                  { id: 'schedule', label: 'Thiết lập lịch rảnh', icon: CalendarPlus },
                  { id: 'requests', label: 'Yêu cầu lịch hẹn', icon: Clock, badge: pendingCount },
                  { id: 'confirmed', label: 'Lịch hẹn đã xác nhận', icon: CheckCircle },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id as Page);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors relative ${
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            <span>Cài đặt tài khoản</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        {/* Schedule Page */}
        {currentPage === 'schedule' && (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 Thiết lập lịch rảnh</h1>
              <p className="text-gray-600">
                Thiết lập ngày và giờ rảnh để sinh viên có thể đặt lịch hẹn
              </p>
            </div>

            {/* Statistics */}
            <Card className="bg-blue-50 border-blue-200 mb-6">
              <CardContent className="p-4">
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
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {totalHours.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Tổng giờ rảnh</div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{upcomingDates}</div>
                  <div className="text-sm text-gray-600">Ngày sắp tới</div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Add Date Form */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm ngày rảnh mới</h2>

              {/* Quick Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn nhanh ngày trong tuần
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                  {quickDates.map((date, i) => {
                    const dateString = date.toISOString().split('T')[0];
                    const dayName = weekDays[date.getDay()];
                    const dayNumber = date.getDate();
                    const isToday = i === 0;
                    const selectedDateIndex = availableDates.findIndex((d) => d.date === dateString);
                    const isSelected = selectedDateIndex !== -1;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Nếu đã chọn, hủy chọn (xóa ngày)
                            // Chỉ skip confirm nếu ngày chưa có time slots
                            const hasTimeSlots = availableDates[selectedDateIndex].timeSlots.length > 0;
                            handleRemoveDate(selectedDateIndex, !hasTimeSlots);
                          } else {
                            // Nếu chưa chọn, thêm ngày
                            handleAddDate(dateString);
                          }
                        }}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-green-500 bg-green-50 text-green-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700'
                            : isToday
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                        }`}
                        title={isSelected ? 'Click để hủy chọn ngày này' : 'Click để thêm ngày này'}
                      >
                        <div className="text-xs font-medium">{dayName}</div>
                        <div className="text-lg font-bold">{dayNumber}</div>
                        {isSelected && <Check className="inline w-3 h-3 text-green-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual Date Input */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="dateInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Hoặc chọn ngày cụ thể
                  </label>
                  <input
                    type="date"
                    id="dateInput"
                    min={getTodayString()}
                    max={getMaxDateString(6)}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleAddDate(selectedDate)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="inline w-4 h-4 mr-2" />
                    Thêm ngày rảnh
                  </Button>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Available Dates List */}
            {availableDates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarPlus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ngày rảnh nào</h3>
                <p className="text-gray-600">
                  Hãy thêm ngày rảnh đầu tiên để sinh viên có thể đặt lịch hẹn với bạn
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableDates.map((dateObj, index) => {
                  const isUpcoming = new Date(dateObj.date) >= new Date();

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
                        !isUpcoming ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <div className="flex items-center gap-3 mb-4 sm:mb-0">
                          <div
                            className={`p-3 rounded-lg ${
                              isUpcoming ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                          >
                            <Clock
                              className={`w-6 h-6 ${
                                isUpcoming ? 'text-blue-600' : 'text-gray-500'
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatDate(dateObj.date)}
                              {!isUpcoming && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full ml-2">
                                  Đã qua
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              <Clock className="inline w-4 h-4 mr-1" />
                              {dateObj.timeSlots.length} khung giờ
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenTimeModal(dateObj.date)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            <Plus className="inline w-4 h-4 mr-1" />
                            Thêm giờ
                          </button>
                          <button
                            onClick={() => handleRemoveDate(index)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {dateObj.timeSlots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {dateObj.timeSlots.map((slot, slotIndex) => (
                            <div
                              key={slotIndex}
                              className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              <Clock className="w-3 h-3 mr-2" />
                              {slot.start} - {slot.end}
                              <button
                                onClick={() => handleRemoveTimeSlot(index, slotIndex)}
                                className="ml-2 text-blue-600 hover:text-red-600"
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
        )}

        {/* Requests Page */}
        {currentPage === 'requests' && (
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">⏰ Yêu cầu lịch hẹn</h1>
              <p className="text-gray-600">Xem và phản hồi các yêu cầu gặp mặt từ phụ huynh</p>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `Tất cả (${requests.length})` },
                  { id: 'pending', label: `Chờ xử lý (${pendingCount})` },
                  {
                    id: 'online',
                    label: `Online (${requests.filter((r) => r.type === 'online').length})`,
                  },
                  {
                    id: 'offline',
                    label: `Trực tiếp (${requests.filter((r) => r.type === 'offline').length})`,
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
              {paginatedRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                  style={{ opacity: request.status !== 'pending' ? 0.5 : 1 }}
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
                              {request.type === 'online' ? 'Online' : 'Trực tiếp'}
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
                                ? 'Chờ xử lý'
                                : request.status === 'accepted'
                                ? 'Đã chấp nhận'
                                : 'Đã từ chối'}
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
                            Từ chối
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            <Check className="inline w-4 h-4 mr-1" />
                            Chấp nhận
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-blue-900 text-lg">
                        <GraduationCap className="inline w-5 h-5 mr-2" />
                        Phụ huynh của: {request.studentName} ({request.studentClass})
                      </h4>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-purple-900 mb-1">Thời gian mong muốn</h4>
                      <p className="text-xl font-bold text-purple-800">
                        {request.desiredDate} - {request.desiredTime}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">Lý do gặp mặt</h5>
                        <p className="text-gray-800 text-sm">{request.reason}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-700 mb-1">Thời gian yêu cầu</h5>
                        <p className="text-gray-800 text-sm">{request.requestedAt}</p>
                      </div>
                      {request.platform && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h5 className="font-medium text-gray-700 mb-1">Nền tảng</h5>
                          <p className="text-gray-800 text-sm font-medium">{request.platform}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalRequestsPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{startRequestsIndex + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min(endRequestsIndex, filteredRequests.length)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{filteredRequests.length}</span> yêu cầu
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestsPage((prev) => Math.max(1, prev - 1))}
                    disabled={requestsPage === 1}
                  >
                    Trước
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
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmed Page */}
        {currentPage === 'confirmed' && (
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
        )}
      </main>

      {/* Time Modal */}
      {timeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
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
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 text-sm"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Hoặc tùy chỉnh thời gian
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Thời lượng
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="30">30 phút</option>
                      <option value="60">60 phút</option>
                      <option value="90">90 phút</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Giờ kết thúc
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTimeSlot}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Thêm giờ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {acceptModalOpen && acceptingRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600 text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Xác nhận chấp nhận lịch hẹn</h3>
                  <p className="text-sm text-gray-600">Bạn có chắc chắn muốn chấp nhận lịch hẹn này?</p>
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
                          alt={request.parentName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{request.parentName}</p>
                          <p className="text-sm text-gray-600">
                            Phụ huynh của {request.studentName} - {request.studentClass}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-300">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Ngày hẹn:</p>
                          <p className="text-sm font-medium text-gray-900">{request.desiredDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Thời gian:</p>
                          <p className="text-sm font-medium text-gray-900">{request.desiredTime}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Hình thức:</p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            request.type === 'online'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {request.type === 'online' ? '🌐 Trực tuyến' : '🏫 Trực tiếp'}
                          {request.platform && ` - ${request.platform}`}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Lý do:</p>
                        <p className="text-sm text-gray-900">{request.reason}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">Lưu ý quan trọng:</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• Phụ huynh sẽ nhận được thông báo xác nhận</li>
                      <li>• Vui lòng đảm bảo bạn có thể tham gia đúng thời gian đã hẹn</li>
                      <li>• Lịch hẹn sẽ được chuyển sang mục "Lịch hẹn đã xác nhận"</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setAcceptModalOpen(false);
                    setAcceptingRequestId(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận chấp nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <X className="text-red-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Từ chối lịch hẹn</h3>
                  <p className="text-xs text-gray-600">Chọn lý do từ chối</p>
                </div>
              </div>
              
              {/* Lý do có sẵn */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">Lý do từ chối:</label>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Có lịch đột xuất</div>
                      <div className="text-xs text-gray-600">Tôi có công việc quan trọng phát sinh đột ngột</div>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Nghỉ phép</div>
                      <div className="text-xs text-gray-600">Tôi đang trong thời gian nghỉ phép</div>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Có cuộc họp quan trọng</div>
                      <div className="text-xs text-gray-600">Tôi có cuộc họp không thể thay đổi</div>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Vấn đề sức khỏe</div>
                      <div className="text-xs text-gray-600">Tôi đang gặp vấn đề về sức khỏe</div>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Đề xuất lịch khác</div>
                      <div className="text-xs text-gray-600">Tôi muốn đề xuất thời gian phù hợp hơn</div>
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
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Lý do khác</div>
                      <div className="text-xs text-gray-600">Nhập lý do cụ thể của bạn</div>
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
                    placeholder="Nhập lý do từ chối..."
                  />
                </div>
              )}
              
              {/* Gợi ý thời gian khác */}
              {rejectReason === 'reschedule' && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Đề xuất thời gian khác (tùy chọn):
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleConfirmReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Gửi từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmed Appointment Modal */}
      {cancelModalOpen && cancelingRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
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
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={request.parentAvatar}
                          alt={request.parentName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{request.parentName}</p>
                          <p className="text-[10px] text-gray-600">{request.studentName} - {request.studentClass}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-700 pt-1.5 border-t border-red-300">
                        <p><strong>Ngày:</strong> {request.desiredDate} | <strong>Giờ:</strong> {request.desiredTime}</p>
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
                    <p className="text-xs font-medium text-red-900 mb-0.5">Lưu ý:</p>
                    <ul className="text-[10px] text-red-800 space-y-0.5">
                      <li>• Phụ huynh sẽ được thông báo qua email/SMS</li>
                      <li>• Lịch hẹn sẽ bị xóa vĩnh viễn</li>
                    </ul>
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

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
            toast.type === 'success'
              ? 'bg-green-500'
              : toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
