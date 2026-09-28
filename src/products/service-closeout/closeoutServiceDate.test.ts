// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  isCloseoutDevDateOverrideActive,
  parseCloseoutDevDateOverride,
  resolveCloseoutServiceDate,
} from '@/products/service-closeout/closeoutServiceDate';
import * as datesModule from '@/shared/time/dates';
import { MENU_DATES } from '@/test/fixtures/dates';
import { selectLatestForecastForDate } from '@/products/service-closeout/forecast/selectCloseoutForecast';
import { parseGameBusChefForecastActivities } from '@/products/service-closeout/forecast/parseGameBusChefForecast';
import { buildAnonymizedChefForecastActivity } from '@/products/service-closeout/forecast/fixtures/gameBusChefForecastActivities';
import { mapWasteMeasurement } from '@/products/service-closeout/gamebus/mapWasteMeasurement';
import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { normalizeServiceCloseout } from '@/products/service-closeout/normalize';
import { createDevelopmentPortionWeightProvider } from '@/products/service-closeout/portionWeight/developmentFixtures';
import type { ServiceCloseoutDraft } from '@/products/service-closeout/types';

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

  it('maps finalized closeout serviceDate to wasteMeasurement', () => {
    const serviceDate = MENU_DATES.runtimeWednesday;
    const mealSlots = resolveMealSlotsForDate(serviceDate)!;
    const closeout = normalizeServiceCloseout(
      completeDraft(),
      serviceDate,
      mealSlots,
      createDevelopmentPortionWeightProvider(),
      '2026-08-31T14:00:00.000Z',
    );

    expect(closeout.targetDate).toBe(MENU_DATES.runtimeWednesday);
    expect(mapWasteMeasurement(closeout).serviceDate).toEqual({
      value: MENU_DATES.runtimeWednesday,
    });
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

describe('closeoutServiceDate Helsinki calendar', () => {
  it('resolves service closeout to Helsinki today near UTC midnight', () => {
    const instant = new Date('2026-08-17T21:30:00Z');
    expect(resolveCloseoutServiceDate(undefined, instant)).toBe('2026-08-18');
  });
});
