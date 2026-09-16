import { afterEach, describe, expect, it, vi } from 'vitest';
import { helsinki } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
import {
  resolveChefForecastServiceDate,
  resolveNextServiceDate,
  resolvePreviousOperationalDay,
} from '../services/operationalServiceCalendar';
import { isChefForecastSubmissionInstantEligible } from '../services/chefForecastEligibilityPolicy';
import { isChefSubmissionAllowed } from './chefSubmissionWindow';

const THURSDAY = '2026-08-13';
const FRIDAY = '2026-08-14';
const SATURDAY = '2026-08-15';
const SUNDAY = '2026-08-16';
const MONDAY = '2026-08-17';
const TUESDAY = '2026-08-18';
const WEDNESDAY = '2026-08-19';

/** Resolved target plus whether entry is actually open for that target. */
function entryState(instant: Date): { target: string; open: boolean } {
  const target = resolveChefForecastServiceDate(instant);
  return { target, open: isChefSubmissionAllowed(instant, target) };
}

describe('kitchen forecast target and entry state across an operational day', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['00:00:00', MONDAY, false],
    ['07:59:59', MONDAY, false],
    ['08:00:00', MONDAY, true],
    ['08:29:59', MONDAY, true],
    ['08:30:00', TUESDAY, true],
    ['08:30:01', TUESDAY, true],
    ['23:59:59', TUESDAY, true],
  ])('Monday %s targets %s with entry open=%s', (time, expectedTarget, expectedOpen) => {
    expect(entryState(helsinki(MONDAY, time))).toEqual({
      target: expectedTarget,
      open: expectedOpen,
    });
  });

  it('does not open the next service before 08:00 merely because one exists', () => {
    const beforeGrace = helsinki(MONDAY, '07:59:59');

    expect(resolveChefForecastServiceDate(beforeGrace)).toBe(MONDAY);
    expect(isChefSubmissionAllowed(beforeGrace, MONDAY)).toBe(false);
    expect(isChefSubmissionAllowed(beforeGrace, TUESDAY)).toBe(false);
  });

  it.each([
    ['08:29:59', FRIDAY, true],
    ['08:30:00', MONDAY, true],
    ['23:59:59', MONDAY, true],
  ])('Friday %s targets %s with entry open=%s', (time, expectedTarget, expectedOpen) => {
    expect(entryState(helsinki(FRIDAY, time))).toEqual({
      target: expectedTarget,
      open: expectedOpen,
    });
  });
});

describe('kitchen forecast weekend behaviour', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['Saturday', SATURDAY],
    ['Sunday', SUNDAY],
  ])('%s never opens entry and never becomes a target', (_label, weekendDate) => {
    for (const time of ['00:00:00', '08:00:00', '08:15:00', '08:30:00', '12:00:00', '23:59:59']) {
      const state = entryState(helsinki(weekendDate, time));
      expect(state).toEqual({ target: MONDAY, open: false });
    }
  });

  it.each([
    ['Saturday', SATURDAY],
    ['Sunday', SUNDAY],
  ])('a %s timestamp is never eligible for the Monday service', (_label, weekendDate) => {
    for (const time of ['08:30:00', '12:00:00', '23:59:59']) {
      expect(isChefForecastSubmissionInstantEligible(helsinki(weekendDate, time), MONDAY)).toBe(
        false,
      );
    }
  });

  it('never resolves a weekend date as the next or previous operational service', () => {
    expect(resolveNextServiceDate(FRIDAY)).toBe(MONDAY);
    expect(resolveNextServiceDate(SATURDAY)).toBe(MONDAY);
    expect(resolveNextServiceDate(SUNDAY)).toBe(MONDAY);
    expect(resolvePreviousOperationalDay(MONDAY)).toBe(FRIDAY);
  });
});

describe('kitchen forecast explicit closures', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips an explicitly closed Monday from the Friday advance window', () => {
    mockExplicitClosures(MONDAY);

    expect(entryState(helsinki(FRIDAY, '15:00:00'))).toEqual({ target: TUESDAY, open: true });
  });

  it('leaves an explicitly closed Monday without any forecast window of its own', () => {
    mockExplicitClosures(MONDAY);

    for (const time of ['00:00:00', '08:00:00', '08:15:00', '08:30:00', '15:00:00', '23:59:59']) {
      const state = entryState(helsinki(MONDAY, time));
      expect(state.target).toBe(TUESDAY);
      expect(state.open).toBe(false);
    }
  });

  it('continues past consecutive explicit closures to the next genuine service day', () => {
    mockExplicitClosures(MONDAY, TUESDAY);

    expect(entryState(helsinki(FRIDAY, '15:00:00'))).toEqual({ target: WEDNESDAY, open: true });
    expect(resolvePreviousOperationalDay(WEDNESDAY)).toBe(FRIDAY);
  });

  it('uses Friday, not the closed Monday, as the previous operational day for Tuesday', () => {
    mockExplicitClosures(MONDAY);

    expect(resolvePreviousOperationalDay(TUESDAY)).toBe(FRIDAY);
    expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '15:00:00'), TUESDAY)).toBe(
      true,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '15:00:00'), TUESDAY)).toBe(
      false,
    );
  });
});

