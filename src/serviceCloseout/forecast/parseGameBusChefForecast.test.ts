import { describe, expect, it } from 'vitest';
import { MENU_DATES } from '../../test/fixtures/dates';
import {
  buildAnonymizedChefForecastActivity,
  EARLIER_DUPLICATE_CHEF_FORECAST_ACTIVITY,
  EMPTY_PROPERTIES_CHEF_FORECAST_ACTIVITY,
  LATEST_DUPLICATE_CHEF_FORECAST_ACTIVITY,
  NEWEST_REAL_ACTIVITY_ABSENT_REFS,
  NEWEST_REAL_ACTIVITY_PRESENT_REFS,
  TOMORROW_CHEF_FORECAST_ACTIVITY,
} from './fixtures/gameBusChefForecastActivities';
import {
  extractChefForecastActivities,
  forecastCategoryQuantity,
  parseGameBusChefForecastActivities,
  parseGameBusChefForecastActivity,
} from './parseGameBusChefForecast';
import {
  resolveCloseoutChefForecast,
  resolveCloseoutChefForecastFromInputCollections,
} from './resolveCloseoutChefForecast';
import { selectLatestForecastForDate } from './selectCloseoutForecast';
import type { GameBusChefForecast } from './gameBusChefForecastTypes';

describe('parseGameBusChefForecast', () => {
  it('parses a realistic GameBus activity array', () => {
    const activity = buildAnonymizedChefForecastActivity();
    const result = parseGameBusChefForecastActivities([activity]);
    expect(result.valid).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
    expect(result.valid[0]).toMatchObject({
      activityId: 'activity-forecast-anon-001',
      actorId: 'user-anon-chef-001',
      actorName: 'Chef A. Example',
      targetDate: MENU_DATES.runtimeWednesday,
      forecastTotalCustomers: 142,
      forecastMain: 100,
      forecastVegetarian: 48,
      forecastSoup: 36,
    });
  });

  it('parses actor.id and actor.name', () => {
    const parsed = parseGameBusChefForecastActivity(
      buildAnonymizedChefForecastActivity({
        actorId: 'user-test-actor',
        actorName: 'Test Chef',
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.actorId).toBe('user-test-actor');
      expect(parsed.forecast.actorName).toBe('Test Chef');
    }
  });

  it('maps properties by template.reference', () => {
    const parsed = parseGameBusChefForecastActivity(buildAnonymizedChefForecastActivity());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.forecastMain).toBe(100);
      expect(parsed.forecast.mainItemId).toBe('thai-pork-meatballs');
    }
  });

  it('reads nested value.value fields', () => {
    const parsed = parseGameBusChefForecastActivity(
      buildAnonymizedChefForecastActivity({ forecastMain: 77 }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.forecastMain).toBe(77);
    }
  });

  it('does not depend on property order', () => {
    const shuffled = buildAnonymizedChefForecastActivity({
      propertyOrder: [
        'notes',
        'forecastSoup',
        'targetDate',
        'forecastMeat',
        'forecastVegetarian',
        'forecastTotalCustomers',
        'submittedAt',
      ],
      includeItemIds: false,
    });
    const parsed = parseGameBusChefForecastActivity(shuffled);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.targetDate).toBe(MENU_DATES.runtimeWednesday);
      expect(parsed.forecast.forecastSoup).toBe(36);
      expect(parsed.forecast.notes).toBe('Steady lunch service expected.');
    }
  });

  it('ignores unknown properties safely', () => {
    const activity = buildAnonymizedChefForecastActivity({ includeItemIds: false });
    activity.properties.push({
      template: { reference: 'unexpectedField', name: 'Unexpected' },
      value: { value: 'ignored' },
    });
    const parsed = parseGameBusChefForecastActivity(activity);
    expect(parsed.ok).toBe(true);
  });

  it('rejects empty-properties activities as unusable', () => {
    const parsed = parseGameBusChefForecastActivity(EMPTY_PROPERTIES_CHEF_FORECAST_ACTIVITY);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.diagnostic.reason).toBe('empty_properties');
    }
  });

  it('extracts activities from a raw array payload', () => {
    const activities = [buildAnonymizedChefForecastActivity()];
    expect(extractChefForecastActivities(activities)).toHaveLength(1);
  });

  it('extracts activities from paginated docs payload', () => {
    const activities = [buildAnonymizedChefForecastActivity()];
    expect(extractChefForecastActivities({ docs: activities, totalDocs: 1 })).toHaveLength(1);
  });

  it('parses dessert when present', () => {
    const parsed = parseGameBusChefForecastActivity(
      buildAnonymizedChefForecastActivity({ includeDessert: true, forecastDessert: 25 }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.forecastDessert).toBe(25);
      expect(parsed.forecast.dessertItemId).toBe('yogurt-berries');
    }
  });

  it('does not crash when dessert is absent', () => {
    const parsed = parseGameBusChefForecastActivity(buildAnonymizedChefForecastActivity());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.forecast.forecastDessert).toBeNull();
      expect(forecastCategoryQuantity(parsed.forecast, 'dessert')).toBeNull();
    }
  });
});

