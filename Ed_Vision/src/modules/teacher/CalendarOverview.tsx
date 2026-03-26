import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, GraduationCap, UserCheck, CalendarCheck, X, Users2, User } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/teacher/teacher_card";
import { Button } from "@/components/ui/teacher/teacher_button";
import { Badge } from "@/components/ui/teacher/teacher_badge";
import TeacherLayout from './components/TeacherLayout';
import { buildUrl } from '@/services/api/config'
import { useInstructorProfile } from './hooks/useInstructorProfile'

// Types
interface Booking {
  id: number;
  date: string;
  time: string;
  name: string;
  bookerType: 'student' | 'parent';
  class?: string;
  studentName?: string;
  type: 'online' | 'offline';
  avatar: string;
}

interface AvailableSlot {
  date: string;
  time: string;
}

interface SlotInfo {
  totalBookings: number;
  studentCount: number;
  parentCount: number;
  bookings: Booking[];
}

interface WeekDay {
  dayName: string;
  dateStr: string;
  date: string;
  isToday: boolean;
}

type Props = {};

export default function CalendarOverview({}: Props) {
  const { t } = useTranslation('teacher');
  const { instructorId, loading: profileLoading } = useInstructorProfile()
  const [slotDetailsModal, setSlotDetailsModal] = useState(false);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState('');
  const [selectedSlotBookings, setSelectedSlotBookings] = useState<Booking[] | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const defaultTimeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ];
  const [timeSlots, setTimeSlots] = useState<string[]>(defaultTimeSlots);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  // Helper functions
  const getMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const toLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateISO = (dayOffset: number) => {
    const monday = getMonday();
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayOffset);
    return toLocalISO(date);
  };

  const currentWeekLabel = () => {
    const start = getMonday();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };
    
    return `${t('appointments.calendarOverview.weekLabel')} ${formatDate(start)} - ${formatDate(end)}`;
  };

  const weekDays = (): WeekDay[] => {
    const days: WeekDay[] = [];
    const start = getMonday();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = t(`appointments.calendarOverview.${dayKeys[date.getDay()]}`);
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
      const dateISO = toLocalISO(date);
      
      const isToday = date.getTime() === today.getTime();
      
      days.push({
        dayName: dayName,
        dateStr: dateStr,
        date: dateISO,
        isToday: isToday,
      });
    }
    
    return days;
  };

  const totalBookings = bookings.length;
  const totalStudents = bookings.filter(b => b.bookerType === 'student').length;
  const totalParents = bookings.filter(b => b.bookerType === 'parent').length;

  const getSlotInfo = (date: string, time: string): SlotInfo | null => {
    const hasSlot = availableSlots.some(s => s.date === date && s.time === time);
    if (!hasSlot) return null;
    
    const slotBookings = bookings.filter(b => b.date === date && b.time === time);
    const studentCount = slotBookings.filter(b => b.bookerType === 'student').length;
    const parentCount = slotBookings.filter(b => b.bookerType === 'parent').length;
    
    return {
      totalBookings: slotBookings.length,
      studentCount: studentCount,
      parentCount: parentCount,
      bookings: slotBookings,
    };
  };

  const showSlotDetails = (date: string, time: string) => {
    const slotInfo = getSlotInfo(date, time);
    if (slotInfo && slotInfo.totalBookings > 0) {
      const dateObj = new Date(date);
      const dayKeys = ["sundayFull", "mondayFull", "tuesdayFull", "wednesdayFull", "thursdayFull", "fridayFull", "saturdayFull"];
      const dayName = t(`appointments.calendarOverview.${dayKeys[dateObj.getDay()]}`);
      setSelectedSlotInfo(`${dayName}, ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} - ${time}`);
      setSelectedSlotBookings(slotInfo.bookings);
      setSlotDetailsModal(true);
    } else {
      displayToast(t('appointments.calendarOverview.noAppointments'), "error");
    }
  };

  const displayToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  useEffect(() => {
    const fetchWeek = async () => {
      try {
        if (!instructorId || profileLoading) return
        const monday = getDateISO(0)
        const sunday = getDateISO(6)
        const url = buildUrl('/teacher/appointments/week-overview', { startDate: monday, endDate: sunday, instructorId })
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setBookings(Array.isArray(data?.bookings) ? data.bookings : [])
        setAvailableSlots(Array.isArray(data?.availableSlots) ? data.availableSlots : [])
        const times: string[] = Array.from(new Set((data?.availableSlots ?? []).map((s: any) => s.time)))
        times.sort((a, b) => {
          const pa = parseInt(a.slice(0, 2), 10) * 60 + parseInt(a.slice(3, 5), 10)
          const pb = parseInt(b.slice(0, 2), 10) * 60 + parseInt(b.slice(3, 5), 10)
          return pa - pb
        })
        if (times.length) setTimeSlots(times)
      } catch (e) {
        displayToast(t('appointments.calendarOverview.errorLoadingData'), 'error')
      }
    }
    fetchWeek()
  }, [instructorId, profileLoading])

  return (
    <TeacherLayout currentPage="calendar-overview">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 {t('appointments.calendarOverview.title')}</h1>
          <p className="text-gray-600">{t('appointments.calendarOverview.subtitle')}</p>
        </div>

        {/* Week Label */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <h2 className="text-xl font-bold text-gray-900">{currentWeekLabel()}</h2>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">{t('appointments.calendarOverview.totalBookings')}</p>
                <p className="text-3xl font-bold">{totalBookings}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <CalendarCheck className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">{t('appointments.calendarOverview.totalStudents')}</p>
                <p className="text-3xl font-bold">{totalStudents}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <User className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">{t('appointments.calendarOverview.totalParents')}</p>
                <p className="text-3xl font-bold">{totalParents}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Users2 className="w-8 h-8 text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Week Calendar View */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">{t('appointments.calendarOverview.timeLabel', 'Thời gian')}</th>
                    {weekDays().map((day) => (
                      <th key={day.date} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[140px]">
                        <div>{day.dayName}</div>
                        <div className="text-xs font-normal text-gray-500">{day.dateStr}</div>
                        {day.isToday && (
                          <div className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 bg-blue-600 text-white">
                            {t('appointments.calendarOverview.today', 'Hôm nay')}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot) => (
                    <tr key={timeSlot} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">{timeSlot}</td>
                      {weekDays().map((day) => {
                        const slotInfo = getSlotInfo(day.date, timeSlot);
                        return (
                          <td key={day.date + timeSlot} className="px-2 py-2 text-center">
                            {slotInfo ? (
                              <div
                                onClick={() => showSlotDetails(day.date, timeSlot)}
                                className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 hover:bg-blue-100 cursor-pointer transition-all hover:shadow-md"
                              >
                                <div className="flex items-center justify-center gap-1 text-blue-700 text-xs font-semibold mb-2">
                                  <CalendarCheck className="w-3 h-3" />
                                  <span>{t('appointments.calendarOverview.availableSlot', 'Ngày rảnh')}</span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-1.5 text-gray-700">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="text-lg font-bold">{slotInfo.totalBookings}</span>
                                    <span className="text-xs text-gray-600">{t('appointments.calendarOverview.people', 'người')}</span>
                                  </div>

                                  <div className="flex items-center justify-center gap-3 text-xs">
                                    <div className="flex items-center gap-1">
                                      <GraduationCap className="w-3 h-3 text-green-600" />
                                      <span className="font-semibold text-green-700">{slotInfo.studentCount}</span>
                                      <span className="text-gray-600">SV</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <UserCheck className="w-3 h-3 text-purple-600" />
                                      <span className="font-semibold text-purple-700">{slotInfo.parentCount}</span>
                                      <span className="text-gray-600">PH</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-400">
                                <X className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-xs">{t('appointments.calendarOverview.noSlot')}</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('appointments.calendarOverview.legendTitle')}</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">{t('appointments.calendarOverview.legendBookings')}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{t('appointments.calendarOverview.legendStudents')}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-700">{t('appointments.calendarOverview.legendParents')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot Details Panel - Fixed Floating Non-Modal (Transparent Background) */}
      {slotDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-blue-200 w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/90 to-purple-50/90 rounded-t-2xl">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  {t('appointments.calendarOverview.slotDetails')}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{selectedSlotInfo}</p>
              </div>
              <button
                onClick={() => setSlotDetailsModal(false)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {selectedSlotBookings && (
                <div className="p-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <Users className="w-7 h-7 text-blue-600 mb-2 mx-auto" />
                      <p className="text-2xl font-bold text-blue-700">{selectedSlotBookings.length}</p>
                      <p className="text-xs text-gray-600 font-medium">{t('appointments.calendarOverview.total', 'Tổng số')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                      <GraduationCap className="w-7 h-7 text-green-600 mb-2 mx-auto" />
                      <p className="text-2xl font-bold text-green-700">
                        {selectedSlotBookings.filter(b => b.bookerType === 'student').length}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">{t('appointments.calendarOverview.totalStudents')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                      <UserCheck className="w-7 h-7 text-purple-600 mb-2 mx-auto" />
                      <p className="text-2xl font-bold text-purple-700">
                        {selectedSlotBookings.filter(b => b.bookerType === 'parent').length}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">{t('appointments.calendarOverview.totalParents')}</p>
                    </div>
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900">{t('appointments.calendarOverview.bookingList', 'Danh sách đặt lịch')}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {selectedSlotBookings.length} {t('appointments.calendarOverview.people', 'người')}
                      </span>
                    </div>
                    
                    {selectedSlotBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                          {index + 1}
                        </div>
                        <img
                          src={booking.avatar}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{booking.name}</p>
                          <p className="text-xs text-gray-600 truncate">
                            {booking.bookerType === 'student'
                              ? `${t('appointments.calendarOverview.student')} - ${booking.class}`
                              : `${t('appointments.calendarOverview.parentOf', 'Phụ huynh của')} ${booking.studentName}`}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant={booking.bookerType === 'student' ? 'default' : 'secondary'}
                            className={`${
                              booking.bookerType === 'student'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-purple-100 text-purple-700 border-purple-300'
                            } border text-xs font-medium`}
                          >
                            {booking.bookerType === 'student' ? (
                              <GraduationCap className="w-3 h-3 mr-1" />
                            ) : (
                              <UserCheck className="w-3 h-3 mr-1" />
                            )}
                            {booking.bookerType === 'student' ? 'SV' : 'PH'}
                          </Badge>
                          <Badge
                            className={`${
                              booking.type === 'online'
                                ? 'bg-blue-500 text-white'
                                : 'bg-orange-500 text-white'
                            } text-xs font-medium`}
                          >
                            {booking.type === 'online' ? t('appointments.calendarOverview.online') : t('appointments.calendarOverview.offline')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/90 rounded-b-2xl">
              <Button 
                onClick={() => setSlotDetailsModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('appointments.calendarOverview.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
          <div
            className={`text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toastType === 'success'
                ? 'bg-green-500'
                : toastType === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
