import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  getCurrentWeek,
  getNextWeek,
  getPreviousWeek,
  getDatesInWeek,
  formatDateForAPI,
  getDayName,
  formatDateShort,
  type WeekInfo,
} from '@/lib/weekUtils';
import axios from 'axios';
import { buildUrl } from '@/services/api/config';

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

type ScheduleSlot = {
  slotId?: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  appointment?: {
    appointmentId: number;
    bookerName: string;
    bookerRole: string;
    studentName?: string;
    meetingPurpose?: string;
    status: string;
    meetingType: string;
  };
};

type DaySchedule = {
  date: string;
  dayName: string;
  dateDisplay: string;
  isToday: boolean;
  slots: ScheduleSlot[];
};

export interface TeacherScheduleProps {
  teacherId?: string;
}

export default function TeacherSchedule({ teacherId: teacherIdProp }: TeacherScheduleProps = {}): React.JSX.Element {
  const teacherId = teacherIdProp;
  const [currentWeek, setCurrentWeek] = useState<WeekInfo>(getCurrentWeek());
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter options from API
  const [meetingPurposes, setMeetingPurposes] = useState<string[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<string[]>([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState<string[]>([]);

  // Upcoming appointments state
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(0);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);

  // Appointment history state
  const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Chart data state
  const [chartData, setChartData] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Time slots from 8:00 to 22:00
  const timeSlots = [
    { start: '08:00', end: '09:00', label: '08:00 - 09:00'},
    { start: '09:00', end: '10:00', label: '09:00 - 10:00'},
    { start: '10:00', end: '11:00', label: '10:00 - 11:00'},
    { start: '11:00', end: '12:00', label: '11:00 - 12:00'},
    { start: '12:00', end: '13:00', label: '12:00 - 13:00'},
    { start: '13:00', end: '14:00', label: '13:00 - 14:00'},
    { start: '14:00', end: '15:00', label: '14:00 - 15:00'},
    { start: '15:00', end: '16:00', label: '15:00 - 16:00'},
    { start: '16:00', end: '17:00', label: '16:00 - 17:00'},
    { start: '17:00', end: '18:00', label: '17:00 - 18:00'},
    { start: '18:00', end: '19:00', label: '18:00 - 19:00'},
    { start: '19:00', end: '20:00', label: '19:00 - 20:00'},
    { start: '20:00', end: '21:00', label: '20:00 - 21:00'},
    { start: '21:00', end: '22:00', label: '21:00 - 22:00'},
  ];

  // Fetch schedule data
  const fetchScheduleData = useCallback(async () => {
    if (!teacherId) return;

    setIsLoading(true);
    try {
      const startDate = formatDateForAPI(currentWeek.startDate);
      const endDate = formatDateForAPI(currentWeek.endDate);
      
      // Fetch instructor's weekly slots and appointments
      const response = await axios.get(
        buildUrl(`/admin/instructors/${teacherId}/schedule`),
        { params: { startDate, endDate } }
      );

      const weekDates = getDatesInWeek(currentWeek);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedule: DaySchedule[] = weekDates.map((date) => {
        const dateStr = formatDateForAPI(date);
        const dayData = response.data?.find((d: { date: string }) =>d.date === dateStr);
        
        return {
          date: dateStr,
          dayName: getDayName(date.getDay()),
          dateDisplay: formatDateShort(date),
          isToday: date.getTime() === today.getTime(),
          slots: timeSlots.map((slot) => {
            const matchingSlot = dayData?.slots?.find(
              (s: { startTime: string }) =>s.startTime === slot.start
            );
            return {
              slotId: matchingSlot?.slotId,
              startTime: slot.start,
              endTime: slot.end,
              isOpen: matchingSlot?.isOpen || false,
              appointment: matchingSlot?.appointment,
            };
          }),
        };
      });

      setWeekSchedule(schedule);
    } catch (error) {
      // Create empty schedule structure
      const weekDates = getDatesInWeek(currentWeek);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const emptySchedule: DaySchedule[] = weekDates.map((date) =>({
        date: formatDateForAPI(date),
        dayName: getDayName(date.getDay()),
        dateDisplay: formatDateShort(date),
        isToday: date.getTime() === today.getTime(),
        slots: timeSlots.map((slot) =>({
          startTime: slot.start,
          endTime: slot.end,
          isOpen: false,
        })),
      }));
      setWeekSchedule(emptySchedule);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, currentWeek]);

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    if (!teacherId) return;
    try {
      const response = await axios.get(
        buildUrl(`/admin/instructors/${teacherId}/schedule/filter-options`)
      );
      if (response.data) {
        setMeetingPurposes(response.data.meetingPurposes || []);
        setMeetingTypes(response.data.meetingTypes || ['online', 'offline', 'both']);
        setAppointmentStatuses(response.data.statuses || ['pending', 'confirmed', 'completed', 'cancelled']);
      }
    } catch (error) {
      // Default values
      setMeetingTypes(['online', 'offline', 'both']);
      setAppointmentStatuses(['pending', 'confirmed', 'completed', 'cancelled']);
    }
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) return;
    fetchScheduleData();
    fetchFilterOptions();
  }, [teacherId, fetchScheduleData, fetchFilterOptions]);

  // Fetch upcoming appointments
  const fetchUpcomingAppointments = useCallback(async (page: number = 1) => {
    if (!teacherId) return;
    setIsLoadingUpcoming(true);
    try {
      const response = await axios.get(
        buildUrl(`/admin/instructors/${teacherId}/appointments/upcoming`),
        { params: { page, limit: 5 } }
      );
      setUpcomingAppointments(response.data.data || []);
      setUpcomingTotal(response.data.meta?.total || 0);
      setUpcomingTotalPages(response.data.meta?.totalPages || 0);
      setUpcomingPage(page);
    } catch (error) {
      setUpcomingAppointments([]);
    } finally {
      setIsLoadingUpcoming(false);
    }
  }, [teacherId]);

  // Fetch appointment history
  const fetchAppointmentHistory = useCallback(async (page: number = 1) => {
    if (!teacherId) return;
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(
        buildUrl(`/admin/instructors/${teacherId}/appointments/history`),
        { params: { page, limit: 10 } }
      );
      setAppointmentHistory(response.data.data || []);
      setHistoryTotal(response.data.meta?.total || 0);
      setHistoryTotalPages(response.data.meta?.totalPages || 0);
      setHistoryPage(page);
    } catch (error) {
      setAppointmentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [teacherId]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    if (!teacherId) return;
    setIsLoadingChart(true);
    try {
      const response = await axios.get(
        buildUrl(`/admin/instructors/${teacherId}/appointments/stats`)
      );
      setChartData(response.data);
    } catch (error) {
      setChartData(null);
    } finally {
      setIsLoadingChart(false);
    }
  }, [teacherId]);

  // Load appointments and chart on mount
  useEffect(() => {
    if (!teacherId) return;
    fetchUpcomingAppointments();
    fetchAppointmentHistory();
    fetchChartData();
  }, [teacherId, fetchUpcomingAppointments, fetchAppointmentHistory, fetchChartData]);

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeek(getPreviousWeek(currentWeek));
  };

  const handleNextWeek = () => {
    setCurrentWeek(getNextWeek(currentWeek));
  };

  const handleToday = () => {
    setCurrentWeek(getCurrentWeek());
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11,
            weight: 'normal'as const
          }
        }
      },
      tooltip: {
        mode: 'index'as const,
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
          color: '#6b7280'},
        title: {
          display: true,
          text: 'Số lượng cuộc hẹn',
          font: {
            size: 12,
            weight: 'normal'as const
          },
          color: '#374151'}
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
          color: '#6b7280'},
        title: {
          display: true,
          text: 'Tháng',
          font: {
            size: 12,
            weight: 'normal'as const
          },
          color: '#374151'}
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'as const
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
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
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
      case 'no_show':
        return 'Không đến';
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
      case 'no_show':
        return 'fas fa-user-slash';
      default:
        return 'fas fa-question-circle';
    }
  };

  // Format week range for display
  const formatWeekRange = () => {
    const startDate = currentWeek.startDate;
    const endDate = currentWeek.endDate;
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();
    
    return `Tuần ${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`;
  };

  // Get slot style based on appointment status
  const getSlotStyle = (slot: ScheduleSlot) => {
    if (slot.appointment) {
      const status = slot.appointment.status;
      if (status === 'confirmed') return 'bg-blue-100 border-blue-300';
      if (status === 'pending') return 'bg-yellow-100 border-yellow-300';
      if (status === 'completed') return 'bg-green-100 border-green-300';
      if (status === 'cancelled') return 'bg-red-100 border-red-300';
      return 'bg-purple-100 border-purple-300';
    }
    if (slot.isOpen) return 'bg-white border-gray-200 hover:bg-gray-50';
    // Slot chưa mở - màu xám đậm hơn
    return 'bg-gray-200 border-gray-300';
  };

  // Get cute icon for booker role
  const getBookerRoleIcon = (role: string) => {
    if (role === 'parent') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 mr-1"title="Phụ huynh">
          <span className="text-xs"></span></span>);
    }
    if (role === 'student') {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 mr-1"title="Sinh viên">
          <span className="text-xs"></span></span>);
    }
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 mr-1">
        <span className="text-xs"></span></span>);
  };

  // Get meeting type label
  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'online': return 'Online';
      case 'offline': return 'Trực tiếp';
      case 'both': return 'Linh hoạt';
      default: return type;
    }
  };

  // Get meeting type icon with color
  const getMeetingTypeIcon = (type: string) => {
    if (type === 'online') {
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 mr-1"title="Online">
          <span className="text-[10px]"></span></span>);
    }
    if (type === 'offline') {
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-100 mr-1"title="Trực tiếp">
          <span className="text-[10px]"></span></span>);
    }
    if (type === 'both') {
      return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 mr-1"title="Linh hoạt">
          <span className="text-[10px]"></span></span>);
    }
    return null;
  };

  // Get meeting purpose label
  const getMeetingPurposeLabel = (purpose: string | undefined) => {
    if (!purpose) return '';
    return purpose;
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePreviousWeek}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="text-lg font-semibold text-gray-800 min-w-[280px] text-center">
                  {formatWeekRange()}
                </span>
                <button 
                  onClick={handleNextWeek}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
                  <i className="fas fa-chevron-right"></i>
                </button>
                <button 
                  onClick={handleToday}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">Hôm nay
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Lịch tư vấn tuần</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải lịch...</span>
              </div>) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="p-3 text-center font-medium text-gray-600">Giờ</div>
                    {weekSchedule.map((day) =>(
                      <div 
                        key={day.date} 
                        className={`p-3 text-center font-medium rounded ${
                          day.isToday ? 'bg-blue-100 text-blue-800': 'bg-gray-50 text-gray-800'}`}
                      >
                        <div>{day.dayName}</div>
                        <div className="text-sm text-gray-600">{day.dateDisplay}</div>
                      </div>))}
                  </div>

                  {/* Calendar Body */}
                  <div className="space-y-1">
                    {timeSlots.map((slot) =>(
                      <div key={slot.label} className="grid grid-cols-8 gap-1 min-h-[64px]">
                        <div className="flex items-center justify-center text-sm text-gray-600 border-r border-gray-200">
                          {slot.label}
                        </div>
                        {weekSchedule.map((day) => {
                          const daySlot = day.slots.find(s =>s.startTime === slot.start);
                          return (
                            <div 
                              key={`${slot.start}-${day.date}`} 
                              className={`border rounded p-1 ${daySlot ? getSlotStyle(daySlot) : 'border-gray-100'}`}
                            >
                              {daySlot?.appointment && (
                                <div className="text-xs h-full">
                                  <div className="flex items-center font-medium text-gray-800 truncate">
                                    {getBookerRoleIcon(daySlot.appointment.bookerRole)}
                                    <span className="truncate">{daySlot.appointment.bookerName}</span>
                                  </div>
                                  {daySlot.appointment.meetingPurpose && (
                                    <div className="text-purple-600 truncate text-[10px]">
                                       {getMeetingPurposeLabel(daySlot.appointment.meetingPurpose)}
                                    </div>)}
                                  <div className="flex items-center gap-1 text-gray-500 truncate">
                                    {getMeetingTypeIcon(daySlot.appointment.meetingType)}
                                    <span className={`inline-flex items-center px-1 rounded text-[10px] ${getStatusBadgeColor(daySlot.appointment.status)}`}>
                                      {getStatusLabel(daySlot.appointment.status)}
                                    </span>
                                  </div>
                                </div>)}
                            </div>);
                        })}
                      </div>))}
                  </div>
                </div>
              </div>)}

            {/* Legend / Ghi chú màu sắc */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Ghi chú</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Đối tượng đặt lịch */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Đối tượng</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100">
                      <span className="text-xs"></span></span>
                    <span className="text-xs text-gray-600">Sinh viên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-100">
                      <span className="text-xs"></span></span>
                    <span className="text-xs text-gray-600">Phụ huynh</span>
                  </div>
                </div>

                {/* Hình thức họp */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Hình thức</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                      <span className="text-xs"></span></span>
                    <span className="text-xs text-gray-600">Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
                      <span className="text-xs"></span></span>
                    <span className="text-xs text-gray-600">Trực tiếp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100">
                      <span className="text-xs"></span></span>
                    <span className="text-xs text-gray-600">Linh hoạt</span>
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Trạng thái</p>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-yellow-300"></span>
                    <span className="text-xs text-gray-600">Chờ xác nhận</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-300"></span>
                    <span className="text-xs text-gray-600">Đã xác nhận</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-300"></span>
                    <span className="text-xs text-gray-600">Hoàn thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-300"></span>
                    <span className="text-xs text-gray-600">Đã hủy</span>
                  </div>
                </div>

                {/* Slot trống */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Khung giờ</p>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></span>
                    <span className="text-xs text-gray-600">Mở đặt lịch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gray-300 border border-gray-500"></span>
                    <span className="text-xs text-gray-600">Đóng</span>
                  </div>
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">Loại hẹn (Mục đích)</label>
                  <select 
                    value={filterType}
                    onChange={(e) =>setFilterType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">Tất cả loại hẹn</option>
                    {meetingPurposes.map((purpose) =>(
                      <option key={purpose} value={purpose}>{purpose}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hình thức họp</label>
                  <select 
                    value={filterFormat}
                    onChange={(e) =>setFilterFormat(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">Tất cả hình thức</option>
                    {meetingTypes.map((type) =>(
                      <option key={type} value={type}>{getMeetingTypeLabel(type)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) =>setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">Tất cả trạng thái</option>
                    {appointmentStatuses.map((status) =>(
                      <option key={status} value={status}>{getStatusLabel(status)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Tìm kiếm</label>
                  <input 
                    type="text"placeholder="Nhập tên phụ huynh/sinh viên..."value={searchTerm}
                    onChange={(e) =>setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-gray-700 text-xs cursor-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Chart */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Thống kê cuộc hẹn 6 tháng gần đây</h3>
              {isLoadingChart ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>) : chartData ? (
                <div className="h-64 w-full">
                  <Line data={chartData} options={chartOptions} />
                </div>) : (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-chart-line text-4xl mb-3 text-gray-300"></i>
                    <p>Chưa có dữ liệu thống kê</p>
                  </div>
                </div>)}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Cuộc hẹn trong tuần</h3>
            {isLoadingUpcoming ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-calendar-check text-4xl mb-3 text-gray-300"></i>
                <p>Không có cuộc hẹn nào trong tuần</p>
              </div>) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên & Loại hẹn</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Đối tượng</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Hình thức</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAppointments.map((appointment) =>(
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="text-sm font-medium text-gray-800">{appointment.date}</div>
                            <div className="text-xs text-gray-600">{appointment.time}</div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="flex items-center">
                              {getBookerRoleIcon(appointment.bookerRole)}
                              <div>
                                <div className="font-medium text-gray-800">{appointment.name}</div>
                                <div className="text-sm text-gray-600">{appointment.meetingPurpose || appointment.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.bookerRole === 'student'? 'bg-blue-100 text-blue-800': 'bg-pink-100 text-pink-800'}`}>
                              {appointment.bookerRole === 'student'? 'Sinh viên': 'Phụ huynh'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.format === 'online'? 'bg-green-100 text-green-800': 'bg-yellow-100 text-yellow-800'}`}>
                              {appointment.format === 'online'? 'Online': 'Trực tiếp'}
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
                              <button className="text-green-600 hover:text-green-800 transition-colors"title="Duyệt">
                                <i className="fas fa-check"></i>
                              </button>
                              <button className="text-orange-600 hover:text-orange-800 transition-colors"title="Sửa">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition-colors"title="Từ chối">
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination for Upcoming */}
                {upcomingTotalPages >1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Hiển thị <span className="font-medium">{(upcomingPage - 1) * 5 + 1}-{Math.min(upcomingPage * 5, upcomingTotal)}</span>trong tổng số <span className="font-medium">{upcomingTotal}</span>cuộc hẹn
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() =>fetchUpcomingAppointments(upcomingPage - 1)}
                        disabled={upcomingPage === 1}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        <i className="fas fa-chevron-left mr-1"></i>Trước
                      </button>
                      {Array.from({ length: upcomingTotalPages }, (_, i) =>i + 1).map((page) =>(
                        <button
                          key={page}
                          onClick={() =>fetchUpcomingAppointments(page)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                            page === upcomingPage
                              ? 'text-white bg-blue-600 border border-blue-600': 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>))}
                      <button 
                        onClick={() =>fetchUpcomingAppointments(upcomingPage + 1)}
                        disabled={upcomingPage === upcomingTotalPages}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Sau
                        <i className="fas fa-chevron-right ml-1"></i>
                      </button>
                    </div>
                  </div>)}
              </>)}
          </CardContent>
        </Card>

        {/* Appointment History Table */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Lịch sử cuộc hẹn</h3>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>) : appointmentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-history text-4xl mb-3 text-gray-300"></i>
                <p>Chưa có lịch sử cuộc hẹn nào</p>
              </div>) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Tên</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Đối tượng</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Loại hẹn</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Hình thức</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">Trạng thái</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointmentHistory.map((appointment) =>(
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <span className="text-sm text-gray-800">{appointment.date}</span>
                            <div className="text-xs text-gray-600">{appointment.time}</div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="flex items-center">
                              {getBookerRoleIcon(appointment.bookerRole)}
                              <div>
                                <div className="font-medium text-gray-800">{appointment.name}</div>
                                <div className="text-sm text-gray-600">{appointment.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.bookerRole === 'student'? 'bg-blue-100 text-blue-800': 'bg-pink-100 text-pink-800'}`}>
                              {appointment.bookerRole === 'student'? 'Sinh viên': 'Phụ huynh'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {appointment.meetingPurpose || 'Không xác định'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.format === 'online'? 'bg-green-100 text-green-800': 'bg-yellow-100 text-yellow-800'}`}>
                              {appointment.format === 'online'? 'Online': 'Trực tiếp'}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`}>
                              <i className={`${getStatusIcon(appointment.status)} mr-1`}></i>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <p className="text-sm text-gray-800">{appointment.result || '-'}</p>
                          </td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination for History */}
                {historyTotalPages >1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">Hiển thị <span className="font-medium">{(historyPage - 1) * 10 + 1}-{Math.min(historyPage * 10, historyTotal)}</span>trong tổng số <span className="font-medium">{historyTotal}</span>cuộc hẹn
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() =>fetchAppointmentHistory(historyPage - 1)}
                        disabled={historyPage === 1}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        <i className="fas fa-chevron-left mr-1"></i>Trước
                      </button>
                      {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                        // Show first 5 pages or adjust based on current page
                        let pageNum = i + 1;
                        if (historyTotalPages >5 && historyPage >3) {
                          pageNum = historyPage - 2 + i;
                          if (pageNum >historyTotalPages) pageNum = historyTotalPages - 4 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() =>fetchAppointmentHistory(pageNum)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                              pageNum === historyPage
                                ? 'text-white bg-blue-600 border border-blue-600': 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>);
                      })}
                      <button 
                        onClick={() =>fetchAppointmentHistory(historyPage + 1)}
                        disabled={historyPage === historyTotalPages}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Sau
                        <i className="fas fa-chevron-right ml-1"></i>
                      </button>
                    </div>
                  </div>)}
              </>)}
          </CardContent>
        </Card>
      </div>
    );
}
