import { describe, expect, it } from 'vitest';
import { sumMeasuredOverproductionGrams } from './actualKitchenOutcome';
import type { ObservedServiceReality } from './types';

function observedCategory(grams: number) {
  return {
    itemId: 'item',
    actualPreparedQuantity: 100,
    portionWeightGrams: 350,
    actualPreparedWeightGrams: 35000,
    measuredOverproductionGrams: grams,
    observedDemandWeightGrams: 35000 - grams,
  };
}

const observed1140: ObservedServiceReality = {
  serviceDate: '2026-07-27',
  actualCustomers: 150,
  main: observedCategory(500),
  vegetarian: observedCategory(600),
  soup: observedCategory(20),
  dessert: observedCategory(20),
};

describe('actualKitchenOutcome', () => {
  it('sums measured overproduction across categories', () => {
    expect(sumMeasuredOverproductionGrams(observed1140)).toBe(1140);
  });
});
