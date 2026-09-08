import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../gamebus/groupActivities';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../gamebus/inputCollections';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';

const serviceDate = '2026-07-29';

export function embeddedKitchenPayloadForAdmin() {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
        id: 'real-user-abc',
        firstName: 'Test',
        lastName: 'Account',
      },
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
        buildAnonymizedChefForecastActivity({
          actorId: 'real-user-abc',
          actorName: 'Test Account',
          targetDate: serviceDate,
        }),
        buildAnonymizedChefForecastActivity({
          id: 'coworker-forecast',
          actorId: 'coworker-user',
          actorName: 'Coworker Chef',
          targetDate: serviceDate,
        }),
        {
          id: 'wm-1',
          template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
          createdAt: '2026-07-29T15:00:00.000Z',
          properties: [
            { template: { slug: 'serviceDate' }, value: { value: serviceDate } },
            { template: { slug: 'actualCustomers' }, value: { value: 150 } },
            { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
            { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
            { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
            { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 52 } },
            { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
            { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
            { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
            { template: { slug: 'preparedDessertQuantity' }, value: { value: 35 } },
            { template: { slug: 'overproductionMeatKg' }, value: { value: 0.85 } },
            { template: { slug: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
            { template: { slug: 'overproductionSoupKg' }, value: { value: 0.5 } },
            { template: { slug: 'overproductionDessertKg' }, value: { value: 0.18 } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-07-29T15:00:00.000Z' } },
          ],
        },
      ],
    },
  };
}
