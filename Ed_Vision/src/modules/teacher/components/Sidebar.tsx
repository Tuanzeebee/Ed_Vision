import {
  Home,
  Users,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Bell,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (path: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed left-0 top-20 bottom-0 overflow-y-auto">
      <nav className="p-4 space-y-2">
        <button
          onClick={() => handleNavigation('/teacher/dashboard')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'dashboard'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/class-management')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'class-management'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Users className="w-5 h-5" />
          <span>Quản lý lớp học</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/grade-management')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'grade-management'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Quản lý điểm</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/progress-tracking')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'progress-tracking'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Theo dõi tiến độ</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/reports-alerts')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'reports-alerts'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Báo cáo & Cảnh báo</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/messages')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'messages'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Bell className="w-5 h-5" />
          <span>Tin nhắn/Thông báo</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/settings')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${currentPage === 'settings'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Settings className="w-5 h-5" />
          <span>Cài đặt tài khoản</span>
        </button>
      </nav>
    </aside>
  );
}
