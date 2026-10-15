import { describe, expect, it } from 'vitest';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  eligibleRecipeIngredientsForTrim,
  hasReusableTrimWaste,
  latestPortionEntryBySubmittedAt,
  remainingRecipeIngredientsForTrim,
  resolveRecipeReferenceForTrimIngredient,
  selectActivePortionEntry,
  sessionRecipeEntry,
  sessionRecipeReference,
  trimIngredientAvailability,
} from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';

function portion(
  recipeId: string,
  recipeName: string,
  submittedAt: string,
): KitchenSkillsPortionEntry {
  return {
    sessionId: 'kitchen-day:t:user-1:2026-09-23',
    sessionDate: '2026-09-23',
    submittedAt,
    recipeId,
    recipeName,
    recipeComposition: [],
    finalRecipeWeightGrams: 3700,
    source: 'local',
  };
}

const hedelmat = portion('42', 'Hedelmät M,G', '2026-09-23T11:00:00.000Z');
const mustamakkara = portion('23', 'FLOW mustamakkara', '2026-09-23T11:05:00.000Z');
const smoothie = portion('5', 'Banaanismoothie L, G', '2026-09-23T11:10:00.000Z');

describe('session recipe for connected Trim', () => {
  it('selects the latest Portion by submittedAt, not array order', () => {
    expect(latestPortionEntryBySubmittedAt([smoothie, hedelmat, mustamakkara])?.recipeId).toBe('5');
    expect(selectActivePortionEntry([smoothie, hedelmat, mustamakkara], null)?.recipeId).toBe('5');
    expect(sessionRecipeEntry([])).toBeNull();
  });

  it('prefers an explicit active recipe id over array order and submission order', () => {
    expect(selectActivePortionEntry([smoothie, hedelmat, mustamakkara], '23')?.recipeName).toBe(
      'FLOW mustamakkara',
    );
    expect(sessionRecipeReference([smoothie, hedelmat, mustamakkara], '42')?.recipeId).toBe('42');
  });

  it('falls back to the latest submission when the preferred active id is missing', () => {
    expect(selectActivePortionEntry([hedelmat, smoothie], 'missing')?.recipeId).toBe('5');
  });

  it('offers only unused recipe ingredients with Hävikki greater than 0', () => {
    const recipe = getRecipeReference('5');
    expect(recipe).not.toBeNull();
    const remaining = remainingRecipeIngredientsForTrim(recipe!, []);
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

  it('joins a Trim ingredient to a recipe only when membership is unambiguous', () => {
    expect(resolveRecipeReferenceForTrimIngredient('banaani', [hedelmat])?.recipeId).toBe('42');
    expect(resolveRecipeReferenceForTrimIngredient('banaani', [smoothie, mustamakkara])).toBeNull();
    expect(
      resolveRecipeReferenceForTrimIngredient('banaani-banaani-1kg-peru-1lk', [smoothie])?.recipeId,
    ).toBe('5');
  });

  it('does not invent a recipe join when the same ingredientId appears in multiple saved recipes', () => {
    const aprikoosi = portion('4', 'Aprikoosi-omenalassi L, G', '2026-09-23T11:00:00.000Z');
    expect(
      resolveRecipeReferenceForTrimIngredient('banaani-banaani-1kg-peru-1lk', [aprikoosi, smoothie]),
    ).toBeNull();
  });
});
