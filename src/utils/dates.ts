import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy · HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatDateGroup(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, dd MMMM yyyy');
  } catch {
    return dateStr;
  }
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isInRange(dateStr: string, from: string, to: string): boolean {
  try {
    const date = parseISO(dateStr);
    const start = startOfDay(parseISO(from));
    const end = endOfDay(parseISO(to));
    return isWithinInterval(date, { start, end });
  } catch {
    return false;
  }
}

export function getDateKey(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr.slice(0, 10);
  }
}
