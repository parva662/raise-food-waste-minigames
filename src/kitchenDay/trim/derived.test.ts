import { describe, expect, it } from 'vitest';
import { discardedWasteGrams, estimateDifferenceGrams, wastePercentage } from './derived';

describe('Kitchen Day Trim derived values', () => {
  it('calculates waste percentage without storing it', () => {
    expect(wastePercentage(450, 5000)).toBe(9);
  });

  it('calculates estimate difference and discarded remainder', () => {
    expect(estimateDifferenceGrams(600, 450)).toBe(150);
    expect(discardedWasteGrams(1000, 500)).toBe(500);
  });
});
