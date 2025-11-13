import React, { useState } from 'react';
import {
  getWeekByOffset,
  getDatesInWeek,
  formatDateForAPI,
  getDayName,
  isCurrentWeek,
  isPastWeek,
} from '../lib/weekUtils';

const WeekNavigationDemo: React.FC = () => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const currentWeek = getWeekByOffset(currentWeekOffset);

  const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
  const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Week Navigation Demo</h2>
      
      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ← Tuần trước
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">{currentWeek.displayText}</div>
            <div className="text-sm text-gray-600">
              {isCurrentWeek(currentWeek) ? 'Tuần hiện tại' : 
               isPastWeek(currentWeek) ? 'Tuần đã qua' : 'Tuần sắp tới'}
            </div>
            <div className="text-xs text-gray-500">
              Offset: {currentWeekOffset} | Week #{currentWeek.weekNumber}/{currentWeek.year}
            </div>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tuần sau →
          </button>
        </div>
        
        {/* Go to current week button */}
        {!isCurrentWeek(currentWeek) && (
          <div className="text-center">
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Về tuần hiện tại
            </button>
          </div>
        )}
      </div>

      {/* Days in Week */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Các ngày trong tuần</h3>
        <div className="grid grid-cols-7 gap-2">
          {getDatesInWeek(currentWeek).map((date, index) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();
            const isPast = date < today;
            
            return (
              <div
                key={index}
                className={`p-3 border-2 rounded-lg text-center ${
                  isToday ? 'border-blue-500 bg-blue-50' :
                  isPast ? 'border-gray-200 bg-gray-50 text-gray-500' :
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="text-xs font-medium text-gray-600">
                  {getDayName(date.getDay())}
                </div>
                <div className={`text-lg font-bold ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                  {date.getDate().toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-500">
                  Th{date.getMonth() + 1}
                </div>
                <div className="text-xs mt-1">
                  {formatDateForAPI(date)}
                </div>
                {isToday && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    Hôm nay
                  </div>
                )}
                {isPast && (
                  <div className="text-xs text-gray-400 mt-1">
                    Đã qua
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* API Date Range */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h3 className="text-lg font-semibold mb-2">API Date Range</h3>
        <div className="text-sm">
          <div><strong>Start Date:</strong> {formatDateForAPI(currentWeek.startDate)}</div>
          <div><strong>End Date:</strong> {formatDateForAPI(currentWeek.endDate)}</div>
          <div className="mt-2 text-gray-600">
            Sử dụng range này để gọi <code>fetchWeeklyAvailability(startDate, endDate)</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekNavigationDemo;