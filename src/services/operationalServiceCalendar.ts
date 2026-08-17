import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CANTEEN_CONFIG } from '../config/canteen';
import { addDaysToIsoDate, getOperationalDateIso } from '../utils/dates';
import { resolveMenuForDate } from './menuResolver';

const MAX_CALENDAR_STEPS = 366;

export class OperationalCalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationalCalendarError';
  }
}

type ServiceDayClassification =
  | { kind: 'service'; isoDate: string }
  | { kind: 'skip' }
  | { kind: 'unavailable'; isoDate: string };

function isWeekend(isoDate: string): boolean {
  const zoned = toZonedTime(parseISO(isoDate), CANTEEN_CONFIG.timezone);
  const dayIndex = zoned.getDay();
  return dayIndex === 0 || dayIndex === 6;
}

function classifyOperationalDate(isoDate: string): ServiceDayClassification {
  if (isWeekend(isoDate)) {
    return { kind: 'skip' };
  }

  const menu = resolveMenuForDate(isoDate);
  if (menu.status === 'available') {
    return { kind: 'service', isoDate };
  }
  if (menu.status === 'closed') {
    return { kind: 'skip' };
  }

  return { kind: 'unavailable', isoDate };
}

function stepCalendarDate(isoDate: string, direction: 1 | -1): string {
  return addDaysToIsoDate(isoDate, direction);
}

/**
 * Next BarLaurea service date after the given operational calendar date.
 * Skips weekends and explicitly closed days; fails on weekday unavailable menus.
 */
export function resolveNextServiceDate(fromIsoDate: string): string {
  let candidate = stepCalendarDate(fromIsoDate, 1);

  for (let step = 0; step < MAX_CALENDAR_STEPS; step += 1) {
    const classification = classifyOperationalDate(candidate);
    if (classification.kind === 'service') {
      return classification.isoDate;
    }
    if (classification.kind === 'unavailable') {
      throw new OperationalCalendarError(
        `Menu unavailable for operational date ${classification.isoDate}; cannot resolve next service date.`,
      );
    }
    candidate = stepCalendarDate(candidate, 1);
  }

  throw new OperationalCalendarError(
    `Could not resolve next service date after ${fromIsoDate} within ${MAX_CALENDAR_STEPS} days.`,
  );
}

/**
 * Previous BarLaurea operational day before the given service date.
 * Skips weekends and explicitly closed days; fails on weekday unavailable menus.
 */
export function resolvePreviousOperationalDay(serviceDate: string): string {
  let candidate = stepCalendarDate(serviceDate, -1);

  for (let step = 0; step < MAX_CALENDAR_STEPS; step += 1) {
    const classification = classifyOperationalDate(candidate);
    if (classification.kind === 'service') {
      return classification.isoDate;
    }
    if (classification.kind === 'unavailable') {
      throw new OperationalCalendarError(
        `Menu unavailable for operational date ${classification.isoDate}; cannot resolve previous operational day.`,
      );
    }
    candidate = stepCalendarDate(candidate, -1);
  }

  throw new OperationalCalendarError(
    `Could not resolve previous operational day before ${serviceDate} within ${MAX_CALENDAR_STEPS} days.`,
  );
}

/** Chef forecast target date from the current Helsinki operational day. */
export function resolveChefForecastServiceDate(now: Date = new Date()): string {
  return resolveNextServiceDate(getOperationalDateIso(now));
}
