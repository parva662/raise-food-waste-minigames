import { describe, expect, it } from 'vitest';
import { MENU_DATES } from '../../test/fixtures/dates';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../../gamebus/groupActivities';
import {
  buildAnonymizedChefForecastActivity,
  TOMORROW_CHEF_FORECAST_ACTIVITY,
} from './fixtures/gameBusChefForecastActivities';
import {
  resolveCloseoutChefForecast,
  resolveCloseoutChefForecastFromInputCollections,
} from './resolveCloseoutChefForecast';
import { SYNTHETIC_CLOSEOUT_FORECAST_VALUES } from './syntheticCloseoutChefForecast';

const closeoutDate = MENU_DATES.runtimeWednesday;

function groupInputCollections(activities: unknown) {
  return {
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
  };
}

describe('resolveCloseoutChefForecast synthetic fallback', () => {
  it('keeps exact real targetDate match when fallback is enabled', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupInputCollections([
        buildAnonymizedChefForecastActivity({ targetDate: closeoutDate }),
      ]),
      closeoutDate,
      true,
      true,
      { syntheticForecastFallback: true },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.isSynthetic).toBe(false);
      expect(resolution.forecasts).toHaveLength(1);
      expect(resolution.forecasts[0]!.targetDate).toBe(closeoutDate);
      expect(resolution.forecasts[0]!.forecastMain).toBe(100);
    }
  });

  it('returns no forecast when fallback is disabled and no exact match exists', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupInputCollections([TOMORROW_CHEF_FORECAST_ACTIVITY]),
      closeoutDate,
      true,
      true,
      { syntheticForecastFallback: false },
    );

    expect(resolution.status).toBe('no_forecast');
  });

  it('does not substitute a forecast from another targetDate', () => {
    const resolution = resolveCloseoutChefForecast(
      [TOMORROW_CHEF_FORECAST_ACTIVITY],
      closeoutDate,
    );
    expect(resolution.status).toBe('no_forecast');
  });

  it('returns synthetic forecast when fallback is enabled and no exact match exists', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupInputCollections([TOMORROW_CHEF_FORECAST_ACTIVITY]),
      closeoutDate,
      true,
      true,
      { syntheticForecastFallback: true },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.isSynthetic).toBe(true);
      expect(resolution.forecasts[0]!.targetDate).toBe(closeoutDate);
      expect(resolution.forecasts[0]!.forecastTotalCustomers).toBe(
        SYNTHETIC_CLOSEOUT_FORECAST_VALUES.forecastTotalCustomers,
      );
      expect(resolution.forecasts[0]!.forecastMain).toBe(SYNTHETIC_CLOSEOUT_FORECAST_VALUES.forecastMain);
    }
  });

  it('does not activate synthetic fallback before INPUT_COLLECTIONS is ready', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      null,
      closeoutDate,
      true,
      false,
      { syntheticForecastFallback: true },
    );

    expect(resolution.status).toBe('pending');
  });

  it('does not activate synthetic fallback outside embed mode', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      null,
      closeoutDate,
      false,
      true,
      { syntheticForecastFallback: true },
    );

    expect(resolution.status).toBe('standalone');
  });
});
