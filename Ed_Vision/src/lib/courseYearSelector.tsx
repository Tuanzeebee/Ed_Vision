/**
 * Course Year Selector Component
 * Automatically generates course years (K28, K29, K30, K31, etc.)
 * New course year is added automatically in October each year
 */

import { getAvailableCourseYears } from './courseYearUtils';

interface CourseYearSelectorProps {
  value: string;
  onChange: (value: string) =>void;
  className?: string;
}

export default function CourseYearSelector({ value, onChange, className = ""}: CourseYearSelectorProps) {
  const courseYears = getAvailableCourseYears();
  
  return (
    <select 
      value={value}
      onChange={(e) =>onChange(e.target.value)}
      className={className || "w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"}
    >
      <option value="Tất cả khóa">Tất cả khóa</option>
      {courseYears.map((courseYear) =>(
        <option key={courseYear} value={courseYear}>
          {courseYear}
        </option>))}
    </select>);
}
