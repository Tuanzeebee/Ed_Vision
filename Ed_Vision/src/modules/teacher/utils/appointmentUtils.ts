type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'success') {
  // This will be handled by a toast component in the main component
  const event = new CustomEvent('show-toast', {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('vi-VN', options);
}

export function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMaxDateString(daysFromNow: number): string {
  return getDateString(daysFromNow);
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const start = new Date(`2000-01-01T${startTime}`);
  start.setMinutes(start.getMinutes() + durationMinutes);
  return start.toTimeString().slice(0, 5);
}

export function isTimeSlotOverlapping(
  newStart: string,
  newEnd: string,
  existingSlots: { start: string; end: string }[]
): boolean {
  return existingSlots.some(
    (slot) =>
      (newStart >= slot.start && newStart < slot.end) ||
      (newEnd > slot.start && newEnd <= slot.end) ||
      (newStart <= slot.start && newEnd >= slot.end)
  );
}