describe('selectCloseoutForecast', () => {
  const closeoutDate = MENU_DATES.runtimeWednesday;

  it('requires exact targetDate match', () => {
    const valid = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({ targetDate: closeoutDate }),
      TOMORROW_CHEF_FORECAST_ACTIVITY,
    ]).valid;

    const selected = selectLatestForecastForDate(valid, closeoutDate);
    expect(selected?.targetDate).toBe(closeoutDate);
    expect(selected?.forecastMain).toBe(100);
  });

  it('does not use tomorrow forecast for today closeout', () => {
    const resolution = resolveCloseoutChefForecast(
      [TOMORROW_CHEF_FORECAST_ACTIVITY],
      closeoutDate,
      'user-anon-chef-001',
    );
    expect(resolution.status).toBe('no_forecast');
  });

  it('returns no-forecast state when no date matches', () => {
    const resolution = resolveCloseoutChefForecast([], closeoutDate, 'user-anon-chef-001');
    expect(resolution.status).toBe('no_forecast');
    expect(resolution.forecasts).toHaveLength(0);
  });

  it('selects latest duplicate by submittedAt', () => {
    const valid = parseGameBusChefForecastActivities([
      EARLIER_DUPLICATE_CHEF_FORECAST_ACTIVITY,
      LATEST_DUPLICATE_CHEF_FORECAST_ACTIVITY,
    ]).valid;

    const selected = selectLatestForecastForDate(valid, closeoutDate);
    expect(selected?.activityId).toBe('activity-forecast-duplicate-new');
    expect(selected?.forecastTotalCustomers).toBe(142);
  });

  it('falls back to createdAt when submittedAt is missing', () => {
    const baseOrder = [
      'targetDate',
      'forecastTotalCustomers',
      'forecastMeat',
      'forecastVegetarian',
      'forecastSoup',
    ] as const;

    const older = buildAnonymizedChefForecastActivity({
      id: 'older-created-at',
      createdAt: '2026-07-28T08:00:00.000Z',
      forecastMain: 60,
      propertyOrder: [...baseOrder],
      includeItemIds: false,
    });
    older.properties = older.properties.filter((p) => p.template.reference !== 'submittedAt');

    const newer = buildAnonymizedChefForecastActivity({
      id: 'newer-created-at',
      createdAt: '2026-07-28T20:00:00.000Z',
      forecastMain: 95,
      propertyOrder: [...baseOrder],
      includeItemIds: false,
    });
    newer.properties = newer.properties.filter((p) => p.template.reference !== 'submittedAt');

    const valid = parseGameBusChefForecastActivities([older, newer]).valid;
    const selected = selectLatestForecastForDate(valid, closeoutDate);
    expect(selected?.activityId).toBe('newer-created-at');
    expect(selected?.submittedAt).toBeNull();
  });

  it('documents newest real activity property presence', () => {
    const parsed = parseGameBusChefForecastActivity(buildAnonymizedChefForecastActivity());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      for (const ref of NEWEST_REAL_ACTIVITY_PRESENT_REFS) {
        expect(parsed.presentRefs).toContain(ref);
      }
      for (const ref of NEWEST_REAL_ACTIVITY_ABSENT_REFS) {
        expect(parsed.presentRefs).not.toContain(ref);
      }
    }
  });
});

describe('resolveCloseoutChefForecastFromInputCollections', () => {
  it('does not substitute fixtures in embed mode when no match exists', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      {
        kitchenGroupInput: {
          activities: [buildAnonymizedChefForecastActivity()],
        },
      },
      '2026-01-01',
      true,
      true,
    );
    expect(resolution.status).toBe('no_forecast');
  });

  it('returns standalone state outside embed mode', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(null, '2026-07-29', false, false);
    expect(resolution.status).toBe('standalone');
  });
});

describe('GameBusChefForecast read model separation', () => {
  it('keeps forecast separate from ServiceCloseout actual fields', () => {
    const forecast: GameBusChefForecast = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity(),
    ]).valid[0]!;

    expect(forecast).not.toHaveProperty('actualCustomers');
    expect(forecast).not.toHaveProperty('preparedQuantity');
    expect(forecast).not.toHaveProperty('overproductionGrams');
  });
});
