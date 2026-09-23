import { describe, expect, it } from 'vitest';
import { compareToKitchenReference } from './reference';

describe('Kitchen Day Trim reference comparison', () => {
  it('uses chef-seeded reference when history is missing', () => {
    const comparison = compareToKitchenReference({
      ingredientId: 'carrot',
      studentWastePercent: 9,
      historicalSamples: [],
    });
    expect(comparison?.source).toBe('seed');
    expect(comparison?.referenceWastePercent).toBe(12);
    expect(comparison?.performedBetterThanReference).toBe(true);
    expect(comparison?.percentileCopy).toBeNull();
  });

  it('uses historical average when Trim data exists', () => {
    const comparison = compareToKitchenReference({
      ingredientId: 'carrot',
      studentWastePercent: 9,
      historicalSamples: [
        { ingredientId: 'carrot', ingredientWeightGrams: 1000, actualWasteGrams: 200 },
        { ingredientId: 'carrot', ingredientWeightGrams: 1000, actualWasteGrams: 100 },
      ],
    });
    expect(comparison?.source).toBe('historical');
    expect(comparison?.referenceWastePercent).toBe(15);
    expect(comparison?.percentileCopy).toBeNull();
  });

  it('falls back to seed when history is for another ingredient', () => {
    const comparison = compareToKitchenReference({
      ingredientId: 'carrot',
      studentWastePercent: 9,
      historicalSamples: [{ ingredientId: 'onion', ingredientWeightGrams: 800, actualWasteGrams: 80 }],
    });
    expect(comparison?.source).toBe('seed');
  });
});
