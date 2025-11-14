/**
 * Utility functions for week calculations
 */

export interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  year: number;
  displayText: string;
}

/**
 * Get the start of week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the end of week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get week info for a given date
 */
export function getWeekInfo(date: Date): WeekInfo {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  
  // Calculate week number (ISO 8601 standard)
  const yearStart = new Date(weekStart.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((weekStart.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  
  const displayText = `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
  
  return {
    weekNumber,
    startDate: weekStart,
    endDate: weekEnd,
    year: weekStart.getFullYear(),
    displayText
  };
}

/**
 * Get current week info
 */
export function getCurrentWeek(): WeekInfo {
  return getWeekInfo(new Date());
}

/**
 * Get next week info
 */
export function getNextWeek(currentWeek?: WeekInfo): WeekInfo {
  const baseDate = currentWeek ? currentWeek.startDate : new Date();
  const nextWeekDate = new Date(baseDate);
  nextWeekDate.setDate(baseDate.getDate() + 7);
  return getWeekInfo(nextWeekDate);
}

/**
 * Get previous week info
 */
export function getPreviousWeek(currentWeek?: WeekInfo): WeekInfo {
  const baseDate = currentWeek ? currentWeek.startDate : new Date();
  const prevWeekDate = new Date(baseDate);
  prevWeekDate.setDate(baseDate.getDate() - 7);
  return getWeekInfo(prevWeekDate);
}

/**
 * Get week info by offset from current week
 * @param weekOffset - Number of weeks to offset (positive for future, negative for past)
 */
export function getWeekByOffset(weekOffset: number): WeekInfo {
  const currentDate = new Date();
  const targetDate = new Date(currentDate);
  targetDate.setDate(currentDate.getDate() + (weekOffset * 7));
  return getWeekInfo(targetDate);
}

/**
 * Get all dates in a week (Monday to Sunday)
 */
export function getDatesInWeek(weekInfo: WeekInfo): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekInfo.startDate);
    date.setDate(weekInfo.startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Format date as "dd/MM"
 */
export function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Format date as "YYYY-MM-DD" (for API calls)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get day name in Vietnamese
 */
export function getDayName(dayIndex: number): string {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dayIndex];
}

/**
 * Check if a week contains today
 */
export function isCurrentWeek(weekInfo: WeekInfo): boolean {
  const today = new Date();
  return today >= weekInfo.startDate && today <= weekInfo.endDate;
}

/**
 * Check if a week is in the past
 */
export function isPastWeek(weekInfo: WeekInfo): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return weekInfo.endDate < today;
}

/**
 * Check if a week is in the future
 */
export function isFutureWeek(weekInfo: WeekInfo): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return weekInfo.startDate > today;
}