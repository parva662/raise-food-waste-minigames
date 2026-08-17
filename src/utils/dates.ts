import { addDays, format, parse } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';

export const OPERATIONAL_TIMEZONE = CANTEEN_CONFIG.timezone;

/** Calendar components for the current operational day in Europe/Helsinki. */
export function getOperationalDateParts(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const zoned = toZonedTime(now, OPERATIONAL_TIMEZONE);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
  };
}

/** YYYY-MM-DD for the current operational day in Europe/Helsinki. */
export function getOperationalDateIso(now: Date = new Date()): string {
  const zoned = toZonedTime(now, OPERATIONAL_TIMEZONE);
  return format(zoned, 'yyyy-MM-dd');
}

/** Advance a date-only ISO string by calendar days (timezone-neutral). */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const parsed = parse(isoDate, 'yyyy-MM-dd', new Date());
  return format(addDays(parsed, days), 'yyyy-MM-dd');
}

/** YYYY-MM-DD for the next operational day in Europe/Helsinki. */
export function getOperationalTomorrowDateIso(now: Date = new Date()): string {
  return addDaysToIsoDate(getOperationalDateIso(now), 1);
}

export function getTodayIsoDate(now?: Date): string {
  return getOperationalDateIso(now ?? new Date());
}

export function getTomorrowIsoDate(now?: Date): string {
  return getOperationalTomorrowDateIso(now ?? new Date());
}

/** UTC noon anchor so date-only values format without shifting across timezones. */
function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** Long weekday label for a date-only operational ISO value. */
export function formatOperationalDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(calendarUtcInstant(isoDate));
}

export function formatDisplayDate(isoDate: string): string {
  return formatOperationalDate(isoDate);
}

/** HH:mm for an absolute instant, shown in Europe/Helsinki. */
export function formatOperationalTime(isoInstant: string | Date): string {
  const date = typeof isoInstant === 'string' ? new Date(isoInstant) : isoInstant;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(date);
}

export function formatSubmissionTime(isoTimestamp: string): string {
  return formatOperationalTime(isoTimestamp);
}
