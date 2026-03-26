import { formatFullDate } from './dateFormatter';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'success') {
  // This will be handled by a toast component in the main component
  const event = new CustomEvent('show-toast', {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}

export function formatDate(input: string | Date | null | undefined, locale?: string): string {
  // Accept Date or string inputs. Be robust against various backend formats.
  if (!input) return '';

  let date: Date;
  if (input instanceof Date) {
    date = input;
  } else {
    // Try native parsing first (handles ISO, full datetime, browser-parsable strings)
    date = new Date(input);

    // If invalid, try common fallbacks: YYYY-MM-DD or YYYY/MM/DD extraction
    if (isNaN(date.getTime())) {
      if (typeof input === 'string') {
        // Try explicit YYYY-MM-DD or YYYY/MM/DD
        const m = input.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (m) {
          const y = Number(m[1]);
          const mo = Number(m[2]);
          const d = Number(m[3]);
          date = new Date(y, mo - 1, d);
        } else {
          // Try to extract an ISO date substring (e.g., from "December 19, 2025 at 07:13 PM")
          const iso = input.match(/(\d{4}-\d{2}-\d{2})/);
          if (iso) {
            date = new Date(iso[1]);
          }
        }
      }
    }
  }

  if (!date || isNaN(date.getTime())) {
    // Invalid/unparseable date — fail-safe empty string
    // Avoid returning 'NaN/NaN/NaN' in UI
    // Caller components can choose to render a localized 'undetermined' label instead
    // Keep a console warning to aid debugging in dev
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('formatDate: invalid date input', input);
    }
    return '';
  }

  const resolvedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'vi-VN');
  return formatFullDate(date, resolvedLocale || 'vi-VN');
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