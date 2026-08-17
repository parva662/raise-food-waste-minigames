import { getTodayIsoDate } from '../utils/dates';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Development-only `?date=YYYY-MM-DD` on `#/service-closeout?date=…`. */
export function parseCloseoutDevDateOverride(): string | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;

  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return null;

  const date = new URLSearchParams(hash.slice(queryIndex + 1)).get('date');
  if (!date || !ISO_DATE_PATTERN.test(date)) return null;
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
