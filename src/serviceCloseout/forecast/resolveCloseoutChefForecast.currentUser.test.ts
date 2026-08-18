import { describe, expect, it } from 'vitest';
import { MENU_DATES } from '../../test/fixtures/dates';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../../gamebus/inputCollections';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../../gamebus/groupActivities';
import { buildAnonymizedChefForecastActivity } from './fixtures/gameBusChefForecastActivities';
import {
  resolveCloseoutChefForecast,
  resolveCloseoutChefForecastFromInputCollections,
} from './resolveCloseoutChefForecast';
import { selectCurrentUserForecastForDate } from './selectCloseoutForecast';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { SYNTHETIC_CLOSEOUT_FORECAST_VALUES } from './syntheticCloseoutChefForecast';

const serviceDate = MENU_DATES.runtimeWednesday;

function groupActivitiesPayload(activities: unknown) {
  return {
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
        id: 'user-a',
        firstName: 'Staff',
        lastName: 'One',
      },
    },
  };
}

function forecastsForActors() {
  return parseGameBusChefForecastActivities([
    buildAnonymizedChefForecastActivity({
      id: 'f-a',
      actorId: 'user-a',
      actorName: 'Staff One',
      targetDate: serviceDate,
      forecastMain: 200,
      forecastTotalCustomers: 200,
    }),
    buildAnonymizedChefForecastActivity({
      id: 'f-b',
      actorId: 'user-b',
      actorName: 'Staff Two',
      targetDate: serviceDate,
      forecastMain: 300,
      forecastTotalCustomers: 300,
    }),
    buildAnonymizedChefForecastActivity({
      id: 'f-c',
      actorId: 'user-c',
      actorName: 'Test Account',
      targetDate: serviceDate,
      forecastMain: 111,
      forecastTotalCustomers: 111,
    }),
  ]).valid;
}

describe('current-user Service Closeout forecast selection', () => {
  it('shows only the authenticated user forecast when multiple staff submitted', () => {
    const forecasts = forecastsForActors();
    expect(selectCurrentUserForecastForDate(forecasts, serviceDate, 'user-a')?.forecastMain).toBe(200);
    expect(selectCurrentUserForecastForDate(forecasts, serviceDate, 'user-b')?.forecastMain).toBe(300);
  });

  it('requires exact targetDate for the current user', () => {
    const forecasts = forecastsForActors();
    expect(selectCurrentUserForecastForDate(forecasts, '2026-01-01', 'user-a')).toBeNull();
  });

  it('uses latest duplicate for the same current user and date', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        actorId: 'user-a',
        targetDate: serviceDate,
        submittedAt: '2026-07-28T10:00:00.000Z',
        forecastMain: 40,
      }),
      buildAnonymizedChefForecastActivity({
        actorId: 'user-a',
        targetDate: serviceDate,
        submittedAt: '2026-07-28T16:00:00.000Z',
        forecastMain: 44,
      }),
    ]);
    const forecast = selectCurrentUserForecastForDate(valid, serviceDate, 'user-a');
    expect(forecast?.forecastMain).toBe(44);
  });

  it('does not let another actor forecast suppress synthetic fallback for the current user', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupActivitiesPayload([
        buildAnonymizedChefForecastActivity({
          actorId: 'user-b',
          actorName: 'Staff Two',
          targetDate: serviceDate,
        }),
      ]),
      serviceDate,
      true,
      true,
      { syntheticForecastFallback: true, authenticatedUserId: 'user-a' },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.isSynthetic).toBe(true);
      expect(resolution.forecasts[0]!.actorId).toBe('user-a');
      expect(resolution.forecasts[0]!.actorName).toBe('Staff One');
      expect(resolution.forecasts[0]!.forecastTotalCustomers).toBe(
        SYNTHETIC_CLOSEOUT_FORECAST_VALUES.forecastTotalCustomers,
      );
      expect(resolution.forecasts[0]!.actorName).not.toBe('Staff Two');
    }
  });

  it('uses authenticated user id and name on synthetic fallback', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      {
        [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
          [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
            buildAnonymizedChefForecastActivity({
              actorId: 'user-b',
              actorName: 'Staff Two',
              targetDate: serviceDate,
            }),
          ],
        },
        [INPUT_COLLECTION_PARI_KEY]: {
          [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
            id: 'staff2-user-id',
            firstName: 'staff2',
            lastName: 'Chef',
          },
        },
      },
      serviceDate,
      true,
      true,
      { syntheticForecastFallback: true },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.isSynthetic).toBe(true);
      expect(resolution.forecasts[0]!.actorId).toBe('staff2-user-id');
      expect(resolution.forecasts[0]!.actorName).toBe('staff2 Chef');
      expect(resolution.forecasts[0]!.forecastMain).toBe(
        SYNTHETIC_CLOSEOUT_FORECAST_VALUES.forecastMain,
      );
    }
  });

  it('uses the current user real forecast instead of synthetic when present', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupActivitiesPayload([
        buildAnonymizedChefForecastActivity({
          actorId: 'user-a',
          actorName: 'Staff One',
          targetDate: serviceDate,
          forecastMain: 200,
        }),
        buildAnonymizedChefForecastActivity({
          actorId: 'user-b',
          actorName: 'Staff Two',
          targetDate: serviceDate,
          forecastMain: 300,
        }),
      ]),
      serviceDate,
      true,
      true,
      { syntheticForecastFallback: true, authenticatedUserId: 'user-a' },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.forecasts[0]!.actorId).toBe('user-a');
      expect(resolution.forecasts[0]!.actorName).toBe('Staff One');
      expect(resolution.forecasts[0]!.forecastMain).toBe(200);
      expect(resolution.isSynthetic).toBe(false);
    }
  });

  it('reads authenticated user id from inputCollectionPari.me when not passed explicitly', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      groupActivitiesPayload([
        buildAnonymizedChefForecastActivity({
          actorId: 'user-a',
          actorName: 'Staff One',
          targetDate: serviceDate,
          forecastTotalCustomers: 142,
        }),
      ]),
      serviceDate,
      true,
      true,
      { syntheticForecastFallback: false },
    );

    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.forecasts[0]!.actorId).toBe('user-a');
      expect(resolution.forecasts[0]!.forecastTotalCustomers).toBe(142);
    }
  });

  it('returns no forecast when authenticated user has no exact-date submission', () => {
    const resolution = resolveCloseoutChefForecast(
      forecastsForActors(),
      serviceDate,
      'missing-user',
    );
    expect(resolution.status).toBe('no_forecast');
  });
});
