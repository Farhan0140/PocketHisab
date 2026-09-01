/** Returns today's date as a YYYY-MM-DD string (the shape the backend expects). */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "Today" / "Yesterday" / "28 Aug" — used as the group header in the History list. */
export function formatDateGroupLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns the [start_date, end_date] (both inclusive, YYYY-MM-DD) covering the given period. */
export function getPeriodRange(period: 'day' | 'month' | 'year'): { start_date: string; end_date: string } {
  const now = new Date();
  if (period === 'day') {
    const today = toDateString(now);
    return { start_date: today, end_date: today };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start_date: toDateString(start), end_date: toDateString(end) };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return { start_date: toDateString(start), end_date: toDateString(end) };
}

/** "2:45 PM" for the small timestamp under a transaction note. */
export function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "28 Aug 2026" for due dates on debts. */
export function formatFullDate(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
