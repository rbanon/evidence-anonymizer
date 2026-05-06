import { format, parseISO } from 'date-fns';

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

export function getDateKey(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy-MM-dd');
  } catch {
    return dateStr.slice(0, 10);
  }
}
