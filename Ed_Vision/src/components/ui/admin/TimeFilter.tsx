interface TimeFilterProps {
  value: string;
  onChange: (value: string) => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export default function TimeFilter({ value, onChange, selectedYear, onYearChange }: TimeFilterProps) {
  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center space-x-2">
      {/* Navigation Arrows */}
      <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
        <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-l-md transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-r-md transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Today Button */}
      <button 
        onClick={() => onChange('hôm-nay')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          value === 'hôm-nay'
            ? 'bg-green-500 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        Hôm nay
      </button>
      
      {/* Time Period Buttons */}
      <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
        {[
          { value: 'tuần-này', label: 'Tuần' },
          { value: 'tháng-này', label: 'Tháng' },
          { value: 'tất-cả', label: 'Tất cả' }
        ].map((period, index) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`px-2 py-1 text-xs font-medium transition-colors ${
              index === 0 ? 'rounded-l-md' : ''
            } ${
              index === 2 ? 'rounded-r-md' : ''
            } ${
              value === period.value
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
      
      {/* Year Selector */}
      {selectedYear !== undefined && onYearChange && (
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="px-2 py-1 text-xs font-medium bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year === currentYear ? 'Hiện tại' : year}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
