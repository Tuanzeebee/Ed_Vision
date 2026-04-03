// src/components/ui/admin/TimeFilter.tsx

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './TimeFilter.css';
import { format, setYear, setMonth, setDate } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

type ViewMode = 'day'| 'month'| 'year'| 'all';

interface TimeFilterProps {
  viewMode: ViewMode;
  selectedDate: Date;                    // DUY NHẤT 1 state – dùng cho cả query + hiển thị
  onViewModeChange: (mode: ViewMode) =>void;
  onDateChange: (date: Date) =>void;
}

export default function TimeFilter({
  viewMode,
  selectedDate,
  onViewModeChange,
  onDateChange,
}: TimeFilterProps) {
  const { t } = useTranslation('admin');
  const datePickerRef = useRef<any>(null);

  const openDatePicker = () => {
    datePickerRef.current?.setOpen(true);
  };

  // Luôn hiển thị ngày đầy đủ – dù chọn Năm hay Tháng
  const fullDisplayText = format(selectedDate, "EEEE, dd 'tháng'MM, yyyy", { locale: vi });

  // Xử lý khi chọn năm/tháng/ngày → giữ nguyên ngày đang xem
  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    let newDate = new Date(selectedDate); // giữ nguyên ngày hiện tại

    if (viewMode === 'year') {
      newDate = setYear(newDate, date.getFullYear());
    } else if (viewMode === 'month') {
      newDate = setMonth(newDate, date.getMonth());
      newDate = setDate(newDate, 1); // tháng thì đặt về ngày 1
    } else {
      newDate = date; // ngày thì lấy nguyên
    }

    onDateChange(newDate);
  };

  const getDateFormat = () => {
    if (viewMode === 'year') return 'yyyy';
    if (viewMode === 'month') return 'MM/yyyy';
    return 'dd/MM/yyyy';
  };

  const pickerProps: any = {};
  if (viewMode === 'month') pickerProps.showMonthYearPicker = true;
  if (viewMode === 'year') pickerProps.showYearPicker = true;

  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg border border-gray-200 p-2 shadow-sm text-sm">

      <div className="flex bg-gray-100 rounded-md p-0.5">
        {([
          { mode: 'day'as const, label: t('time.day') },
          { mode: 'month'as const, label: t('time.month') },
          { mode: 'year'as const, label: t('time.year') },
          { mode: 'all'as const, label: t('time.allTime') },
        ]).map((item) =>(
            <button
              key={item.mode}
              onClick={() =>onViewModeChange(item.mode)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === item.mode
                  ? 'bg-white text-blue-700 shadow-sm': 'text-gray-600 hover:text-gray-900'}`}
            >
              {item.label}
            </button>))}
      </div>

      <div className="relative">
        <DatePicker
          ref={datePickerRef}
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat={getDateFormat()}
          locale={vi}
          maxDate={new Date()}
          className="w-28 px-2 pr-9 py-1 text-xs font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center custom-datepicker-input"popperClassName="custom-datepicker-popper"wrapperClassName="w-auto"popperPlacement="bottom-start"{...pickerProps}
        />

        <button
          type="button"onClick={openDatePicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5"fill="none"stroke="currentColor"viewBox="0 0 24 24">
            <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>

      {/* HIỂN THỊ ĐẦY ĐỦ – KHÔNG BAO GIỜ MẤT NGÀY */}
      <span className="text-xs font-semibold text-gray-800 min-w-max max-w-[220px] truncate timefilter-fulltext">
        {fullDisplayText}
      </span>

      <button
        onClick={() =>onDateChange(new Date())}
        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer">
        {t('time.todayButton')}
      </button>
    </div>);
}