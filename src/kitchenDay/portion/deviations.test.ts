import { describe, expect, it } from 'vitest';
import { evaluatePortionLine } from './deviations';
import { getRecipeReference } from './recipes';
import { buildRecipeComposition, canSubmitPortion } from './validation';

describe('Portion Precision', () => {
  it('loads required amounts from the stub recipe dataset', () => {
    const mayonnaise = getRecipeReference('mayonnaise');
    expect(mayonnaise?.recipeName).toBe('Mayonnaise');
    expect(mayonnaise?.lines.find((line) => line.ingredientId === 'yogurt')).toMatchObject({
      requiredAmount: 1000,
      unit: 'g',
    });
  });

  it('evaluates exact and any deviation without a tolerance band', () => {
    const required = {
      ingredientId: 'lemon-juice',
      ingredientName: 'Lemon juice',
      requiredAmount: 100,
      unit: 'g' as const,
    };
    expect(
      evaluatePortionLine(required, {
        ingredientId: 'lemon-juice',
        ingredientName: 'Lemon juice',
        actualAmount: 100,
        unit: 'g',
      }),
    ).toBe('exact match');
    expect(
      evaluatePortionLine(required, {
        ingredientId: 'lemon-juice',
        ingredientName: 'Lemon juice',
        actualAmount: 120,
        unit: 'g',
      }),
    ).toBe('over-measure');
    expect(
      evaluatePortionLine(required, {
        ingredientId: 'lemon-juice',
        ingredientName: 'Lemon juice',
        actualAmount: 99,
        unit: 'g',
      }),
    ).toBe('under-measure');
  });

  it('requires every actual and a final recipe weight', () => {
    const recipe = getRecipeReference('mayonnaise')!;
    const complete = {
      yogurt: '1000',
      'lemon-juice': '100',
      salt: '8',
      pepper: '2',
    };
    expect(buildRecipeComposition(recipe, complete)?.[0]).toMatchObject({
      ingredientId: 'yogurt',
      ingredientName: 'Yogurt',
      actualAmount: 1000,
      unit: 'g',
    });
    expect(canSubmitPortion({ recipe, actualsByIngredientId: complete, finalWeightRaw: '' })).toBe(false);
    expect(canSubmitPortion({ recipe, actualsByIngredientId: complete, finalWeightRaw: '1850' })).toBe(true);
  });
});
