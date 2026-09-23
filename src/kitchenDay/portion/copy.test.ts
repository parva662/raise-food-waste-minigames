import { describe, expect, it } from 'vitest';
import { formatPortionDeviation } from './copy';

describe('Portion Precision user-facing copy', () => {
  const required = {
    ingredientId: 'yogurt',
    ingredientName: 'Yogurt',
    requiredAmount: 1000,
    unit: 'g' as const,
  };

  it('uses human labels instead of machine outcomes', () => {
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 1000,
        unit: 'g',
      }),
    ).toBe('Exact');
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 1020,
        unit: 'g',
      }),
    ).toBe('20 g over');
    expect(
      formatPortionDeviation(required, {
        ingredientId: 'yogurt',
        ingredientName: 'Yogurt',
        actualAmount: 800,
        unit: 'g',
      }),
    ).toBe('200 g under');
  });
});
