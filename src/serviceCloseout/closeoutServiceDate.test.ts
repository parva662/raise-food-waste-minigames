// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getServiceCloseoutRouteServiceDate,
  isCloseoutDevDateOverrideActive,
  isServiceCloseoutLiveTestServiceDateActive,
  parseCloseoutDevDateOverride,
  resolveCloseoutServiceDate,
  SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE,
} from './closeoutServiceDate';
import * as datesModule from '../utils/dates';
import { MENU_DATES } from '../test/fixtures/dates';
import { selectLatestForecastForDate } from './forecast/selectCloseoutForecast';
import { parseGameBusChefForecastActivities } from './forecast/parseGameBusChefForecast';
import { buildAnonymizedChefForecastActivity } from './forecast/fixtures/gameBusChefForecastActivities';
import { mapWasteMeasurement } from '../gamebus/mapWasteMeasurement';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { normalizeServiceCloseout } from './normalize';
import { createDevelopmentPortionWeightProvider } from './portionWeight/developmentFixtures';
import type { ServiceCloseoutDraft } from './types';

function completeDraft(): ServiceCloseoutDraft {
  return {
    actualCustomers: 150,
    main: { preparedQuantity: 110, overproductionGrams: 850 },
    vegetarian: { preparedQuantity: 52, overproductionGrams: 360 },
    soup: { preparedQuantity: 40, overproductionGrams: 500 },
    dessert: { preparedQuantity: 35, overproductionGrams: 180 },
  };
}

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

  it('routes service closeout to the live test service date', () => {
    expect(getServiceCloseoutRouteServiceDate()).toBe(SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE);
    expect(isServiceCloseoutLiveTestServiceDateActive(SERVICE_CLOSEOUT_LIVE_TEST_SERVICE_DATE)).toBe(
      true,
    );
  });

  it('maps finalized closeout from route date to wasteMeasurement serviceDate', () => {
    const serviceDate = getServiceCloseoutRouteServiceDate();
    const mealSlots = resolveMealSlotsForDate(serviceDate)!;
    const closeout = normalizeServiceCloseout(
      completeDraft(),
      serviceDate,
      mealSlots,
      createDevelopmentPortionWeightProvider(),
      '2026-08-31T14:00:00.000Z',
    );

    expect(closeout.targetDate).toBe('2026-09-01');
    expect(mapWasteMeasurement(closeout).serviceDate).toEqual({ value: '2026-09-01' });
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
