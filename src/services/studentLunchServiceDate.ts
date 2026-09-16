import { addDaysToIsoDate, getOperationalDateIso } from '../utils/dates';
import { isOperationalServiceDay } from './operationalServiceCalendar';

const MAX_CALENDAR_STEPS = 366;

export class StudentLunchCalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentLunchCalendarError';
  }
}

/**
 * Next operational lunch service after the Helsinki operational calendar day of `now`.
 */
export function resolveStudentLunchServiceDate(now: Date = new Date()): string {
  const today = getOperationalDateIso(now);
  let candidate = addDaysToIsoDate(today, 1);

  for (let step = 0; step < MAX_CALENDAR_STEPS; step += 1) {
    if (isOperationalServiceDay(candidate)) {
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
