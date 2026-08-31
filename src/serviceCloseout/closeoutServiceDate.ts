import { getTodayIsoDate, OPERATIONAL_TIMEZONE } from '../utils/dates';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Temporary fixed service date for one-time live GameBus validation. Remove after test. */
export const SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE = '2026-09-01' as const;

function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function isValidIsoDate(date: string): boolean {
  if (!ISO_DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Fixed service date passed from AppRouter during live validation. */
export function getServiceCloseoutRouteServiceDate(): string {
  return SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE;
}

export function isServiceCloseoutLiveTestServiceDateActive(resolvedServiceDate: string): boolean {
  return resolvedServiceDate === SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE;
}

export function formatCloseoutServiceDateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(calendarUtcInstant(isoDate));
}

/** Development-only `?date=YYYY-MM-DD` on `#/service-closeout?date=…`. */
export function parseCloseoutDevDateOverride(): string | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;

  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;

  const date = new URLSearchParams(hash.slice(queryIndex + 1)).get('date');
  if (!date || !isValidIsoDate(date)) return null;
  return date;
}

export function resolveCloseoutServiceDate(explicitServiceDate?: string, now?: Date): string {
  if (explicitServiceDate) return explicitServiceDate;
  const devOverride = parseCloseoutDevDateOverride();
  if (devOverride) return devOverride;
  return getTodayIsoDate(now);
}

export function isCloseoutDevDateOverrideActive(resolvedServiceDate: string): boolean {
  const devOverride = parseCloseoutDevDateOverride();
  return import.meta.env.DEV && devOverride !== null && devOverride === resolvedServiceDate;
}
