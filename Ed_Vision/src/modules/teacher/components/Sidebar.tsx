import { useState } from 'react';
import {
  Home,
  Users,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Brain,
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle,
  ClipboardCheck,
} from 'lucide-react';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (path: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(
    currentPage === 'grade-management' || currentPage === 'prediction-view' || currentPage === 'prediction-view-v2'
  );

  const [isAppointmentMenuOpen, setIsAppointmentMenuOpen] = useState(
    currentPage === 'calendar-overview' || currentPage === 'schedule' || currentPage === 'requests' || currentPage === 'confirmed'
  );

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const toggleGradeMenu = () => {
    setIsGradeMenuOpen(!isGradeMenuOpen);
  };



  const toggleAppointmentMenu = () => {
    setIsAppointmentMenuOpen(!isAppointmentMenuOpen);
  };

    return (
      <aside className="w-full h-full bg-white flex flex-col text-[15px]">
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => handleNavigation('/teacher/dashboard')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'dashboard'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/class-management')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'class-management'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý lớp cố vấn</span>
        </button>

        {/* Grade Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleGradeMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'grade-management' || currentPage === 'prediction-view'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-4 h-4" />
              <span>Quản lý điểm</span>
            </div>
            {isGradeMenuOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {/* Dropdown Menu */}
          {isGradeMenuOpen && (
            <div className="ml-4 space-y-1">
              <button
                onClick={() => handleNavigation('/teacher/grade-management')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'grade-management'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Bảng điểm</span>
              </button>

              <button
                onClick={() => handleNavigation('/teacher/prediction-view')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'prediction-view'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Brain className="w-4 h-4" />
                <span>Xem dự đoán</span>
              </button>

              <button
                onClick={() => handleNavigation('/teacher/prediction-view-v2')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'prediction-view-v2'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Brain className="w-4 h-4" />
                <span>Dự đoán v2</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => handleNavigation('/teacher/progress-tracking')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'progress-tracking'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Theo dõi tiến độ</span>
        </button>

        {/* Survey Management */}
        <button
          onClick={() => handleNavigation('/teacher/survey-management')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'survey-management'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Khảo sát sinh viên</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/reports-alerts')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'reports-alerts'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Báo cáo & Cảnh báo</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/messages')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'messages'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Bell className="w-4 h-4" />
          <span>Tin nhắn/Thông báo</span>
        </button>

        {/* Appointment Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleAppointmentMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'schedule' || currentPage === 'requests' || currentPage === 'confirmed'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4" />
              <span>Quản lý lịch hẹn</span>
            </div>
            {isAppointmentMenuOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {/* Dropdown Menu */}
          {isAppointmentMenuOpen && (
            <div className="ml-4 space-y-1">
                            <button
                              onClick={() => handleNavigation('/teacher/calendar-overview')}
                              className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'calendar-overview'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                <Calendar className="w-4 h-4" />
                <span>Tổng quan lịch hẹn</span>
              </button>
              <button
                onClick={() => handleNavigation('/teacher/appointments')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'schedule'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Thiết lập lịch rảnh</span>
              </button>

              <button
                onClick={() => handleNavigation('/teacher/requests')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'requests'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>Yêu cầu lịch hẹn</span>
              </button>

              <button
                onClick={() => handleNavigation('/teacher/confirmed')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'confirmed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Lịch hẹn đã xác nhận</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => handleNavigation('/teacher/settings')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === 'settings'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt tài khoản</span>
        </button>
      </nav>
    </aside>
  );
}
