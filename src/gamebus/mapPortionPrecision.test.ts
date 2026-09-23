import { describe, expect, it } from 'vitest';
import { mapPortionPrecision, orderedPortionPrecisionPropertyRefs } from './mapPortionPrecision';

describe('Portion Precision mapper contract', () => {
  it('posts one recipe activity with nested recipeComposition', () => {
    expect(orderedPortionPrecisionPropertyRefs()).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'recipeId',
      'recipeName',
      'recipeComposition',
      'finalRecipeWeightGrams',
    ]);
    const values = mapPortionPrecision({
      sessionId: 'kitchen-day:standalone:2026-09-23',
      sessionDate: '2026-09-23',
      submittedAt: '2026-09-23T11:00:00.000Z',
      recipeId: 'mayonnaise',
      recipeName: 'Mayonnaise',
      recipeComposition: [
        { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
      ],
      finalRecipeWeightGrams: 1850,
    });
    expect(values.recipeComposition.value[0]).toEqual({
      ingredientId: 'yogurt',
      ingredientName: 'Yogurt',
      actualAmount: 1000,
      unit: 'g',
    });
    expect(values).not.toHaveProperty('ingredientId');
    expect(values).not.toHaveProperty('ingredientName');
    expect(values).not.toHaveProperty('ingredientCategory');
    expect(values).not.toHaveProperty('actualIngredientWeightGrams');
  });
});
