import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import type { AvailableDate, AppointmentRequest } from './types/appointment.types';
import { useLocalStorage } from './hooks/useLocalStorage';
import TeacherLayout from './components/TeacherLayout';
import ScheduleManagement from './ScheduleManagement';
import TeacherAppointmentManagement from './TeacherAppointmentManagement';

type Page = 'schedule'| 'management';

export default function TeacherAppointmentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize currentPage based on URL path immediately
  const getInitialPage = (): Page => {
    return location.pathname === '/teacher/schedule'? 'schedule': 'management';
  };
  
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);

  // Update currentPage when URL changes (only if different)
  useEffect(() => {
    const pathname = location.pathname;
    const newPage = pathname === '/teacher/schedule'? 'schedule': 'management';
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  }, [location.pathname, currentPage]);

  // Appointment schedule state
  const [availableDates, setAvailableDates] = useLocalStorage<AvailableDate[]>(
    'availableDates',
    []
  );

  // Request state (no longer used but kept for compatibility)
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

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() =>setToast(null), 3000);
  };

  const handleNavigation = (path: string) => {
    // For all paths, just navigate without special handling
    navigate(path);
  };

  return (
    <TeacherLayout currentPage={currentPage} onNavigate={handleNavigation}>
      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        {/* Render components based on current page */}
        {currentPage === 'schedule'&& (
          <ScheduleManagement
            availableDates={availableDates}
            setAvailableDates={setAvailableDates}
            showToast={showToast}
          />)}

        {currentPage === 'management'&& (
          <TeacherAppointmentManagement
            showToast={showToast}
          />)}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
            toast.type === 'success'? 'bg-green-500': toast.type === 'error'? 'bg-red-500': toast.type === 'warning'? 'bg-yellow-500': 'bg-blue-500'}`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5"/>
            <span>{toast.message}</span>
          </div>
        </div>)}
    </TeacherLayout>);
}