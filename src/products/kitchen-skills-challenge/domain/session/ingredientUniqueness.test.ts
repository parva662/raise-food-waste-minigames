import { describe, expect, it } from 'vitest';
import { assertIngredientAvailableInSession, isIngredientAlreadyRecorded } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';

describe('Kitchen Day ingredient uniqueness', () => {
  it('allows a different ingredient', () => {
    expect(isIngredientAlreadyRecorded(['carrot'], 'potato')).toBe(false);
  });

  it('blocks the same ingredientId twice', () => {
    expect(isIngredientAlreadyRecorded(['carrot'], 'carrot')).toBe(true);
    expect(() => assertIngredientAvailableInSession(['carrot'], 'carrot')).toThrow(/already recorded/);
  });
});
