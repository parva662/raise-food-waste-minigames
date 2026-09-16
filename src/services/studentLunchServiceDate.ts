import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import { addDaysToIsoDate, getOperationalDateIso } from '../utils/dates';
import { resolveMenuForDate } from './menuResolver';

const MAX_CALENDAR_STEPS = 366;

export class StudentLunchCalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentLunchCalendarError';
  }
}

function isWeekend(isoDate: string): boolean {
  const zoned = toZonedTime(parseISO(isoDate), CANTEEN_CONFIG.timezone);
  const dayIndex = zoned.getDay();
  return dayIndex === 0 || dayIndex === 6;
}

/**
 * Student Lunch operational service day:
 * skip weekends and explicitly closed / non-service days.
 * Does NOT skip a weekday merely because menu data is unavailable.
 */
function isStudentOperationalServiceDay(isoDate: string): boolean {
  if (isWeekend(isoDate)) {
    return false;
  }
  const menu = resolveMenuForDate(isoDate);
  if (menu.status === 'closed') {
    return false;
  }
  return true;
}

/**
 * Next operational lunch service after the Helsinki operational calendar day of `now`.
 */
export function resolveStudentLunchServiceDate(now: Date = new Date()): string {
  const today = getOperationalDateIso(now);
  let candidate = addDaysToIsoDate(today, 1);

  for (let step = 0; step < MAX_CALENDAR_STEPS; step += 1) {
    if (isStudentOperationalServiceDay(candidate)) {
      return candidate;
    }
    candidate = addDaysToIsoDate(candidate, 1);
  }

  throw new StudentLunchCalendarError(
    `Could not resolve next Student Lunch service date after ${today} within ${MAX_CALENDAR_STEPS} days.`,
  );
}

export function tryResolveStudentLunchServiceDate(
  now: Date = new Date(),
): { ok: true; lunchDate: string } | { ok: false; reason: string } {
  try {
    return { ok: true, lunchDate: resolveStudentLunchServiceDate(now) };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'calendar_unresolved',
    };
  }
}
