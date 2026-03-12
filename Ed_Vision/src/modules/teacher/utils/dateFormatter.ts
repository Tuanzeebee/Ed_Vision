export function formatFullDate(date: Date, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  // Use Intl directly; callers may memoize or reuse if needed for performance
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (e) {
    // Fallback to a simple ISO-like readable format
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export default formatFullDate;
