import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import {
  isChefForecastActivityEligible,
  isChefForecastSubmissionInstantEligible,
} from './chefForecastEligibilityPolicy';
import * as menuResolverModule from './menuResolver';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import { parseGameBusChefForecastActivities } from '../serviceCloseout/forecast/parseGameBusChefForecast';

const THURSDAY = '2026-08-13';
const FRIDAY = '2026-08-14';
const SATURDAY = '2026-08-15';
const MONDAY = '2026-08-17';
const TUESDAY = '2026-08-18';

function helsinki(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chefForecastEligibilityPolicy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('same-day grace window on the target service date', () => {
    it('rejects submissions before 08:00', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '07:59:59'), MONDAY)).toBe(false);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '00:00:00'), MONDAY)).toBe(false);
    });

    it('accepts submissions from exactly 08:00:00 through 08:29:59', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '08:00:00'), MONDAY)).toBe(true);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '08:29:59'), MONDAY)).toBe(true);
    });

    it('rejects submissions from exactly 08:30:00 onwards', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '08:30:00'), MONDAY)).toBe(false);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '08:30:01'), MONDAY)).toBe(false);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '12:00:00'), MONDAY)).toBe(false);
    });
  });

  describe('advance window on the previous operational service day', () => {
    it('accepts Friday 08:30:00 through 23:59:59 for a Monday service', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '08:30:00'), MONDAY)).toBe(true);
      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '15:00:00'), MONDAY)).toBe(true);
      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '23:59:59'), MONDAY)).toBe(true);
    });

    it('rejects Friday before 08:30 for a Monday service', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '08:29:59'), MONDAY)).toBe(false);
      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '07:00:00'), MONDAY)).toBe(false);
    });

    it('rejects weekend submissions for a Monday service', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(SATURDAY, '12:00:00'), MONDAY)).toBe(false);
    });

    it('rejects operational days earlier than the previous operational service day', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(THURSDAY, '20:00:00'), MONDAY)).toBe(false);
    });

    it('treats Monday evening as the advance window for Tuesday, not for Monday', () => {
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '18:00:00'), TUESDAY)).toBe(true);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '08:00:00'), TUESDAY)).toBe(false);
    });

    it('skips an explicitly closed Monday so Friday owns the Tuesday advance window', () => {
      mockExplicitClosures(MONDAY);

      expect(isChefForecastSubmissionInstantEligible(helsinki(FRIDAY, '15:00:00'), TUESDAY)).toBe(true);
      expect(isChefForecastSubmissionInstantEligible(helsinki(MONDAY, '15:00:00'), TUESDAY)).toBe(false);
    });

    it('uses the previous operational day even when menu data is unavailable', () => {
      const wednesdayWithoutMenu = '2026-01-07';
      const tuesdayWithoutMenu = '2026-01-06';
      const mondayWithoutMenu = '2026-01-05';
      expect(menuResolverModule.resolveMenuForDate(wednesdayWithoutMenu).status).toBe('unavailable');

      expect(
        isChefForecastSubmissionInstantEligible(helsinki(tuesdayWithoutMenu, '15:00:00'), wednesdayWithoutMenu),
      ).toBe(true);
      expect(
        isChefForecastSubmissionInstantEligible(helsinki(mondayWithoutMenu, '15:00:00'), wednesdayWithoutMenu),
      ).toBe(false);
      expect(
        isChefForecastSubmissionInstantEligible(helsinki(wednesdayWithoutMenu, '08:15:00'), wednesdayWithoutMenu),
      ).toBe(true);
    });
  });

  it('evaluates activity eligibility from submittedAt with createdAt fallback', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: MONDAY,
        submittedAt: helsinki(MONDAY, '08:29:59').toISOString(),
      }),
    ]);
    expect(isChefForecastActivityEligible(valid[0]!)).toBe(true);

    const { valid: late } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: MONDAY,
        submittedAt: helsinki(MONDAY, '08:30:00').toISOString(),
      }),
    ]);
    expect(isChefForecastActivityEligible(late[0]!)).toBe(false);
  });
});
