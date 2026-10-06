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
  recipeId: '1',
  recipeName: 'Ankanrinta FLOW',
  recipeComposition: [],
  finalRecipeWeightGrams: 13500,
  source: 'local',
};

describe('session recipe for connected Trim', () => {
  it('uses the first recorded Portion recipe for the session', () => {
    expect(sessionRecipeEntry([portion])?.recipeId).toBe('1');
    expect(sessionRecipeEntry([])).toBeNull();
  });

  it('omits already recorded recipe ingredients from Trim', () => {
    const recipe = getRecipeReference('1');
    expect(recipe).not.toBeNull();
    const remaining = remainingRecipeIngredientsForTrim(recipe!, ['ankka-rintafilee']);
    expect(remaining.map((line) => line.ingredientId)).not.toContain('ankka-rintafilee');
    expect(remaining.length).toBe((recipe?.lines.length ?? 0) - 1);
  });
});
