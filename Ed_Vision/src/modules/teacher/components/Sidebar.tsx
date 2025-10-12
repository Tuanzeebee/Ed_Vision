import {
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
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  requestCount: number;
}

export default function Sidebar({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  requestCount,
}: SidebarProps) {
  const [appointmentDropdownOpen, setAppointmentDropdownOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'classes', label: 'Quản lý lớp học', icon: GraduationCap },
    { id: 'grades', label: 'Quản lý điểm', icon: ClipboardList },
    { id: 'progress', label: 'Theo dõi tiến độ', icon: TrendingUp },
    { id: 'reports', label: 'Báo cáo & Cảnh báo', icon: AlertTriangle },
    { id: 'messages', label: 'Tin nhắn/Thông báo', icon: MessageSquare },
  ];

  const appointmentSubItems = [
    {
      id: 'schedule',
      label: 'Thiết lập lịch rảnh',
      icon: CalendarPlus,
      badge: null,
    },
    {
      id: 'requests',
      label: 'Yêu cầu lịch hẹn',
      icon: Clock,
      badge: requestCount,
    },
    {
      id: 'confirmed',
      label: 'Lịch hẹn đã xác nhận',
      icon: CheckCircle,
      badge: null,
    },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-full bg-white shadow-lg border-r border-gray-200 w-64 transition-transform duration-300 ease-in-out z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
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
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  appointmentDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {appointmentDropdownOpen && (
              <div className="mt-2 ml-4 space-y-1">
                {appointmentSubItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={cn(
                      'w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors relative',
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onNavigate('settings');
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Cài đặt tài khoản</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
