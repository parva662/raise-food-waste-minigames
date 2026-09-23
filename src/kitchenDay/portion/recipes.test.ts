import { describe, expect, it } from 'vitest';
import { getRecipeReference, listRecipeReferences } from './recipes';

describe('Kitchen Day recipe reference adapter', () => {
  it('loads a valid generated recipe with expected final weight and gram targets', () => {
    const recipe = getRecipeReference('1');
    expect(recipe?.recipeName).toBe('Ankanrinta FLOW');
    expect(recipe?.expectedFinalWeightGrams).toBe(13500);
    expect(recipe?.lines.find((line) => line.ingredientId === 'ankka-rintafilee')).toMatchObject({
      ingredientName: 'ANKKA, RINTAFILEE',
      requiredAmount: 11250,
      unit: 'g',
    });
    expect(listRecipeReferences().length).toBeGreaterThan(1);
  });

  it('returns null for a missing recipe instead of inventing amounts', () => {
    expect(getRecipeReference('mayonnaise')).toBeNull();
    expect(getRecipeReference('')).toBeNull();
  });
});
