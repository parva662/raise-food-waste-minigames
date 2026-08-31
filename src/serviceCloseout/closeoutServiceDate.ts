import { getTodayIsoDate, OPERATIONAL_TIMEZONE } from '../utils/dates';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SERVICE_CLOSEOUT_HASH_PREFIX = '#/service-closeout';
const GAMEBUS_DEBUG_PARAM = 'gamebusDebug';
const TEST_SERVICE_DATE_PARAM = 'testServiceDate';

function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function hashQueryParamsForServiceCloseout(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (!hash.startsWith(SERVICE_CLOSEOUT_HASH_PREFIX)) return null;

  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;

  return new URLSearchParams(hash.slice(queryIndex + 1));
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

/** Debug-only `?testServiceDate=YYYY-MM-DD` when `#/service-closeout?gamebusDebug=1`. */
export function parseCloseoutTestServiceDateOverride(): string | null {
  const params = hashQueryParamsForServiceCloseout();
  if (!params) return null;
  if (params.get(GAMEBUS_DEBUG_PARAM) !== '1') return null;

  const date = params.get(TEST_SERVICE_DATE_PARAM);
  if (!date || !isValidIsoDate(date)) return null;
  return date;
}

export function resolveServiceCloseoutRouteServiceDate(): string | undefined {
  return parseCloseoutTestServiceDateOverride() ?? undefined;
}

export function isCloseoutTestServiceDateOverrideActive(resolvedServiceDate: string): boolean {
  const override = parseCloseoutTestServiceDateOverride();
  return override !== null && override === resolvedServiceDate;
}

export function formatCloseoutTestServiceDateLabel(isoDate: string): string {
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
