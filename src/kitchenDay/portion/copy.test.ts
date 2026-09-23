import { describe, expect, it } from 'vitest';
import { formatFinalWeightDifference, formatPortionDeviation } from './copy';

describe('Portion Precision user-facing copy', () => {
  const required = {
    ingredientId: 'yogurt',
    ingredientName: 'Yogurt',
    requiredAmount: 100,
    unit: 'g' as const,
  };

  it('uses percentage deviation labels', () => {
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 100,
        unit: 'g',
      }),
    ).toBe('Exact');
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 110,
        unit: 'g',
      }),
    ).toBe('10.0% over');
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 75,
        unit: 'g',
      }),
    ).toBe('25.0% under');
  });

  it('formats final-weight difference from the expected reference weight', () => {
    expect(formatFinalWeightDifference(1850, 1850)).toBe('Exact');
    expect(formatFinalWeightDifference(1890, 1850)).toBe('40 g over');
    expect(formatFinalWeightDifference(1810, 1850)).toBe('40 g under');
  });
});
