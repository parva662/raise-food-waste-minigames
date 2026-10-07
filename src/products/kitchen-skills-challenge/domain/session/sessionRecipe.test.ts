import { describe, expect, it } from 'vitest';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  eligibleRecipeIngredientsForTrim,
  hasReusableTrimWaste,
  remainingRecipeIngredientsForTrim,
  sessionRecipeEntry,
  trimIngredientAvailability,
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

  it('treats Ankanrinta as having no eligible Trim ingredients', () => {
    const recipe = getRecipeReference('1');
    expect(eligibleRecipeIngredientsForTrim(recipe!)).toEqual([]);
    expect(trimIngredientAvailability(recipe!, [])).toBe('none-eligible');
    expect(remainingRecipeIngredientsForTrim(recipe!, [])).toEqual([]);
  });

  it('distinguishes remaining eligible ingredients from all recorded', () => {
    const recipe = getRecipeReference('42');
    expect(trimIngredientAvailability(recipe!, [])).toBe('remaining');
    expect(trimIngredientAvailability(recipe!, ['banaani'])).toBe('remaining');
    expect(trimIngredientAvailability(recipe!, ['banaani', 'omena', 'viinirypale-tumma-kiveton'])).toBe(
      'all-recorded',
    );
  });

  it('treats only actual waste above 0 as reusable Trim waste', () => {
    expect(hasReusableTrimWaste([])).toBe(false);
    expect(
      hasReusableTrimWaste([
        {
          sessionId: 'kitchen-day:t:user-1:2026-09-23',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T11:00:00.000Z',
          ingredientId: 'banaani',
          ingredientName: 'Banaani',
          ingredientWeightGrams: 5000,
          trimTechniques: 'trimming',
          estimatedWasteGrams: 600,
          actualWasteGrams: 0,
          durationMinutes: 1,
          preparationStartedAt: '2026-09-23T11:00:00.000Z',
          preparationEndedAt: '2026-09-23T11:01:00.000Z',
          source: 'local',
        },
      ]),
    ).toBe(false);
    expect(
      hasReusableTrimWaste([
        {
          sessionId: 'kitchen-day:t:user-1:2026-09-23',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T11:00:00.000Z',
          ingredientId: 'banaani',
          ingredientName: 'Banaani',
          ingredientWeightGrams: 5000,
          trimTechniques: 'trimming',
          estimatedWasteGrams: 600,
          actualWasteGrams: 450,
          durationMinutes: 1,
          preparationStartedAt: '2026-09-23T11:00:00.000Z',
          preparationEndedAt: '2026-09-23T11:01:00.000Z',
          source: 'local',
        },
      ]),
    ).toBe(true);
  });
});
