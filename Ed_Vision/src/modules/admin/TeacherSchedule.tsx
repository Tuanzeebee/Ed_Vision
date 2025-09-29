import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/components/ui/admin/AdminLayout';
import TeacherProfileHeader from '@/components/ui/admin/TeacherProfileHeader';
import TeacherTabNavigation from '@/components/ui/admin/TeacherTabNavigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type AppointmentType = {
  id: string;
  time: string;
  date: string;
  name: string;
  type: 'parent-meeting' | 'student-counseling' | 'career-counseling' | 'other';
  format: 'online' | 'offline';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  description?: string;
  result?: string;
  relationship?: string;
};

type CalendarEvent = {
  time: string;
  name: string;
  type: 'parent-meeting' | 'student-counseling' | 'career-counseling' | 'other';
  color: string;
  icon: string;
};

export default function TeacherSchedule(): React.JSX.Element {
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedWeek, setSelectedWeek] = useState('2–8 tháng 9, 2025');
  const [filterType, setFilterType] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for calendar events
  const calendarEvents: Record<string, CalendarEvent[]> = {
    'T2-02/09': [
      {
        time: '9:00',
        name: 'Nguyễn Văn A',
        type: 'parent-meeting',
        color: 'bg-purple-100 border-purple-200',
        icon: 'fas fa-users text-purple-600'
      }
    ],
    'T3-03/09': [
      {
        time: '14:00',
        name: 'Lê Thị B',
        type: 'student-counseling',
        color: 'bg-blue-100 border-blue-200',
        icon: 'fas fa-video text-blue-600'
      },
      {
        time: '15:00',
        name: 'Lê Thị B',
        type: 'student-counseling',
        color: 'bg-blue-100 border-blue-200',
        icon: 'fas fa-video text-blue-600'
      }
    ],
    'T4-04/09': [
      {
        time: '12:00',
        name: 'Trần Văn C',
        type: 'career-counseling',
        color: 'bg-green-100 border-green-200',
        icon: 'fas fa-briefcase text-green-600'
      },
      {
        time: '16:00',
        name: 'Họp phụ huynh',
        type: 'parent-meeting',
        color: 'bg-orange-100 border-orange-200',
        icon: 'fas fa-chalkboard text-orange-600'
      },
      {
        time: '17:00',
        name: 'Họp phụ huynh',
        type: 'parent-meeting',
        color: 'bg-orange-100 border-orange-200',
        icon: 'fas fa-chalkboard text-orange-600'
      }
    ],
    'T6-06/09': [
      {
        time: '11:00',
        name: 'Phạm Thị D',
        type: 'parent-meeting',
        color: 'bg-purple-100 border-purple-200',
        icon: 'fas fa-handshake text-purple-600'
      }
    ]
  };

  // Mock upcoming appointments
  const upcomingAppointments: AppointmentType[] = [
    {
      id: '1',
      time: '16:00 - 18:00',
      date: '04/09/2025',
      name: 'Họp phụ huynh lớp 12A',
      type: 'parent-meeting',
      format: 'offline',
      status: 'confirmed',
      description: 'Họp phụ huynh'
    },
    {
      id: '2',
      time: '11:00 - 12:00',
      date: '06/09/2025',
      name: 'Phạm Thị D',
      type: 'parent-meeting',
      format: 'offline',
      status: 'confirmed',
      description: 'Tư vấn phụ huynh'
    },
    {
      id: '3',
      time: '15:00 - 16:00',
      date: '09/09/2025',
      name: 'Hoàng Văn E',
      type: 'student-counseling',
      format: 'online',
      status: 'pending',
      description: 'Tư vấn sinh viên'
    }
  ];

  // Mock appointment history
  const appointmentHistory: AppointmentType[] = [
    {
      id: '4',
      time: '9:00 - 10:00',
      date: '28/08/2025',
      name: 'Nguyễn Văn A',
      type: 'parent-meeting',
      format: 'online',
      status: 'completed',
      description: 'Phụ huynh Nguyễn Thị X',
      relationship: 'Phụ huynh',
      result: 'Đã tư vấn về kế hoạch học tập'
    },
    {
      id: '5',
      time: '14:00 - 15:00',
      date: '25/08/2025',
      name: 'Trần Văn F',
      type: 'career-counseling',
      format: 'offline',
      status: 'completed',
      description: 'Sinh viên lớp 11B',
      relationship: 'Sinh viên',
      result: 'Đã tư vấn về định hướng nghề nghiệp'
    },
    {
      id: '6',
      time: '16:00 - 17:00',
      date: '20/08/2025',
      name: 'Lê Thị G',
      type: 'parent-meeting',
      format: 'online',
      status: 'cancelled',
      description: 'Phụ huynh Lê Văn Y',
      relationship: 'Phụ huynh',
      result: 'Cuộc họp phụ huynh hủy do lịch đột xuất'
    }
  ];

  // Chart data for appointment statistics
  const chartData = {
    labels: ['T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
    datasets: [
      {
        label: 'Họp phụ huynh',
        data: [8, 12, 10, 15, 18, 14],
        backgroundColor: '#a855f7',
        borderColor: '#9333ea',
        borderWidth: 2
      },
      {
        label: 'Tư vấn sinh viên',
        data: [6, 8, 12, 10, 14, 16],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2
      },
      {
        label: 'Tư vấn nghề nghiệp',
        data: [4, 6, 8, 7, 9, 11],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 2
      },
      {
        label: 'Khác',
        data: [2, 3, 4, 5, 6, 4],
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11,
            weight: 'normal' as const
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Số lượng cuộc hẹn',
          font: {
            size: 12,
            weight: 'normal' as const
          },
          color: '#374151'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Tháng',
          font: {
            size: 12,
            weight: 'normal' as const
          },
          color: '#374151'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parent-meeting':
        return 'fas fa-chalkboard text-orange-600';
      case 'student-counseling':
        return 'fas fa-video text-blue-600';
      case 'career-counseling':
        return 'fas fa-briefcase text-green-600';
      default:
        return 'fas fa-calendar text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'parent-meeting':
        return 'Họp phụ huynh';
      case 'student-counseling':
        return 'Tư vấn sinh viên';
      case 'career-counseling':
        return 'Tư vấn nghề nghiệp';
      default:
        return 'Khác';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'parent-meeting':
        return 'bg-orange-100 text-orange-800';
      case 'student-counseling':
        return 'bg-blue-100 text-blue-800';
      case 'career-counseling':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Bị hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'fas fa-check-circle';
      case 'pending':
        return 'fas fa-clock';
      case 'completed':
        return 'fas fa-check-circle';
      case 'cancelled':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  };

  const getRelationshipBadge = (relationship: string) => {
    switch (relationship) {
      case 'Phụ huynh':
        return 'bg-purple-100 text-purple-800';
      case 'Sinh viên':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'Phụ huynh':
        return 'fas fa-users';
      case 'Sinh viên':
        return 'fas fa-user-graduate';
      default:
        return 'fas fa-user';
    }
  };

  const timeSlots = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const weekDays = [
    { label: 'T2', date: '02/09', key: 'T2-02/09' },
    { label: 'T3', date: '03/09', key: 'T3-03/09' },
    { label: 'T4', date: '04/09', key: 'T4-04/09' },
    { label: 'T5', date: '05/09', key: 'T5-05/09' },
    { label: 'T6', date: '06/09', key: 'T6-06/09' },
    { label: 'T7', date: '07/09', key: 'T7-07/09' },
    { label: 'CN', date: '08/09', key: 'CN-08/09' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Teacher Profile Header */}
        <TeacherProfileHeader />

        {/* Navigation Tabs */}
        <TeacherTabNavigation activeTab="schedule" />

        {/* Calendar Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setSelectedView('day')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                      selectedView === 'day' 
                        ? 'text-white bg-blue-600 border-blue-600' 
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Ngày
                  </button>
                  <button 
                    onClick={() => setSelectedView('week')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                      selectedView === 'week' 
                        ? 'text-white bg-blue-600 border-blue-600' 
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tuần
                  </button>
                  <button 
                    onClick={() => setSelectedView('month')}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                      selectedView === 'month' 
                        ? 'text-white bg-blue-600 border-blue-600' 
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tháng
                  </button>
                </div>
                <div>
                  <select 
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-xs cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>2–8 tháng 9, 2025</option>
                    <option>9–15 tháng 9, 2025</option>
                    <option>16–22 tháng 9, 2025</option>
                    <option>23–29 tháng 9, 2025</option>
                  </select>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
                  Hôm nay
                </button>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center cursor-pointer">
                <i className="fas fa-plus mr-1 text-xs"></i>
                Tạo lịch hẹn mới
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Lịch tư vấn tuần</h3>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Calendar Header */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-3 text-center font-medium text-gray-600">Giờ</div>
                  {weekDays.map((day) => (
                    <div key={day.key} className="p-3 text-center font-medium text-gray-800 bg-gray-50 rounded">
                      <div>{day.label}</div>
                      <div className="text-sm text-gray-600">{day.date}</div>
                    </div>
                  ))}
                </div>

                {/* Calendar Body */}
                <div className="space-y-1">
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="grid grid-cols-8 gap-1 h-16">
                      <div className="flex items-center justify-center text-sm text-gray-600 border-r border-gray-200">
                        {timeSlot}
                      </div>
                      {weekDays.map((day) => {
                        const events = calendarEvents[day.key]?.filter(event => event.time === timeSlot.replace(':00', ':00')) || [];
                        return (
                          <div key={`${timeSlot}-${day.key}`} className="border border-gray-100 rounded p-1">
                            {events.map((event, idx) => (
                              <div key={idx} className={`${event.color} rounded p-2 text-xs h-full`}>
                                <div className="flex items-center mb-1">
                                  <i className={`${event.icon} text-xs mr-1`}></i>
                                  <div className="font-medium text-gray-800 truncate">{event.name}</div>
                                </div>
                                <div className="text-gray-600 truncate">{getTypeLabel(event.type)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Statistics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Bộ lọc tìm kiếm</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Loại hẹn</label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả loại hẹn</option>
                    <option value="parent-meeting">Họp phụ huynh</option>
                    <option value="student-counseling">Tư vấn sinh viên</option>
                    <option value="career-counseling">Tư vấn nghề nghiệp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hình thức</label>
                  <select 
                    value={filterFormat}
                    onChange={(e) => setFilterFormat(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả hình thức</option>
                    <option value="offline">Trực tiếp</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Bị hủy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Tìm kiếm</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên phụ huynh/sinh viên..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-gray-700 text-xs cursor-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Thống kê cuộc hẹn 6 tháng gần đây</h3>
              <div className="h-64 w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Cuộc hẹn sắp tới (7 ngày tới)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên & Loại hẹn</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Hình thức</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">{appointment.date}</div>
                        <div className="text-xs text-gray-600">{appointment.time}</div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <i className={getTypeIcon(appointment.type)}></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{appointment.name}</div>
                            <div className="text-sm text-gray-600">{appointment.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.format === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <i className={`${appointment.format === 'online' ? 'fas fa-video' : 'fas fa-handshake'} mr-1`}></i>
                          {appointment.format === 'online' ? 'Online' : 'Trực tiếp'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                          <i className={`${getStatusIcon(appointment.status)} mr-1`}></i>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-green-600 hover:text-green-800 transition-colors" title="Duyệt">
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="text-orange-600 hover:text-orange-800 transition-colors" title="Sửa">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="text-red-600 hover:text-red-800 transition-colors" title="Từ chối">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Appointment History Table */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Lịch sử cuộc hẹn</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Mối quan hệ</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Loại hẹn</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Hình thức</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentHistory.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <span className="text-sm text-gray-800">{appointment.date}</span>
                        <div className="text-xs text-gray-600">{appointment.time}</div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="font-medium text-gray-800">{appointment.name}</div>
                        <div className="text-sm text-gray-600">{appointment.description}</div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        {appointment.relationship && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRelationshipBadge(appointment.relationship)}`}>
                            <i className={`${getRelationshipIcon(appointment.relationship)} mr-1`}></i>
                            {appointment.relationship}
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(appointment.type)}`}>
                          <i className={`${getTypeIcon(appointment.type)} mr-1`}></i>
                          {getTypeLabel(appointment.type)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.format === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <i className={`${appointment.format === 'online' ? 'fas fa-video' : 'fas fa-handshake'} mr-1`}></i>
                          {appointment.format === 'online' ? 'Online' : 'Trực tiếp'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                          <i className={`${getStatusIcon(appointment.status)} mr-1`}></i>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-800">{appointment.result}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">1-3</span> trong tổng số <span className="font-medium">15</span> cuộc hẹn
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                  <i className="fas fa-chevron-left mr-1"></i>
                  Trước
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">1</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">2</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">3</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Sau
                  <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}