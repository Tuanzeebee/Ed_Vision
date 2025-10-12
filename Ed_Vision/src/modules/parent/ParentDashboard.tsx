import { useNavigate } from 'react-router-dom';
import johnSmithAvatar from '../../assets/parent/avatar.png';
import iconEducation from '../../assets/parent/iconEducation.svg';
import iconMoreHoriz from '../../assets/parent/iconMoreHoriz.svg';
import iconCalendar from '../../assets/parent/iconCalendar.svg';
import iconVideoCall from '../../assets/parent/iconVideoCall.svg';
import iconMeeting from '../../assets/parent/iconMeeting.svg';
import iconChevronLeft from '../../assets/parent/iconChevronLeft.svg';
import iconChevronRightNav from '../../assets/parent/iconChevronRightNav.svg';
import iconWarning from '../../assets/parent/iconWarning.svg';
import iconTrophy from '../../assets/parent/iconTrophy.svg';
import iconTrendUp from '../../assets/parent/iconTrendUp.svg';
import iconInfo from '../../assets/parent/iconInfo.svg';
import Footer from "../../components/layout/Footer"
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
      icon: iconVideoCall
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
      icon: iconMeeting
    }
  ],
  alerts = [
    {
      id: '1',
      type: 'warning',
      title: 'Academic Warning',
      description: 'Low attendance in Mathematics (78%)',
      date: 'Action required by September 20, 2024',
      icon: iconWarning,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900'
    },
    {
      id: '2',
      type: 'success',
      title: 'Excellence Award',
      description: 'Outstanding GPA this semester (3.7)',
      date: 'Awarded on September 1, 2024',
      icon: iconTrophy,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900'
    },
    {
      id: '3',
      type: 'info',
      title: 'Improvement Notice',
      description: 'Science grades showing positive trend',
      date: 'Keep up the good work!',
      icon: iconTrendUp,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900'
    }
  ],
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
    {
      id: '3',
      teacherName: 'Mr. Wilson',
      teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      teacherRole: 'Class Teacher',
      message: 'Parent meeting scheduled for next week',
      time: '3 hours ago',
      isNew: true
    }
  ],

}: Props) {
  const navigate = useNavigate();
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 md:px-8 lg:px-24 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 rounded-lg p-2 mr-3">
                <img src={iconEducation} alt="" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">Parent Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, Sarah Thompson</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Chat Icon in Header */}
              <button 
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={openChatPage}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                {/* Notification Badge */}
                {newMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {newMessagesCount}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7H4l5-5v5z"></path>
                </svg>
              </button>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">ST</span>
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
                  <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <img src={iconMoreHoriz} alt="More options" className="w-5 h-5" />
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
                          <p className="text-xs text-blue-600 mt-1">Student ID: {studentData.id}</p>
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current GPA</p>
                      <p className="text-lg font-semibold text-gray-900">{studentData.gpa}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Attendance</p>
                      <p className="text-lg font-semibold text-gray-900">{studentData.attendance}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">September 2024</h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <img src={iconChevronLeft} alt="Previous" className="w-5 h-5" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <img src={iconChevronRightNav} alt="Next" className="w-5 h-5" />
                    </button>
                  </div>
                </div>

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
                      <span className="text-xs text-gray-600">Online Meeting</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-100 rounded"></div>
                      <span className="text-xs text-gray-600">In-Person</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    2 New
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
                        <div className="mt-2">
                          <span className={`${appointment.tagColor} text-xs font-medium px-2 py-1 rounded-full`}>
                            {appointment.type === 'online' ? 'Online Meeting' : 'In-Person'}
                          </span>
                        </div>
                      </div>
                      <img src={appointment.icon} alt="" className="w-5 h-5 mt-1" />
                    </div>
                  </div>
                ))}

                <button 
                  className="w-full text-center py-3 text-blue-600 hover:text-blue-700 font-medium text-sm cursor-pointer"
                  onClick={() => navigate('/parent/appointments')}
                >
                  View All Appointments
                </button>
              </div>
            </div>

            {/* Alerts & Recognition */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Alerts & Recognition</h2>
                <img src={iconInfo} alt="" className="w-5 h-5" />
              </div>

              <div className="space-y-4">
                {alerts.map((alert) => (
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