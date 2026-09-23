import { describe, expect, it } from 'vitest';
import { evaluatePortionLine } from './deviations';
import { getRecipeReference } from './recipes';
import { buildRecipeComposition, canSubmitPortion } from './validation';

describe('Portion Precision', () => {
  it('loads required amounts from the generated recipe reference', () => {
    const recipe = getRecipeReference('1');
    expect(recipe?.recipeName).toBe('Ankanrinta FLOW');
    expect(recipe?.expectedFinalWeightGrams).toBe(13500);
    expect(recipe?.lines.find((line) => line.ingredientId === 'ankka-rintafilee')).toMatchObject({
      requiredAmount: 11250,
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
    const recipe = getRecipeReference('1')!;
    const complete = {
      'ankka-rintafilee': '11250',
      'rosmariini-tuore-100g': '450',
      'berner-merisuola-keskikarkea-25': '900',
      'meira-luomu-mustapippuri': '900',
    };
    expect(buildRecipeComposition(recipe, complete)?.[0]).toMatchObject({
      ingredientId: 'ankka-rintafilee',
      actualAmount: 11250,
      unit: 'g',
    });
    expect(canSubmitPortion({ recipe, actualsByIngredientId: complete, finalWeightRaw: '' })).toBe(false);
    expect(canSubmitPortion({ recipe, actualsByIngredientId: complete, finalWeightRaw: '13500' })).toBe(true);
  });
});
