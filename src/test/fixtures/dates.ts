import { fromZonedTime } from 'date-fns-tz';

/** Lunch date used across submission and declaration tests (Wednesday, Week 1). */
export const FIXTURE_LUNCH_DATE = '2026-01-07';

/** Submission day is the calendar day before the lunch date. */
export const FIXTURE_SUBMISSION_DAY = '2026-01-06';

export function helsinki(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, 'Europe/Helsinki');
}

export const SUBMISSION_TIMES = {
  onTimeEarly: helsinki(FIXTURE_SUBMISSION_DAY, '17:59:59'),
  onTimeExact: helsinki(FIXTURE_SUBMISSION_DAY, '18:00:00'),
  lateJustAfter: helsinki(FIXTURE_SUBMISSION_DAY, '18:00:01'),
  lateBeforeDeadline: helsinki(FIXTURE_SUBMISSION_DAY, '22:59:59'),
  lateExact: helsinki(FIXTURE_SUBMISSION_DAY, '23:00:00'),
  closedJustAfter: helsinki(FIXTURE_SUBMISSION_DAY, '23:00:01'),
  midday: helsinki(FIXTURE_SUBMISSION_DAY, '12:00:00'),
  lateEvening: helsinki(FIXTURE_SUBMISSION_DAY, '19:00:00'),
} as const;

/**
 * Known rotation dates derived from menuCycleStartDate 2026-01-06 (Week 1 Tuesday).
 * Weekday labels match the actual calendar weekday for each ISO date.
 */
export const ROTATION_DATES = {
  cycleStartTuesday: '2026-01-06',
  week1Monday: '2026-01-12',
  week1Friday: '2026-01-09',
  week2Monday: '2026-01-19',
  week3Monday: '2026-01-26',
  week4Monday: '2026-02-02',
  week4Tuesday: '2026-01-27',
  week5Wednesday: '2026-02-04',
  week6Thursday: '2026-02-12',
  monthBoundaryFriday: '2026-01-30',
  yearBoundaryWeekday: '2026-12-30',
  beforeValidity: '2025-12-31',
  afterValidity: '2027-01-01',
  closedOverride: '2026-02-23',
  replaceOverride: '2026-03-15',
  replaceOverrideNormalDay: '2026-03-13',
  replaceOverrideAfterDay: '2026-03-16',
} as const;

export function fixedClock(isoInstant: string): () => Date {
  return () => new Date(isoInstant);
}
