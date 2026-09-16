import { parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import { isBeforeChefWindowSwitch } from './chefForecastWindow';
import { addDaysToIsoDate, getOperationalDateIso } from '../utils/dates';
import { isExplicitlyClosedServiceDate } from './menuResolver';

const MAX_CALENDAR_STEPS = 366;
const OPERATIONAL_TIMEZONE = CANTEEN_CONFIG.timezone;

export class OperationalCalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationalCalendarError';
  }
}

function isWeekend(isoDate: string): boolean {
  const zoned = toZonedTime(parseISO(isoDate), OPERATIONAL_TIMEZONE);
  const dayIndex = zoned.getDay();
  return dayIndex === 0 || dayIndex === 6;
}

/**
 * Operational service day: a weekday that is not explicitly configured as closed.
 * Menu availability is a separate concern — a weekday whose menu data is missing is
 * still an operational service day, it just cannot show a menu.
 */
export function isOperationalServiceDay(isoDate: string): boolean {
  return !isWeekend(isoDate) && !isExplicitlyClosedServiceDate(isoDate);
}

function stepCalendarDate(isoDate: string, direction: 1 | -1): string {
  return addDaysToIsoDate(isoDate, direction);
}

function resolveServiceDate(fromIsoDate: string, direction: 1 | -1, label: string): string {
  let candidate = stepCalendarDate(fromIsoDate, direction);

  for (let step = 0; step < MAX_CALENDAR_STEPS; step += 1) {
    if (isOperationalServiceDay(candidate)) {
      return candidate;
    }
    candidate = stepCalendarDate(candidate, direction);
  }

  throw new OperationalCalendarError(
    `Could not resolve ${label} for ${fromIsoDate} within ${MAX_CALENDAR_STEPS} days.`,
  );
}

/**
 * Next BarLaurea service date after the given operational calendar date.
 * Skips weekends and explicitly closed days only.
 */
export function resolveNextServiceDate(fromIsoDate: string): string {
  return resolveServiceDate(fromIsoDate, 1, 'next service date');
}

/**
 * Previous BarLaurea operational day before the given service date.
 * Skips weekends and explicitly closed days only.
 */
export function resolvePreviousOperationalDay(serviceDate: string): string {
  return resolveServiceDate(serviceDate, -1, 'previous operational day');
}

/**
 * Kitchen forecast target date when the page is opened (Helsinki operational day).
 * Before 08:30 the target is today's own service; from 08:30 it is the next operational
 * service. Whether entry is actually open is a separate question — see the submission window.
 */
export function resolveChefForecastServiceDate(now: Date = new Date()): string {
  const today = getOperationalDateIso(now);

  if (isOperationalServiceDay(today) && isBeforeChefWindowSwitch(now)) {
    return today;
  }

  return resolveNextServiceDate(today);
}

/**
 * Kitchen Results participant dashboard calendar date (Europe/Helsinki).
 *
 * This is the current Helsinki calendar day. It rolls at exactly 00:00:00 Helsinki and
 * does NOT follow the Kitchen Forecast 08:30 target-date switch.
 *
 * Whether that calendar day is an operational service day is a separate question —
 * see {@link isOperationalServiceDay}.
 */
export function resolveChefResultsServiceDate(now: Date = new Date()): string {
  return getOperationalDateIso(now);
}

/** Instant of the next Europe/Helsinki local midnight after `now`. */
export function getNextHelsinkiMidnightInstant(now: Date = new Date()): Date {
  const today = getOperationalDateIso(now);
  const tomorrow = addDaysToIsoDate(today, 1);
  return fromZonedTime(`${tomorrow} 00:00:00.000`, OPERATIONAL_TIMEZONE);
}

/** Milliseconds until the next Europe/Helsinki local midnight (never negative). */
export function msUntilNextHelsinkiMidnight(now: Date = new Date()): number {
  return Math.max(0, getNextHelsinkiMidnightInstant(now).getTime() - now.getTime());
}
