import { describe, expect, it } from 'vitest';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../../gamebus/groupActivities';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../../gamebus/inputCollections';
import { WASTE_MEASUREMENT_REQUIRED_REFS } from '../../gamebus/mapWasteMeasurement';
import { buildAnonymizedChefForecastActivity } from '../../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import {
  buildInputCollectionsDebugInfo,
  detectRawActivitiesShape,
  findMissingRequiredWasteMeasurementRefs,
  findNewestActivityByCreatedAt,
  findNewestGroupActivityCreatedAt,
} from './buildInputCollectionsDebugInfo';

const serviceDate = '2026-07-29';

function wasteMeasurementActivity(
  overrides: Record<string, unknown> = {},
  propertyOverrides: Record<string, unknown> = {},
) {
  const properties = [
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
  ].map((property) => {
    const ref = property.template.reference;
    if (propertyOverrides[ref] !== undefined) {
      return { ...property, value: { value: propertyOverrides[ref] } };
    }
    return property;
  });

  return {
    id: 'wm-1',
    template: { reference: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: '2026-07-29T15:00:00.000Z',
    actor: { id: 'recorder-1', name: 'Recorder One' },
    properties,
    ...overrides,
  };
}

describe('buildInputCollectionsDebugInfo', () => {
  it('reports input collection keys and presence flags', () => {
    const payload = {
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: { id: 'user-1', firstName: 'Test', lastName: 'User' },
      },
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [wasteMeasurementActivity()],
      },
    };

    const debug = buildInputCollectionsDebugInfo(payload);
    expect(debug?.inputCollectionKeys).toEqual(['inputCollectionPari', 'kitchenGroupInput']);
    expect(debug?.hasInputCollectionPariMe).toBe(true);
    expect(debug?.hasKitchenGroupInputActivities).toBe(true);
  });

  it('reports raw activity counts and template reference counts', () => {
    const payload = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({ id: 'f-1', actorId: 'chef-1' }),
          buildAnonymizedChefForecastActivity({ id: 'f-2', actorId: 'chef-2' }),
          wasteMeasurementActivity(),
          { id: 'student-1', template: { reference: 'studentLunchCheckin' }, properties: [] },
        ],
      },
    };

    const debug = buildInputCollectionsDebugInfo(payload);
    expect(debug?.rawActivitiesShape).toBe('array');
    expect(debug?.rawActivityCount).toBe(4);
    expect(debug?.templateReferenceCounts).toEqual({
      chefForecast: 2,
      wasteMeasurement: 1,
      studentLunchCheckin: 1,
    });
  });

  it('supports docs-envelope raw group activities shape', () => {
    const payload = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: {
          docs: [wasteMeasurementActivity()],
        },
      },
    };

    const debug = buildInputCollectionsDebugInfo(payload);
    expect(detectRawActivitiesShape(
      payload[KITCHEN_GROUP_INPUT_COLLECTION_KEY][KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY],
    )).toBe('docs-envelope');
    expect(debug?.rawActivitiesShape).toBe('docs-envelope');
    expect(debug?.rawActivityCount).toBe(1);
  });

  it('selects the newest raw wasteMeasurement by createdAt', () => {
    const activities = [
      wasteMeasurementActivity({
        id: 'wm-old',
        createdAt: '2026-07-29T12:00:00.000Z',
        actor: { id: 'older', name: 'Older Recorder' },
      }),
      wasteMeasurementActivity({
        id: 'wm-new',
        createdAt: '2026-07-29T16:00:00.000Z',
        actor: { id: 'latest', name: 'Latest Recorder' },
      }),
    ];

    const newest = findNewestActivityByCreatedAt(activities, 'wasteMeasurement');
    expect((newest as { id?: string }).id).toBe('wm-new');

    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
      },
    });
    expect(debug?.newestWasteMeasurement?.activityId).toBe('wm-new');
    expect(debug?.newestWasteMeasurement?.actorId).toBe('latest');
    expect(debug?.newestWasteMeasurement?.actorName).toBe('Latest Recorder');
  });

  it('lists raw wasteMeasurement property refs and compact values', () => {
    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [wasteMeasurementActivity()],
      },
    });

    expect(debug?.newestWasteMeasurement?.propertyRefs).toContain('serviceDate');
    expect(debug?.newestWasteMeasurement?.propertyRefs).toContain('submittedAt');
    expect(debug?.newestWasteMeasurement?.propertyEntries).toEqual(
      expect.arrayContaining([
        { reference: 'serviceDate', displayValue: serviceDate },
        { reference: 'actualCustomers', displayValue: '150' },
      ]),
    );
  });

  it('compares missing required refs before parser validation', () => {
    const incomplete = wasteMeasurementActivity({}, { submittedAt: undefined });
    const properties = (incomplete as { properties: { template: { reference: string } }[] }).properties
      .filter((property) => property.template.reference !== 'submittedAt');
    const activity = { ...incomplete, properties };

    const propertyRefs = properties.map((property) => property.template.reference);
    expect(findMissingRequiredWasteMeasurementRefs(propertyRefs)).toEqual(['submittedAt']);

    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [activity],
      },
    });
    expect(debug?.newestWasteMeasurement?.missingRequiredRefs).toEqual(['submittedAt']);
  });

  it('reports none when all required refs are present on raw wasteMeasurement', () => {
    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [wasteMeasurementActivity()],
      },
    });

    expect(debug?.newestWasteMeasurement?.missingRequiredRefs).toEqual([]);
    expect(WASTE_MEASUREMENT_REQUIRED_REFS.every((ref) =>
      debug?.newestWasteMeasurement?.propertyRefs.includes(ref),
    )).toBe(true);
  });

  it('reports newest group activity createdAt timestamp', () => {
    const activities = [
      wasteMeasurementActivity({ id: 'wm-old', createdAt: '2026-07-29T12:00:00.000Z' }),
      buildAnonymizedChefForecastActivity({
        id: 'f-new',
        createdAt: '2026-07-29T18:00:00.000Z',
      }),
    ];

    expect(findNewestGroupActivityCreatedAt(activities)).toBe('2026-07-29T18:00:00.000Z');

    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
      },
    });
    expect(debug?.newestGroupActivityCreatedAt).toBe('2026-07-29T18:00:00.000Z');
  });

  it('shows only the newest chefForecast per actor', () => {
    const debug = buildInputCollectionsDebugInfo({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'f-old',
            actorId: 'chef-1',
            actorName: 'Chef One',
            createdAt: '2026-07-28T10:00:00.000Z',
            submittedAt: '2026-07-28T10:00:00.000Z',
            targetDate: '2026-07-28',
          }),
          buildAnonymizedChefForecastActivity({
            id: 'f-new',
            actorId: 'chef-1',
            actorName: 'Chef One',
            createdAt: '2026-07-28T16:00:00.000Z',
            submittedAt: '2026-07-28T16:00:00.000Z',
            targetDate: serviceDate,
          }),
        ],
      },
    });

    expect(debug?.newestChefForecastsByActor).toHaveLength(1);
    expect(debug?.newestChefForecastsByActor[0]?.activityId).toBe('f-new');
    expect(debug?.newestChefForecastsByActor[0]?.targetDate).toBe(serviceDate);
  });
});
