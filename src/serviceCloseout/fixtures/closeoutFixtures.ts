/**
 * DEVELOPMENT FIXTURES ONLY — example finalized closeouts for future calculation tests.
 * Not used by the production closeout form. Not study or live operational data.
 */
import type { NormalizedServiceCloseout } from '../operationalRecord';

export const FIXTURE_NORMALIZED_CLOSEOUTS: readonly NormalizedServiceCloseout[] = [
  {
    targetDate: '2026-07-27',
    headChefUserId: 'fixture-user-a',
    actualCustomers: 176,
    main: {
      itemId: 'thai-pork-meatballs-with-rice',
      preparedQuantity: 118,
      portionWeightGrams: 120,
      overproductionGrams: 480,
      overproductionKg: 0.48,
    },
    vegetarian: {
      itemId: 'quorn-and-mushroom-stew',
      preparedQuantity: 52,
      portionWeightGrams: 180,
      overproductionGrams: 360,
      overproductionKg: 0.36,
    },
    soup: {
      itemId: 'pumpkin-soup',
      preparedQuantity: 38,
      portionWeightGrams: 250,
      overproductionGrams: 500,
      overproductionKg: 0.5,
    },
    dessert: {
      itemId: 'apple-compote',
      preparedQuantity: 34,
      portionWeightGrams: 90,
      overproductionGrams: 180,
      overproductionKg: 0.18,
    },
    submittedAt: '2026-07-27T14:30:00.000Z',
  },
] as const;
