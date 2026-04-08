import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
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
  const { t } = useTranslation('teacher');
  const location = useLocation();

  // derive active path from prop or location and normalize it to a full route
  const rawActive = currentPage ? currentPage : location.pathname;
  const normalizedPath = rawActive.startsWith('/') ? rawActive : `/teacher/${rawActive}`;

  // Map some short slugs to their actual route for menu matching
  const mappedPath = normalizedPath === '/teacher/management' ? '/teacher/appointments' : normalizedPath;

  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(
    mappedPath.includes('/teacher/grade') || mappedPath.includes('/teacher/prediction') || mappedPath.includes('/teacher/setting-grade-table')
  );

  const [isAppointmentMenuOpen, setIsAppointmentMenuOpen] = useState(
    mappedPath.includes('/teacher/calendar') || mappedPath.includes('/teacher/schedule') || mappedPath.includes('/teacher/appointments')
  );

  useEffect(() => {
    // Keep menu open when `currentPage` prop (a short slug) or the real pathname indicates a child route
    let p = currentPage ? (currentPage.startsWith('/') ? currentPage : `/teacher/${currentPage}`) : location.pathname;
    if (p === '/teacher/management') p = '/teacher/appointments';
    setIsGradeMenuOpen(p.startsWith('/teacher/grade') || p.startsWith('/teacher/prediction') || p.startsWith('/teacher/setting-grade-table'));
    setIsAppointmentMenuOpen(p.startsWith('/teacher/calendar') || p.startsWith('/teacher/schedule') || p.startsWith('/teacher/appointments'));
  }, [location.pathname, currentPage]);

  const handleNavigation = (path: string) => {
    if (onNavigate) onNavigate(path);
  };

  const toggleGradeMenu = () => setIsGradeMenuOpen((s) => !s);
  const toggleAppointmentMenu = () => setIsAppointmentMenuOpen((s) => !s);

  return (
    <aside className="w-full h-full bg-white flex flex-col text-[15px]">
      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/teacher/dashboard"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Home className="w-4 h-4" />
          <span>{t('sidebar.dashboard')}</span>
        </NavLink>

        <NavLink
          to="/teacher/class-management"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Users className="w-4 h-4" />
          <span>{t('sidebar.classManagement')}</span>
        </NavLink>

        {/* Grade Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleGradeMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isGradeMenuOpen
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-4 h-4" />
              <span>{t('sidebar.gradeManagement')}</span>
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
              <NavLink
                to="/teacher/grade-management"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.gradeTable')}</span>
              </NavLink>
              <NavLink
                to="/teacher/setting-grade-table"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.viewPredictions')}</span>
              </NavLink>
              <NavLink
                to="/teacher/prediction-view"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Brain className="w-4 h-4" />
                <span>{t('sidebar.predictionV2')}</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/teacher/progress-tracking"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('sidebar.progressTracking')}</span>
        </NavLink>

        {/* Survey Management */}
        <NavLink
          to="/teacher/survey-management"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{t('sidebar.surveyManagement')}</span>
        </NavLink>

        <NavLink
          to="/teacher/reports-alerts"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t('sidebar.reportsAlerts')}</span>
        </NavLink>

        <NavLink
          to="/teacher/messages"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('sidebar.messages')}</span>
        </NavLink>

        {/* Appointment Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleAppointmentMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isAppointmentMenuOpen
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4" />
              <span>{t('sidebar.appointmentManagement')}</span>
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
              <NavLink
                to="/teacher/calendar-overview"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t('sidebar.calendarOverview')}</span>
              </NavLink>
              <NavLink
                to="/teacher/schedule"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{t('sidebar.scheduleSetup')}</span>
              </NavLink>

              <NavLink
                to="/teacher/appointments"
                className={({ isActive }) => `flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.appointmentList')}</span>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/teacher/settings"
          className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <Settings className="w-4 h-4" />
          <span>{t('sidebar.accountSettings')}</span>
        </NavLink>
      </nav>
    </aside>
  );
}
