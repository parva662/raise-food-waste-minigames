import { describe, it, expect } from 'vitest';
import {
  formatPortionDifference,
  isAllZeroForecast,
  plannedPortionsDifference,
  totalPlannedLunchPortions,
} from '@/products/kitchen-forecast/chefSummary';
import type { ChefForecastCompleteDraft } from '@/products/kitchen-forecast/types';

const draft: ChefForecastCompleteDraft = {
  expectedCustomers: 100,
  mainQuantity: 50,
  vegetarianQuantity: 30,
  soupQuantity: 40,
  dessertQuantity: 25,
  confidence: null,
  notes: '',
};

describe('chefSummary', () => {
  it('detects all-zero forecast only when complete', () => {
    expect(isAllZeroForecast(createZeroDraft())).toBe(true);
    expect(isAllZeroForecast(draft)).toBe(false);
  });

  it('totals Classic + Vegetarian + Soup without double-counting dessert', () => {
    expect(
      totalPlannedLunchPortions({
        mainQuantity: 800,
        vegetarianQuantity: 50,
        soupQuantity: 60,
      }),
    ).toBe(910);
  });

  it('returns null total when any planned field is blank', () => {
    expect(
      totalPlannedLunchPortions({
        mainQuantity: 10,
        vegetarianQuantity: null,
        soupQuantity: 5,
      }),
    ).toBeNull();
  });

  it('computes difference from expected customers including zeros', () => {
    expect(
      plannedPortionsDifference({
        expectedCustomers: 240,
        mainQuantity: 800,
        vegetarianQuantity: 50,
        soupQuantity: 60,
      }),
    ).toBe(670);

    expect(
      plannedPortionsDifference({
        expectedCustomers: 100,
        mainQuantity: 40,
        vegetarianQuantity: 30,
        soupQuantity: 30,
      }),
    ).toBe(0);

    expect(
      plannedPortionsDifference({
        expectedCustomers: null,
        mainQuantity: 10,
        vegetarianQuantity: 0,
        soupQuantity: 0,
      }),
    ).toBeNull();
  });

  it('formats signed difference labels', () => {
    expect(formatPortionDifference(670)).toBe('+670 portions');
    expect(formatPortionDifference(-12)).toBe('-12 portions');
    expect(formatPortionDifference(0)).toBe('0 portions');
  });
});

function createZeroDraft(): ChefForecastCompleteDraft {
  return {
    expectedCustomers: 0,
    mainQuantity: 0,
    vegetarianQuantity: 0,
    soupQuantity: 0,
    dessertQuantity: 0,
    confidence: null,
    notes: '',
  };
}
