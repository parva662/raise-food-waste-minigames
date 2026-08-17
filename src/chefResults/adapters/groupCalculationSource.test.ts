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
import { buildGroupDailyServiceResults } from './groupCalculationSource';
import { parseGameBusWasteMeasurementActivities } from './parseGameBusWasteMeasurement';
import { gameBusWasteMeasurementToCalculationInput } from './wasteMeasurementAdapter';

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

    const resolution = resolveCloseoutChefForecast(activities, serviceDate);
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
});
