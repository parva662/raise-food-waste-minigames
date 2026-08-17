import { describe, expect, it } from 'vitest';
import {
  OPERATIONAL_TIMEZONE,
  addDaysToIsoDate,
  formatDisplayDate,
  formatOperationalTime,
  formatSubmissionTime,
  getOperationalDateIso,
  getOperationalTomorrowDateIso,
  getTodayIsoDate,
  getTomorrowIsoDate,
} from './dates';
import { resolveCloseoutServiceDate } from '../serviceCloseout/closeoutServiceDate';
import { helsinki } from '../test/fixtures/dates';
import { getSubmissionPhase } from '../services/submissionWindow';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from '../test/fixtures/dates';

describe('operational dates (Europe/Helsinki)', () => {
  it('resolves today from Helsinki calendar, not browser-local assumptions', () => {
    const instant = new Date('2026-08-17T21:30:00Z');
    expect(getOperationalDateIso(instant)).toBe('2026-08-18');
    expect(getTodayIsoDate(instant)).toBe('2026-08-18');
  });

  it('resolves tomorrow from Helsinki calendar', () => {
    const helsinkiMidday = helsinki('2026-08-17', '12:00:00');
    expect(getOperationalTomorrowDateIso(helsinkiMidday)).toBe('2026-08-18');
    expect(getTomorrowIsoDate(helsinkiMidday)).toBe('2026-08-18');
  });

  it('resolves service closeout to Helsinki today near UTC midnight', () => {
    const instant = new Date('2026-08-17T21:30:00Z');
    expect(resolveCloseoutServiceDate(undefined, instant)).toBe('2026-08-18');
  });

  it('targets chef forecast to Helsinki tomorrow', () => {
    const helsinkiMidday = helsinki('2026-08-17', '12:00:00');
    expect(getTomorrowIsoDate(helsinkiMidday)).toBe('2026-08-18');
  });

  it('targets student declaration to Helsinki tomorrow', () => {
    const helsinkiEvening = helsinki('2026-07-28', '20:00:00');
    expect(getTomorrowIsoDate(helsinkiEvening)).toBe('2026-07-29');
  });

  it('advances calendar dates without browser-local setDate', () => {
    expect(addDaysToIsoDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles daylight saving via timezone library, not fixed offsets', () => {
    const winterNoon = helsinki('2026-01-15', '12:00:00');
    const summerNoon = helsinki('2026-08-15', '12:00:00');
    expect(winterNoon.toISOString()).not.toBe(summerNoon.toISOString());
    expect(getOperationalDateIso(winterNoon)).toBe('2026-01-15');
    expect(getOperationalDateIso(summerNoon)).toBe('2026-08-15');
    expect(OPERATIONAL_TIMEZONE).toBe('Europe/Helsinki');
  });

  it('formats date-only values without shifting by one day', () => {
    expect(formatDisplayDate('2026-08-18')).toBe('Tuesday, 18 August 2026');
    expect(formatDisplayDate('2026-07-27')).toBe('Monday, 27 July 2026');
  });

  it('formats operational time in Helsinki while keeping ISO instants unchanged', () => {
    const submittedAt = '2026-07-28T15:30:00.000Z';
    expect(new Date(submittedAt).toISOString()).toBe(submittedAt);
    expect(formatSubmissionTime(submittedAt)).toBe(formatOperationalTime(submittedAt));
    expect(formatOperationalTime(submittedAt)).toBe('18:30');
  });

  it('preserves existing submission-window Helsinki behavior', () => {
    expect(getSubmissionPhase(SUBMISSION_TIMES.onTimeExact, FIXTURE_LUNCH_DATE)).toBe('on-time');
    expect(getSubmissionPhase(SUBMISSION_TIMES.closedJustAfter, FIXTURE_LUNCH_DATE)).toBe(
      'closed',
    );
  });
});
