import { Plus, CalendarPlus, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AvailableDate } from '../types/appointment.types';
import { formatDate, getTodayString, getMaxDateString } from '../utils/appointmentUtils';
import { Card, CardContent } from '@/components/ui/teacher/teacher_card';
import { Button } from '@/components/ui/teacher/teacher_button';
import { Input } from '@/components/ui/teacher/teacher_input';
import { cn } from '@/lib/Teacher_utils';

interface AppointmentSchedulePageProps {
  availableDates: AvailableDate[];
  onAddDate: (date: string) =>void;
  onRemoveDate: (index: number) =>void;
  onAddTimeSlot: (date: string) =>void;
  onRemoveTimeSlot: (dateIndex: number, slotIndex: number) =>void;
}

export default function AppointmentSchedulePage({
  availableDates,
  onAddDate,
  onRemoveDate,
  onAddTimeSlot,
  onRemoveTimeSlot,
}: AppointmentSchedulePageProps) {
  const { t, i18n } = useTranslation('teacher');
  const LOCALE_MAP: Record<string, string>= { en: 'en-US', vi: 'vi-VN'};
  const locale = LOCALE_MAP[i18n?.language] || i18n?.language || (typeof navigator !== 'undefined'? navigator.language : 'vi-VN');
  const today = getTodayString();
  const maxDate = getMaxDateString(6);

  const totalDates = availableDates.length;
  const totalTimeSlots = availableDates.reduce((sum, date) =>sum + date.timeSlots.length, 0);
  const totalHours = availableDates.reduce((sum, date) => {
    return (
      sum +
      date.timeSlots.reduce((slotSum, slot) => {
        const start = new Date(`2000-01-01T${slot.start}`);
        const end = new Date(`2000-01-01T${slot.end}`);
        return slotSum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0)
    );
  }, 0);

  const upcomingDates = availableDates.filter((date) =>new Date(date.date) >= new Date()).length;

  // Generate quick date selection for next 7 days
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thiết lập lịch rảnh</h1>
        <p className="text-gray-600">Thiết lập ngày và giờ rảnh để sinh viên có thể đặt lịch hẹn</p>
      </div>

      {/* Statistics */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Thống kê lịch hẹn</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalDates}</div>
              <div className="text-sm text-gray-600">Tổng ngày rảnh</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600 mb-1">{totalTimeSlots}</div>
              <div className="text-sm text-gray-600">Khung giờ</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">{totalHours.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Tổng giờ rảnh</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-orange-600 mb-1">{upcomingDates}</div>
              <div className="text-sm text-gray-600">Ngày sắp tới</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Date Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm ngày rảnh mới</h2>

          {/* Quick Date Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Chọn nhanh ngày trong tuần
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
              {quickDates.map((date, i) => {
                const dateString = date.toISOString().split('T')[0];
                const dayName = weekDays[date.getDay()];
                const dayNumber = date.getDate();
                const isToday = i === 0;
                const isSelected = availableDates.find((d) =>d.date === dateString);

                return (
                  <Button
                    key={i}
                    type="button"variant="outline"onClick={() =>!isSelected && onAddDate(dateString)}
                    className={cn(
                      'p-3 h-auto flex-col',
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-700': isToday
                        ? 'border-blue-500 bg-blue-50 text-blue-700': 'border-gray-200 hover:border-blue-300 hover:bg-blue-50')}
                  >
                    <div className="text-xs font-medium">{dayName}</div>
                    <div className="text-lg font-bold">{dayNumber}</div>
                    {isSelected && <div className="text-xs text-green-600"></div>}
                  </Button>);
              })}
            </div>
          </div>

          {/* Manual Date Input */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="dateInput"className="block text-sm font-medium text-gray-700 mb-2">Hoặc chọn ngày cụ thể
              </label>
              <Input
                type="date"id="dateInput"min={today}
                max={maxDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>e.target.value && onAddDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Dates List */}
      {availableDates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarPlus className="h-8 w-8 text-gray-400"/>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ngày rảnh nào</h3>
          <p className="text-gray-600">Hãy thêm ngày rảnh đầu tiên để sinh viên có thể đặt lịch hẹn với bạn
          </p>
        </Card>) : (
        <div className="space-y-4">
          {availableDates.map((dateObj, index) => {
            const isUpcoming = new Date(dateObj.date) >= new Date();

            return (
              <Card key={index} className={cn(!isUpcoming && 'opacity-75')}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                      <div
                        className={cn(
                          'p-3 rounded-lg',
                          isUpcoming ? 'bg-blue-100': 'bg-gray-100')}
                      >
                        <Clock
                          className={cn(
                            'w-6 h-6',
                            isUpcoming ? 'text-blue-600': 'text-gray-500')}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(dateObj.date, locale)}
                          {!isUpcoming && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full ml-2">Đã qua
                            </span>)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          <Clock className="inline w-4 h-4 mr-1"/>
                          {dateObj.timeSlots.length} khung giờ
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>onAddTimeSlot(dateObj.date)}
                        className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-1"/>Thêm giờ
                      </Button>
                      <Button
                        onClick={() =>onRemoveDate(index)}
                        variant="destructive"size="icon">
                        <X className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>

                  {dateObj.timeSlots.length >0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dateObj.timeSlots.map((slot, slotIndex) =>(
                        <div
                          key={slotIndex}
                          className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          <Clock className="w-3 h-3 mr-2"/>
                          {slot.start} - {slot.end}
                          <button
                            onClick={() =>onRemoveTimeSlot(index, slotIndex)}
                            className="ml-2 text-blue-600 hover:text-red-600">
                            <X className="w-3 h-3"/>
                          </button>
                        </div>))}
                    </div>) : (
                    <div className="text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <p className="font-medium">Chưa có khung giờ nào</p>
                      <p className="text-sm">Hãy thêm khung giờ rảnh cho ngày này!</p>
                    </div>)}
                </CardContent>
              </Card>);
          })}
        </div>)}
    </div>);
}
