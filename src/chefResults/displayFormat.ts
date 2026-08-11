const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

const SHORT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

function parseServiceDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

/** e.g. Monday, 27 July 2026 */
export function formatServiceDateLong(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', LONG_DATE_FORMAT).format(parseServiceDate(isoDate));
}

/** Concise label for selectors, e.g. Mon, 27 Jul */
export function formatServiceDateShort(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', SHORT_DATE_FORMAT).format(parseServiceDate(isoDate));
}
