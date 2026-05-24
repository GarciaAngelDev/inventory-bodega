import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Formats a Date object in the Venezuela (America/Caracas) timezone.
 */
export function fmtVET(date: Date, pattern: string): string {
  return formatInTimeZone(date, 'America/Caracas', pattern);
}

/**
 * Returns the UTC start and end of a given date interpreted in Venezuela timezone.
 * Useful for DB queries that store timestamps in UTC while respecting VET day boundaries.
 */
export function getVETDayBounds(date: Date) {
  const zoned = toZonedTime(date, 'America/Caracas');
  const start = fromZonedTime(startOfDay(zoned), 'America/Caracas');
  const end = fromZonedTime(endOfDay(zoned), 'America/Caracas');
  return { start, end };
}

