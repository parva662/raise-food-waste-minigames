// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  isCloseoutDevDateOverrideActive,
  parseCloseoutDevDateOverride,
  resolveCloseoutServiceDate,
} from './closeoutServiceDate';
import * as datesModule from '../utils/dates';
import { MENU_DATES } from '../test/fixtures/dates';
import { selectLatestForecastForDate } from './forecast/selectCloseoutForecast';
import { parseGameBusChefForecastActivities } from './forecast/parseGameBusChefForecast';
import { buildAnonymizedChefForecastActivity } from './forecast/fixtures/gameBusChefForecastActivities';

describe('closeoutServiceDate', () => {
  const originalHash = window.location.hash;

  beforeEach(() => {
    window.location.hash = '';
    vi.spyOn(datesModule, 'getTodayIsoDate').mockReturnValue(MENU_DATES.runtimeWednesday);
  });

  afterEach(() => {
    window.location.hash = originalHash;
    vi.restoreAllMocks();
  });

  it('parses dev date override from hash query', () => {
    window.location.hash = '#/service-closeout?date=2026-08-12';
    expect(parseCloseoutDevDateOverride()).toBe('2026-08-12');
    expect(resolveCloseoutServiceDate()).toBe('2026-08-12');
    expect(isCloseoutDevDateOverrideActive('2026-08-12')).toBe(true);
  });

  it('falls back to today when no override is present', () => {
    window.location.hash = '#/service-closeout';
    expect(parseCloseoutDevDateOverride()).toBeNull();
    expect(resolveCloseoutServiceDate()).toBe(MENU_DATES.runtimeWednesday);
  });

  it('selects a 12-Aug forecast when dev override is 12-Aug', () => {
    const forecast = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({ targetDate: '2026-08-12' }),
      buildAnonymizedChefForecastActivity({
        id: 'activity-today',
        targetDate: MENU_DATES.runtimeWednesday,
      }),
    ]).valid;

    const selected = selectLatestForecastForDate(forecast, '2026-08-12');
    expect(selected?.targetDate).toBe('2026-08-12');
    expect(selected?.activityId).toBe('activity-forecast-anon-001');
  });
});
