import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(
    currentPage === 'grade-management' || currentPage === 'prediction-view' || currentPage === 'prediction-view-v2' || currentPage === 'setting-grade-table'
  );

  const [isAppointmentMenuOpen, setIsAppointmentMenuOpen] = useState(
    currentPage === 'calendar-overview' || currentPage === 'schedule' || currentPage === 'management'
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
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'dashboard'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('sidebar.dashboard')}</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/class-management')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'class-management'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('sidebar.classManagement')}</span>
        </button>

        {/* Grade Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleGradeMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'grade-management' || currentPage === 'prediction-view' || currentPage === 'setting-grade-table' || currentPage === 'prediction-view-v2'
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
              <button
                onClick={() => handleNavigation('/teacher/grade-management')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'grade-management'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.gradeTable')}</span>
              </button>
              <button
                onClick={() => handleNavigation('/teacher/setting-grade-table')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'setting-grade-table'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.viewPredictions')}</span>
              </button>
              <button
                onClick={() => handleNavigation('/teacher/prediction-view')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'prediction-view' || window.location.pathname === '/teacher/prediction-view'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Brain className="w-4 h-4" />
                <span>{t('sidebar.predictionV2')}</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => handleNavigation('/teacher/progress-tracking')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'progress-tracking'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('sidebar.progressTracking')}</span>
        </button>

        {/* Survey Management */}
        <button
          onClick={() => handleNavigation('/teacher/survey-management')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'survey-management'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{t('sidebar.surveyManagement')}</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/reports-alerts')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'reports-alerts'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t('sidebar.reportsAlerts')}</span>
        </button>

        <button
          onClick={() => handleNavigation('/teacher/messages')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'messages'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Bell className="w-4 h-4" />
          <span>{t('sidebar.messages')}</span>
        </button>

        {/* Appointment Management with Dropdown */}
        <div className="space-y-1">
          <button
            onClick={toggleAppointmentMenu}
            className={`flex items-center justify-between px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'calendar-overview' || currentPage === 'schedule' || currentPage === 'management'
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigation('/teacher/calendar-overview');
                              }}
                              className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-colors cursor-pointer ${currentPage === 'calendar-overview'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                <Calendar className="w-4 h-4" />
                <span>{t('sidebar.calendarOverview')}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation('/teacher/schedule');
                }}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'schedule'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{t('sidebar.scheduleSetup')}</span>
              </button>

              <button
                onClick={() => handleNavigation('/teacher/appointments')}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'management'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('sidebar.appointmentList')}</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => handleNavigation('/teacher/settings')}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-all duration-150 active:scale-95 cursor-pointer ${currentPage === 'settings'
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Settings className="w-4 h-4" />
          <span>{t('sidebar.accountSettings')}</span>
        </button>
      </nav>
    </aside>
  );
}