describe('stored activity eligibility windows for a target service date', () => {
  it.each([
    ['previous operational day 07:00:00', FRIDAY, '07:00:00', false],
    ['previous operational day 08:29:59', FRIDAY, '08:29:59', false],
    ['previous operational day 08:30:00', FRIDAY, '08:30:00', true],
    ['previous operational day 16:00:00', FRIDAY, '16:00:00', true],
    ['previous operational day 23:59:59', FRIDAY, '23:59:59', true],
    ['weekend between P and D', SATURDAY, '12:00:00', false],
    ['weekend between P and D', SUNDAY, '12:00:00', false],
    ['target day 07:59:59', MONDAY, '07:59:59', false],
    ['target day 08:00:00', MONDAY, '08:00:00', true],
    ['target day 08:15:00', MONDAY, '08:15:00', true],
    ['target day 08:29:59', MONDAY, '08:29:59', true],
    ['target day 08:30:00', MONDAY, '08:30:00', false],
    ['target day 12:00:00', MONDAY, '12:00:00', false],
    ['an earlier operational day', THURSDAY, '20:00:00', false],
  ])('%s is eligible=%s for the Monday service', (_label, date, time, expected) => {
    expect(isChefForecastSubmissionInstantEligible(helsinki(date, time), MONDAY)).toBe(expected);
  });
});

describe('Europe/Helsinki is authoritative regardless of device timezone', () => {
  it('switches the target on the Helsinki 08:30 boundary expressed in UTC', () => {
    expect(resolveChefForecastServiceDate(new Date('2026-08-17T05:29:59.000Z'))).toBe(MONDAY);
    expect(resolveChefForecastServiceDate(new Date('2026-08-17T05:30:00.000Z'))).toBe(TUESDAY);
  });

  it('uses Helsinki wall-clock even when other device timezones still show a different time of day', () => {
    const instant = new Date('2026-08-17T05:30:00.000Z');
    const wall = (timeZone: string) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(instant);

    expect(wall('Europe/Helsinki')).toBe('08:30');
    expect(wall('Europe/Amsterdam')).toBe('07:30');
    expect(wall('UTC')).toBe('05:30');
    expect(wall('America/New_York')).toBe('01:30');
    expect(wall('Asia/Tokyo')).toBe('14:30');

    // Amsterdam 07:30 would still be before the switch; Helsinki 08:30 must win.
    expect(entryState(instant)).toEqual({ target: TUESDAY, open: true });
  });

  it('treats a Friday evening in the Americas as Saturday when Helsinki says Saturday', () => {
    // 2026-08-14 22:00 UTC is Friday 18:00 in New York but already Saturday 01:00 in Helsinki.
    const instant = new Date('2026-08-14T22:00:00.000Z');

    expect(entryState(instant)).toEqual({ target: MONDAY, open: false });
  });

  it('treats a Monday afternoon in Tokyo as Monday morning when Helsinki says 07:45', () => {
    // 2026-08-17 04:45 UTC is 13:45 in Tokyo but 07:45 in Helsinki, before the grace window.
    const instant = new Date('2026-08-17T04:45:00.000Z');

    expect(entryState(instant)).toEqual({ target: MONDAY, open: false });
  });
});

describe('Helsinki daylight-saving transitions do not change the business rules', () => {
  const dstFriday = '2026-10-23';
  const dstSunday = '2026-10-25';
  const dstMonday = '2026-10-26';
  const dstTuesday = '2026-10-27';

  it('crosses the October transition between the advance window and the service', () => {
    // Summer time before the weekend, standard time after it.
    expect(helsinki(dstFriday, '08:30:00').toISOString()).toBe('2026-10-23T05:30:00.000Z');
    expect(helsinki(dstMonday, '08:00:00').toISOString()).toBe('2026-10-26T06:00:00.000Z');
  });

  it.each([
    [dstFriday, '08:29:59', dstFriday, true],
    [dstFriday, '08:30:00', dstMonday, true],
    [dstFriday, '23:59:59', dstMonday, true],
    [dstSunday, '12:00:00', dstMonday, false],
    [dstMonday, '08:00:00', dstMonday, true],
    [dstMonday, '08:29:59', dstMonday, true],
    [dstMonday, '08:30:00', dstTuesday, true],
  ])('%s %s targets %s with entry open=%s across the transition', (date, time, target, open) => {
    expect(entryState(helsinki(date, time))).toEqual({ target, open });
  });

  it('keeps activity eligibility anchored to Helsinki wall-clock across the transition', () => {
    expect(isChefForecastSubmissionInstantEligible(helsinki(dstFriday, '16:00:00'), dstMonday)).toBe(
      true,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(dstFriday, '08:29:59'), dstMonday)).toBe(
      false,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(dstSunday, '12:00:00'), dstMonday)).toBe(
      false,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(dstMonday, '08:15:00'), dstMonday)).toBe(
      true,
    );
  });

  it('applies the same rules across the March transition', () => {
    const springFriday = '2026-03-27';
    const springMonday = '2026-03-30';

    expect(helsinki(springFriday, '08:30:00').toISOString()).toBe('2026-03-27T06:30:00.000Z');
    expect(helsinki(springMonday, '08:00:00').toISOString()).toBe('2026-03-30T05:00:00.000Z');
    expect(resolveChefForecastServiceDate(helsinki(springFriday, '08:30:00'))).toBe(springMonday);
    expect(
      isChefForecastSubmissionInstantEligible(helsinki(springFriday, '16:00:00'), springMonday),
    ).toBe(true);
  });
});
