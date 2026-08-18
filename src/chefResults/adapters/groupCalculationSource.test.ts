import { describe, expect, it } from 'vitest';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../../gamebus/groupActivities';
import { buildAnonymizedChefForecastActivity } from '../../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import {
  resolveCloseoutChefForecast,
  resolveCloseoutChefForecastFromInputCollections,
} from '../../serviceCloseout/forecast/resolveCloseoutChefForecast';
import {
  buildAllGroupDailyServiceResults,
  buildGroupDailyServiceResults,
  buildGroupKitchenDiagnostics,
  buildGroupKitchenProgress,
  getGroupResultServiceDates,
} from './groupCalculationSource';
import { parseGameBusWasteMeasurementActivities, selectWasteMeasurementForDate } from './parseGameBusWasteMeasurement';
import { gameBusWasteMeasurementToCalculationInput } from './wasteMeasurementAdapter';
import { buildParticipantWeekSummary, findParticipantDailyResult } from '../participantWeekData';
import { buildFixtureKitchenProgress } from './fixtureCalculationSource';

const serviceDate = '2026-07-29';

function wasteMeasurementActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'wm-1',
    template: { reference: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: '2026-07-29T15:00:00.000Z',
    properties: [
      { template: { reference: 'serviceDate' }, value: { value: serviceDate } },
      { template: { reference: 'actualCustomers' }, value: { value: 150 } },
      { template: { reference: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { reference: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { reference: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { reference: 'preparedVegetarianQuantity' }, value: { value: 52 } },
      { template: { reference: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { reference: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { reference: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { reference: 'preparedDessertQuantity' }, value: { value: 35 } },
      { template: { reference: 'overproductionMeatKg' }, value: { value: 0.85 } },
      { template: { reference: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
      { template: { reference: 'overproductionSoupKg' }, value: { value: 0.5 } },
      { template: { reference: 'overproductionDessertKg' }, value: { value: 0.18 } },
      { template: { reference: 'submittedAt' }, value: { value: '2026-07-29T15:00:00.000Z' } },
    ],
    ...overrides,
  };
}

describe('group kitchen activities integration', () => {
  it('reads kitchenGroupInput.activities and filters only chefForecast for closeout', () => {
    const activities = [
      buildAnonymizedChefForecastActivity({ targetDate: serviceDate }),
      { id: 'student-1', template: { reference: 'studentLunchCheckin' }, properties: [] },
    ];

    const resolution = resolveCloseoutChefForecast(activities, serviceDate, 'user-anon-chef-001');
    expect(resolution.status).toBe('matched');
    if (resolution.status === 'matched') {
      expect(resolution.forecasts).toHaveLength(1);
      expect(resolution.forecasts[0]!.targetDate).toBe(serviceDate);
    }
  });

  it('ignores malformed unrelated activities safely', () => {
    const resolution = resolveCloseoutChefForecastFromInputCollections(
      {
        [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
          [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
            null,
            'invalid',
            { template: { reference: 'studentLunchCheckin' } },
          ],
        },
      },
      serviceDate,
      true,
      true,
      { syntheticForecastFallback: false },
    );
    expect(resolution.status).toBe('no_forecast');
  });

  it('converts wasteMeasurement kg to grams at adapter boundary', () => {
    const { valid } = parseGameBusWasteMeasurementActivities([wasteMeasurementActivity()]);
    const closeout = gameBusWasteMeasurementToCalculationInput(valid[0]!);
    expect(closeout.main.overproductionGrams).toBe(850);
    expect(closeout.vegetarian.overproductionGrams).toBe(360);
  });

  it('preserves wasteMeasurement actor identity from the activity envelope', () => {
    const { valid } = parseGameBusWasteMeasurementActivities([
      wasteMeasurementActivity({
        actor: { id: 'recorder-user-1', name: 'Closeout Recorder' },
      }),
    ]);
    expect(valid[0]!.actorId).toBe('recorder-user-1');
    expect(valid[0]!.actorName).toBe('Closeout Recorder');
  });

  it('keeps the recorder identity on the latest wasteMeasurement for a service date', () => {
    const older = wasteMeasurementActivity({
      id: 'wm-old',
      actor: { id: 'older-user', name: 'Older Recorder' },
      properties: [
        { template: { reference: 'serviceDate' }, value: { value: serviceDate } },
        { template: { reference: 'actualCustomers' }, value: { value: 140 } },
        { template: { reference: 'mainItemId' }, value: { value: 'meatballs' } },
        { template: { reference: 'preparedMainQuantity' }, value: { value: 100 } },
        { template: { reference: 'vegetarianItemId' }, value: { value: 'quorn' } },
        { template: { reference: 'preparedVegetarianQuantity' }, value: { value: 50 } },
        { template: { reference: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
        { template: { reference: 'preparedSoupQuantity' }, value: { value: 38 } },
        { template: { reference: 'dessertItemId' }, value: { value: 'apple-compote' } },
        { template: { reference: 'preparedDessertQuantity' }, value: { value: 30 } },
        { template: { reference: 'overproductionMeatKg' }, value: { value: 0.5 } },
        { template: { reference: 'overproductionVegetarianKg' }, value: { value: 0.2 } },
        { template: { reference: 'overproductionSoupKg' }, value: { value: 0.3 } },
        { template: { reference: 'overproductionDessertKg' }, value: { value: 0.1 } },
        { template: { reference: 'submittedAt' }, value: { value: '2026-07-29T12:00:00.000Z' } },
      ],
    });
    const newer = wasteMeasurementActivity({
      id: 'wm-new',
      actor: { id: 'latest-user', name: 'Latest Recorder' },
      properties: [
        { template: { reference: 'serviceDate' }, value: { value: serviceDate } },
        { template: { reference: 'actualCustomers' }, value: { value: 150 } },
        { template: { reference: 'mainItemId' }, value: { value: 'meatballs' } },
        { template: { reference: 'preparedMainQuantity' }, value: { value: 110 } },
        { template: { reference: 'vegetarianItemId' }, value: { value: 'quorn' } },
        { template: { reference: 'preparedVegetarianQuantity' }, value: { value: 52 } },
        { template: { reference: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
        { template: { reference: 'preparedSoupQuantity' }, value: { value: 40 } },
        { template: { reference: 'dessertItemId' }, value: { value: 'apple-compote' } },
        { template: { reference: 'preparedDessertQuantity' }, value: { value: 35 } },
        { template: { reference: 'overproductionMeatKg' }, value: { value: 0.85 } },
        { template: { reference: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
        { template: { reference: 'overproductionSoupKg' }, value: { value: 0.5 } },
        { template: { reference: 'overproductionDessertKg' }, value: { value: 0.18 } },
        { template: { reference: 'submittedAt' }, value: { value: '2026-07-29T15:00:00.000Z' } },
      ],
    });

    const { valid } = parseGameBusWasteMeasurementActivities([older, newer]);
    const selected = selectWasteMeasurementForDate(valid, serviceDate);
    expect(selected?.actorId).toBe('latest-user');
    expect(selected?.actorName).toBe('Latest Recorder');
  });

  it('returns null chef results when closeout is missing', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({ targetDate: serviceDate }),
        ],
      },
    };
    expect(buildGroupDailyServiceResults(inputCollections, serviceDate)).toBeNull();
  });

  it('produces independent staff results when forecast and closeout exist', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'f-1',
            actorId: 'user-a',
            actorName: 'Aino Virtanen',
            targetDate: serviceDate,
          }),
          buildAnonymizedChefForecastActivity({
            id: 'f-2',
            actorId: 'user-b',
            actorName: 'Kitchen Staff 2',
            targetDate: serviceDate,
          }),
          wasteMeasurementActivity(),
        ],
      },
    };

    const daily = buildGroupDailyServiceResults(inputCollections, serviceDate);
    expect(daily?.staffResults).toHaveLength(2);
    expect(daily?.staffResults.map((result) => result.userName)).toEqual([
      'Aino Virtanen',
      'Kitchen Staff 2',
    ]);
  });

  it('creates calculable service dates when forecast and wasteMeasurement match', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({ targetDate: serviceDate }),
          wasteMeasurementActivity(),
        ],
      },
    };

    expect(getGroupResultServiceDates(inputCollections)).toEqual([serviceDate]);
    expect(buildAllGroupDailyServiceResults(inputCollections)).toHaveLength(1);
  });

  it('keeps the latest duplicate forecast per actor for the same targetDate', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'f-old',
            actorId: 'user-a',
            actorName: 'Older Forecast',
            targetDate: serviceDate,
            submittedAt: '2026-07-28T10:00:00.000Z',
            forecastTotalCustomers: 100,
          }),
          buildAnonymizedChefForecastActivity({
            id: 'f-new',
            actorId: 'user-a',
            actorName: 'Latest Forecast',
            targetDate: serviceDate,
            submittedAt: '2026-07-28T16:00:00.000Z',
            forecastTotalCustomers: 120,
          }),
          wasteMeasurementActivity(),
        ],
      },
    };

    const daily = buildGroupDailyServiceResults(inputCollections, serviceDate);
    expect(daily?.staffResults).toHaveLength(1);
    expect(daily?.staffResults[0]?.userName).toBe('Latest Forecast');
    expect(daily?.staffResults[0]?.forecastCustomers).toBe(120);
  });

  it('selects the current user result by authenticated user id', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            actorId: 'me-user',
            actorName: 'Test Account',
            targetDate: serviceDate,
          }),
          buildAnonymizedChefForecastActivity({
            id: 'f-2',
            actorId: 'coworker',
            actorName: 'Coworker',
            targetDate: serviceDate,
          }),
          wasteMeasurementActivity(),
        ],
      },
    };

    const daily = buildGroupDailyServiceResults(inputCollections, serviceDate);
    const own = findParticipantDailyResult('me-user', serviceDate, daily);
    expect(own?.userId).toBe('me-user');
    expect(own?.userName).toBe('Test Account');
  });

  it('builds participant week summary from real group results only', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            actorId: 'me-user',
            actorName: 'Test Account',
            targetDate: serviceDate,
          }),
          wasteMeasurementActivity(),
        ],
      },
    };

    const week = buildParticipantWeekSummary('me-user', inputCollections);
    expect(week.participatedServiceCount).toBe(1);
    expect(week.points).toHaveLength(1);
    expect(week.points[0]?.serviceDate).toBe(serviceDate);
  });

  it('derives kitchen progress from real group results', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            actorId: 'user-a',
            actorName: 'A',
            targetDate: serviceDate,
          }),
          buildAnonymizedChefForecastActivity({
            id: 'f-2',
            actorId: 'user-b',
            actorName: 'B',
            targetDate: serviceDate,
          }),
          wasteMeasurementActivity(),
        ],
      },
    };

    const progress = buildGroupKitchenProgress(inputCollections);
    const fixtureProgress = buildFixtureKitchenProgress();
    expect(progress.servicesCompletedCount).toBe(1);
    expect(progress.servicesCompletedCount).not.toBe(fixtureProgress.servicesCompletedCount);
  });

  it('reports parser diagnostics for group kitchen activities', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({ targetDate: serviceDate }),
          wasteMeasurementActivity(),
          { id: 'bad-forecast', template: { reference: 'chefForecast' }, properties: [] },
        ],
      },
    };

    const diagnostics = buildGroupKitchenDiagnostics(inputCollections);
    expect(diagnostics.totalActivities).toBe(3);
    expect(diagnostics.validChefForecastCount).toBe(1);
    expect(diagnostics.rejectedChefForecastCount).toBe(1);
    expect(diagnostics.validWasteMeasurementCount).toBe(1);
    expect(diagnostics.calculableResultDates).toEqual([serviceDate]);
    expect(diagnostics.forecastTargetDates).toEqual([serviceDate]);
    expect(diagnostics.wasteServiceDates).toEqual([serviceDate]);
  });
});
