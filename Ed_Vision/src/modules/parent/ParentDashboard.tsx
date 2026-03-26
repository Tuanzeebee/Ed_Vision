import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import johnSmithAvatar from '../../assets/parent/avatar.png';
import iconEducation from '../../assets/parent/iconEducation.svg';
import iconCalendar from '../../assets/parent/iconCalendar.svg';
import iconVideoCall from '../../assets/parent/iconVideoCall.svg';
import iconMeeting from '../../assets/parent/iconMeeting.svg';
import iconWarning from '../../assets/parent/iconWarning.svg';
import iconTrophy from '../../assets/parent/iconTrophy.svg';
import iconTrendUp from '../../assets/parent/iconTrendUp.svg';
import iconInfo from '../../assets/parent/iconInfo.svg';
import iconMoreHoriz from '../../assets/parent/iconMoreHoriz.svg';
import Footer from "../../components/layout/Footer"
import Header from "../../components/layout/Header"
type Student = {
  id: string;
  name: string;
  avatar: string;
  year: string;
  subjects: string;
  gpa: string;
  attendance: string;
};

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'online' | 'in-person';
  bgColor: string;
  borderColor: string;
  textColor: string;
  tagColor: string;
  icon: string;
  teacherName: string;
};

type Alert = {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  date?: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

type Message = {
  id: string;
  teacherName: string;
  teacherAvatar: string;
  teacherRole: string;
  message: string;
  time: string;
  isNew: boolean;
};

type Teacher = {
  name: string;
  avatar: string;
  role: string;
};

type Props = {
  studentData?: Student;
  appointments?: Appointment[];
  alerts?: Alert[];
  messages?: Message[];
  teachers?: Teacher[];
};

type Notification = {
  id: string;
  type: 'accepted' | 'declined' | 'rescheduled' | 'pending';
  title: string;
  description: string;
  date: string;
  time: string;
  status: string;
  timeAgo: string;
  actionText?: string;
};

export default function ParentDashboard({
  studentData = {
    id: 'JS2024001',
    name: 'John Smith',
    avatar: johnSmithAvatar,
    year: 'Year 3',
    subjects: 'Mathematics & Science',
    gpa: '3.7',
    attendance: '94%'
  },
  appointments = [
    {
      id: '1',
      title: 'Meeting with Dr. Brown',
      date: 'September 15, 2024',
      time: '10:00 AM',
      type: 'online',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-900',
      tagColor: 'bg-orange-100 text-orange-800',
      icon: iconVideoCall,
      teacherName: 'Dr. Brown'
    },
    {
      id: '2',
      title: 'Parent-Teacher Conference',
      date: 'September 22, 2024',
      time: '2:30 PM',
      type: 'in-person',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      tagColor: 'bg-blue-100 text-blue-800',
      icon: iconMeeting,
      teacherName: 'Ms. Johnson'
    }
  ],
  alerts = [],
  messages = [
    {
      id: '1',
      teacherName: 'Dr. Brown',
      teacherAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      teacherRole: 'Mathematics Teacher',
      message: "Regarding John's mathematics progress...",
      time: '2 min ago',
      isNew: true
    },
    {
      id: '2',
      teacherName: 'Ms. Johnson',
      teacherAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      teacherRole: 'Science Teacher',
      message: 'Great improvement in science class!',
      time: '1 hour ago',
      isNew: false
    },
  ]
}: Props) {
  const { t } = useTranslation(['parent', 'common']);
  const navigate = useNavigate();

  // Create default alerts with translations
  const defaultAlerts: Alert[] = alerts.length === 0 ? [
    {
      id: '1',
      type: 'warning',
      title: t('parent:parentDashboard.academicWarning'),
      description: t('parent:parentDashboard.lowAttendance', { subject: 'Mathematics', percent: '78' }),
      date: t('parent:parentDashboard.actionRequired', { date: 'September 20, 2024' }),
      icon: iconWarning,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900'
    },
    {
      id: '2',
      type: 'success',
      title: t('parent:parentDashboard.excellenceAward'),
      description: t('parent:parentDashboard.outstandingGpa', { gpa: '3.7' }),
      date: t('parent:parentDashboard.awarded', { date: 'September 1, 2024' }),
      icon: iconTrophy,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900'
    },
    {
      id: '3',
      type: 'info',
      title: t('parent:parentDashboard.improvementNotice'),
      description: t('parent:parentDashboard.positiveGrades', { subject: 'Science' }),
      date: t('parent:parentDashboard.keepGoodWork'),
      icon: iconTrendUp,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900'
    }
  ] : alerts;

  const openChatPage = () => {
    navigate('/parent/chat');
  };

  const newMessagesCount = messages.filter(m => m.isNew).length;

  // Calendar data for September 2024
  const calendarDays = [
    { day: '1', isCurrentMonth: false },
    { day: '2', isCurrentMonth: true },
    { day: '3', isCurrentMonth: true },
    { day: '4', isCurrentMonth: true },
    { day: '5', isCurrentMonth: true },
    { day: '6', isCurrentMonth: true },
    { day: '7', isCurrentMonth: true },
    { day: '8', isCurrentMonth: true },
    { day: '9', isCurrentMonth: true },
    { day: '10', isCurrentMonth: true },
    { day: '11', isCurrentMonth: true },
    { day: '12', isCurrentMonth: true },
    { day: '13', isCurrentMonth: true },
    { day: '14', isCurrentMonth: true },
    { day: '15', isCurrentMonth: true, hasEvent: 'online' },
    { day: '16', isCurrentMonth: true },
    { day: '17', isCurrentMonth: true },
    { day: '18', isCurrentMonth: true },
    { day: '19', isCurrentMonth: true },
    { day: '20', isCurrentMonth: true },
    { day: '21', isCurrentMonth: true },
    { day: '22', isCurrentMonth: true, hasEvent: 'in-person' },
    { day: '23', isCurrentMonth: true },
    { day: '24', isCurrentMonth: true },
    { day: '25', isCurrentMonth: true },
    { day: '26', isCurrentMonth: true },
    { day: '27', isCurrentMonth: true },
    { day: '28', isCurrentMonth: true },
    { day: '29', isCurrentMonth: true },
    { day: '30', isCurrentMonth: true },
    { day: '1', isCurrentMonth: false },
    { day: '2', isCurrentMonth: false },
    { day: '3', isCurrentMonth: false },
    { day: '4', isCurrentMonth: false },
    { day: '5', isCurrentMonth: false }
  ];

  const weekDays = [
    t('parent:parentDashboard.calendar.sun'),
    t('parent:parentDashboard.calendar.mon'),
    t('parent:parentDashboard.calendar.tue'),
    t('parent:parentDashboard.calendar.wed'),
    t('parent:parentDashboard.calendar.thu'),
    t('parent:parentDashboard.calendar.fri'),
    t('parent:parentDashboard.calendar.sat')
  ];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <Header isParentMode={true} />
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 md:px-8 lg:px-24 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 rounded-lg p-2 mr-3">
                <img src={iconEducation} alt="" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('parent:dashboard.title')}</h1>
                <p className="text-sm text-gray-500">{t('parent:parentDashboard.welcomeBack')}, Sarah Thompson</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Student Information Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{t('parent:parentDashboard.studentInformation')}</h2>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <img src={iconMoreHoriz} alt="" className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Student Profile */}
                  <div 
                    className="bg-blue-50 border border-blue-100 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => navigate('/parent/student-details')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          <img 
                            src={studentData.avatar} 
                            alt={studentData.name}
                            className="w-12 h-12 rounded-full border-2 border-blue-200 object-cover"
                          />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-blue-900">{studentData.name}</h3>
                          <p className="text-sm text-blue-700">{studentData.year} • {studentData.subjects}</p>
                          <p className="text-xs text-blue-600 mt-1">{t('parent:parentDashboard.studentId')}: {studentData.id}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('parent:parentDashboard.currentGpa')}</p>
                      <p className="text-lg font-semibold text-gray-900">{studentData.gpa}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('parent:students.attendance')}</p>
                      <p className="text-lg font-semibold text-gray-900">{studentData.attendance}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex items-center space-x-2">
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Week headers */}
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center py-2">
                        <span className="text-xs font-medium text-gray-500">{day}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayData, index) => (
                      <div key={index} className="text-center py-2">
                        <span 
                          className={`text-sm ${
                            !dayData.isCurrentMonth 
                              ? 'text-gray-400' 
                              : dayData.hasEvent === 'online'
                              ? 'bg-orange-100 text-orange-800 font-medium rounded px-2 py-1'
                              : dayData.hasEvent === 'in-person'
                              ? 'bg-blue-100 text-blue-800 font-medium rounded px-2 py-1'
                              : 'text-gray-900'
                          }`}
                        >
                          {dayData.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-100 rounded"></div>
                      <span className="text-xs text-gray-600">{t('parent:parentDashboard.onlineMeeting')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-100 rounded"></div>
                      <span className="text-xs text-gray-600">{t('parent:appointments.inPerson')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('parent:parentDashboard.upcomingAppointments')}</h2>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {t('parent:parentDashboard.newCount', { count: 2 })}
                  </span>
                  <img src={iconCalendar} alt="" className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className={`${appointment.bgColor} border ${appointment.borderColor} rounded-lg p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium ${appointment.textColor}`}>{appointment.title}</h3>
                        <p className={`text-sm mt-1 ${appointment.textColor.replace('900', '700')}`}>
                          {appointment.date} at {appointment.time}
                        </p>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`${appointment.tagColor} text-xs font-medium px-2 py-1 rounded-full`}>
                            {appointment.type === 'online' ? t('parent:parentDashboard.onlineMeeting') : t('parent:appointments.inPerson')}
                          </span>
                          <button 
                            className={`${appointment.textColor.replace('900', '600')} hover:${appointment.textColor.replace('900', '700')} text-xs font-medium`}
                            onClick={() => openChatPage()}
                          >
                            💬 {t('parent:parentDashboard.chat')}
                          </button>
                        </div>
                      </div>
                      <img src={appointment.icon} alt="" className="w-5 h-5 mt-1" />
                    </div>
                  </div>
                ))}

                <button 
                  className="w-full text-center py-3 text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => navigate('/parent/appointments')}
                >
                  {t('parent:appointments.viewAll')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Chat & Alerts */}
          <div className="space-y-6 lg:space-y-8">
            {/* Recent Messages */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('parent:parentDashboard.recentMessages')}</h2>
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {t('parent:parentDashboard.newCount', { count: newMessagesCount })}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700" onClick={openChatPage}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openChatPage()}
                  >
                    <div className="flex items-start space-x-3">
                      <img src={message.teacherAvatar} alt={message.teacherName} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{message.teacherName}</h4>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.message}</p>
                        <div className="flex items-center mt-1">
                          <span className={`w-2 h-2 ${message.isNew ? 'bg-blue-500' : 'bg-green-500'} rounded-full mr-2`}></span>
                          <span className={`text-xs ${message.isNew ? 'text-blue-600' : 'text-green-600'} font-medium`}>
                            {message.isNew ? t('parent:parentDashboard.newMessage') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Chat Button */}
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  onClick={openChatPage}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <span>{t('parent:parentDashboard.startNewChat')}</span>
                </button>
              </div>
            </div>

            {/* Alerts & Recognition */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('parent:parentDashboard.alertsAndRecognition')}</h2>
                <img src={iconInfo} alt="" className="w-5 h-5" />
              </div>

              <div className="space-y-4">
                {defaultAlerts.map((alert) => (
                  <div key={alert.id} className={`${alert.bgColor} border ${alert.borderColor} rounded-lg p-4`}>
                    <div className="flex items-start">
                      <img src={alert.icon} alt="" className="w-5 h-5 mt-0.5" />
                      <div className="ml-3 flex-1">
                        <h3 className={`font-medium ${alert.textColor}`}>{alert.title}</h3>
                        <p className={`text-sm mt-1 ${alert.textColor.replace('900', '700')}`}>
                          {alert.description}
                        </p>
                        {alert.date && (
                          <p className={`text-xs mt-1 ${alert.textColor.replace('900', '600')}`}>
                            {alert.date}
                          </p>
                        )}
                        {alert.type === 'warning' && (
                          <button 
                            className={`${alert.textColor.replace('900', '600')} hover:${alert.textColor.replace('900', '700')} text-xs font-medium mt-2`}
                            onClick={() => openChatPage()}
                          >
                            {t('parent:parentDashboard.discussWithTeacher')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}