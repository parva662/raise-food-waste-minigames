import { CANTEEN_CONFIG } from '../config/canteen';

const OPERATIONAL_TIMEZONE = CANTEEN_CONFIG.timezone;

const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: OPERATIONAL_TIMEZONE,
};

const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: OPERATIONAL_TIMEZONE,
};

function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** e.g. Monday, 27 July 2026 */
export function formatServiceDateLong(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', LONG_DATE_FORMAT).format(calendarUtcInstant(isoDate));
}

/** Concise label for selectors, e.g. Mon, 27 Jul */
export function formatServiceDateShort(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', SHORT_DATE_FORMAT).format(calendarUtcInstant(isoDate));
}
