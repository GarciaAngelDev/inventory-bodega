import { formatInTimeZone } from 'date-fns-tz';

/**
 * Formats a Date object in the Venezuela (America/Caracas) timezone.
 * @param date - The Date instance (assumed to be UTC).
 * @param pattern - date-fns format string, e.g. 'dd/MM/yyyy HH:mm'.
 */
export function fmtVET(date: Date, pattern: string): string {
  return formatInTimeZone(date, 'America/Caracas', pattern);
}
