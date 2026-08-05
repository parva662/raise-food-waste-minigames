import { describe, it, expect } from 'vitest';
import { isAllZeroForecast } from './chefSummary';
import type { ChefForecastCompleteDraft } from './types';

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
