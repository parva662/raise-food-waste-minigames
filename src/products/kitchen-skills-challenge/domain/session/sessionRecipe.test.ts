import { describe, expect, it } from 'vitest';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  remainingRecipeIngredientsForTrim,
  sessionRecipeEntry,
} from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';

const portion: KitchenSkillsPortionEntry = {
  sessionId: 'kitchen-day:t:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T11:00:00.000Z',
  recipeId: '42',
  recipeName: 'Hedelmät M,G',
  recipeComposition: [],
  finalRecipeWeightGrams: 3700,
  source: 'local',
};

describe('session recipe for connected Trim', () => {
  it('uses the first recorded Portion recipe for the session', () => {
    expect(sessionRecipeEntry([portion])?.recipeId).toBe('42');
    expect(sessionRecipeEntry([])).toBeNull();
  });

  it('offers only unused recipe ingredients with Hävikki greater than 0', () => {
    const smoothie = getRecipeReference('5');
    expect(smoothie).not.toBeNull();
    const remaining = remainingRecipeIngredientsForTrim(smoothie!, []);
    expect(remaining.map((line) => line.ingredientId)).toEqual(['banaani-banaani-1kg-peru-1lk']);
    expect(remaining.every((line) => (line.referenceWastePercent ?? 0) > 0)).toBe(true);
  });

  it('omits already recorded trim ingredients and 0% Hävikki lines', () => {
    const recipe = getRecipeReference('42');
    expect(recipe).not.toBeNull();
    const remaining = remainingRecipeIngredientsForTrim(recipe!, ['banaani']);
    expect(remaining.map((line) => line.ingredientId)).toEqual(['omena', 'viinirypale-tumma-kiveton']);
    expect(remaining.map((line) => line.ingredientId)).not.toContain('banaani');
  });

  it('does not offer Ankanrinta ingredients because every Hävikki reference is 0', () => {
    const recipe = getRecipeReference('1');
    expect(remainingRecipeIngredientsForTrim(recipe!, [])).toEqual([]);
  });
});
