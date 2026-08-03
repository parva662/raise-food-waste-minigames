import { fromZonedTime } from 'date-fns-tz';

/** Lunch date used across submission and declaration tests (Wednesday in runtime menu). */
export const FIXTURE_LUNCH_DATE = '2026-07-29';

/** Submission day is the calendar day before the lunch date. */
export const FIXTURE_SUBMISSION_DAY = '2026-07-28';

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

/** Known dates for generated Excel menu tests (runtime-shifted calendar). */
export const MENU_DATES = {
  runtimeMonday: '2026-07-27',
  runtimeTuesday: '2026-07-28',
  runtimeWednesday: '2026-07-29',
  runtimeThursday: '2026-07-30',
  runtimeFriday: '2026-07-31',
  missingFromWorkbook: '2026-01-07',
  closedWorkbookDay: '2026-09-25',
  beforeRange: '2026-07-26',
  afterRange: '2026-11-21',
  weekend: '2026-08-01',
  closedOverride: '2026-08-17',
  replaceOverride: '2026-09-15',
  replaceOverrideNormalDay: '2026-09-14',
  replaceOverrideAfterDay: '2026-09-16',
} as const;

/** Original workbook dates (pre-shift), for pipeline tests. */
export const WORKBOOK_DATES = {
  first: '2026-02-02',
  secondWeekday: '2026-02-03',
  last: '2026-05-29',
} as const;

export function fixedClock(isoInstant: string): () => Date {
  return () => new Date(isoInstant);
}
