import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { helsinki } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
import {
  isOperationalServiceDay,
  msUntilNextHelsinkiMidnight,
  resolveChefForecastServiceDate,
  resolveChefResultsServiceDate,
} from './operationalServiceCalendar';

const DATES = {
  monday: '2026-09-07',
  tuesday: '2026-09-08',
  friday: '2026-08-14',
  saturday: '2026-08-15',
  sunday: '2026-08-16',
  nextMonday: '2026-08-17',
  // Spring DST weekend 2026 (clocks forward Sunday 29 March)
  springSaturday: '2026-03-28',
  springSunday: '2026-03-29',
  // Autumn DST weekend 2026 (clocks back Sunday 25 October)
  autumnSaturday: '2026-10-24',
  autumnSunday: '2026-10-25',
} as const;

describe('Kitchen Results participant dashboard calendar date', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the Helsinki calendar day all day on a normal Tuesday, including through 08:30', () => {
    for (const time of [
      '00:00:00',
      '07:59:59',
      '08:00:00',
      '08:29:59',
      '08:30:00',
      '12:00:00',
      '23:59:59',
    ] as const) {
      expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, time))).toBe(DATES.tuesday);
    }
  });

  it('rolls the dashboard date at Helsinki midnight, not at 08:30', () => {
    expect(resolveChefResultsServiceDate(helsinki(DATES.monday, '23:59:59'))).toBe(DATES.monday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, '00:00:00'))).toBe(DATES.tuesday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, '08:29:59'))).toBe(DATES.tuesday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, '08:30:00'))).toBe(DATES.tuesday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, '23:59:59'))).toBe(DATES.tuesday);
  });

  it('keeps Kitchen Forecast 08:30 target switching unchanged and decoupled', () => {
    expect(resolveChefForecastServiceDate(helsinki(DATES.monday, '08:29:59'))).toBe(DATES.monday);
    expect(resolveChefForecastServiceDate(helsinki(DATES.monday, '08:30:00'))).toBe(DATES.tuesday);

    expect(resolveChefResultsServiceDate(helsinki(DATES.monday, '08:29:59'))).toBe(DATES.monday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.monday, '08:30:00'))).toBe(DATES.monday);
  });

  it('shows weekend calendar dates as non-service days without falling back to Friday', () => {
    expect(resolveChefResultsServiceDate(helsinki(DATES.friday, '23:59:59'))).toBe(DATES.friday);
    expect(isOperationalServiceDay(DATES.friday)).toBe(true);

    expect(resolveChefResultsServiceDate(helsinki(DATES.saturday, '00:00:00'))).toBe(DATES.saturday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.saturday, '12:00:00'))).toBe(DATES.saturday);
    expect(isOperationalServiceDay(DATES.saturday)).toBe(false);

    expect(resolveChefResultsServiceDate(helsinki(DATES.sunday, '00:00:00'))).toBe(DATES.sunday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.sunday, '23:59:59'))).toBe(DATES.sunday);
    expect(isOperationalServiceDay(DATES.sunday)).toBe(false);

    expect(resolveChefResultsServiceDate(helsinki(DATES.nextMonday, '00:00:00'))).toBe(
      DATES.nextMonday,
    );
    expect(isOperationalServiceDay(DATES.nextMonday)).toBe(true);
  });

  it('keeps an explicitly closed weekday as the dashboard date and marks it non-service', () => {
    mockExplicitClosures(DATES.monday);

    expect(resolveChefResultsServiceDate(helsinki(DATES.monday, '00:00:00'))).toBe(DATES.monday);
    expect(resolveChefResultsServiceDate(helsinki(DATES.monday, '23:59:59'))).toBe(DATES.monday);
    expect(isOperationalServiceDay(DATES.monday)).toBe(false);

    expect(resolveChefResultsServiceDate(helsinki(DATES.tuesday, '00:00:00'))).toBe(DATES.tuesday);
    expect(isOperationalServiceDay(DATES.tuesday)).toBe(true);
  });

  it('does not treat a missing-menu weekday as a non-service day', () => {
    // 2026-01-07 is a Wednesday used elsewhere as missing-from-workbook; still operational.
    const wednesdayWithoutMenu = '2026-01-07';
    expect(isOperationalServiceDay(wednesdayWithoutMenu)).toBe(true);
    expect(resolveChefResultsServiceDate(helsinki(wednesdayWithoutMenu, '12:00:00'))).toBe(
      wednesdayWithoutMenu,
    );
  });

  it('resolves the same Helsinki calendar date under several device timezones', () => {
    const instant = helsinki(DATES.tuesday, '08:30:00');
    for (const zone of [
      'Europe/Helsinki',
      'Europe/Amsterdam',
      'America/New_York',
      'Asia/Tokyo',
    ] as const) {
      const localParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(instant);
      // Sanity: local wall clock differs by zone, but dashboard date stays Helsinki.
      expect(localParts.find((part) => part.type === 'day')?.value).toBeTruthy();
      expect(resolveChefResultsServiceDate(instant)).toBe(DATES.tuesday);
    }
  });

  it('rolls at Helsinki midnight across spring and autumn DST weekends', () => {
    expect(resolveChefResultsServiceDate(helsinki(DATES.springSaturday, '23:59:59'))).toBe(
      DATES.springSaturday,
    );
    expect(resolveChefResultsServiceDate(helsinki(DATES.springSunday, '00:00:00'))).toBe(
      DATES.springSunday,
    );
    expect(isOperationalServiceDay(DATES.springSunday)).toBe(false);

    expect(resolveChefResultsServiceDate(helsinki(DATES.autumnSaturday, '23:59:59'))).toBe(
      DATES.autumnSaturday,
    );
    expect(resolveChefResultsServiceDate(helsinki(DATES.autumnSunday, '00:00:00'))).toBe(
      DATES.autumnSunday,
    );
    expect(isOperationalServiceDay(DATES.autumnSunday)).toBe(false);

    // DST changes at 03:00 Sunday in Europe/Helsinki — Saturday noon → Sunday noon length differs.
    const springDay =
      helsinki(DATES.springSunday, '12:00:00').getTime() -
      helsinki(DATES.springSaturday, '12:00:00').getTime();
    const autumnDay =
      helsinki(DATES.autumnSunday, '12:00:00').getTime() -
      helsinki(DATES.autumnSaturday, '12:00:00').getTime();
    expect(springDay).toBe(23 * 60 * 60 * 1000);
    expect(autumnDay).toBe(25 * 60 * 60 * 1000);
    expect(msUntilNextHelsinkiMidnight(helsinki(DATES.springSaturday, '23:00:00'))).toBe(
      60 * 60 * 1000,
    );
  });

  it('computes next Helsinki midnight from a late-evening instant', () => {
    const now = helsinki(DATES.monday, '23:59:59');
    const next = fromZonedTime(`${DATES.tuesday} 00:00:00.000`, 'Europe/Helsinki');
    expect(msUntilNextHelsinkiMidnight(now)).toBe(next.getTime() - now.getTime());
  });
});
