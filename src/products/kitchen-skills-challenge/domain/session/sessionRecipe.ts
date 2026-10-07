import type { RecipeReference, RecipeReferenceLine } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type { KitchenSkillsPortionEntry, KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';

export type TrimIngredientAvailability = 'none-eligible' | 'remaining' | 'all-recorded';

export function sessionRecipeEntry(
  portionEntries: readonly KitchenSkillsPortionEntry[],
): KitchenSkillsPortionEntry | null {
  return portionEntries[0] ?? null;
}

export function sessionRecipeReference(
  portionEntries: readonly KitchenSkillsPortionEntry[],
): RecipeReference | null {
  const entry = sessionRecipeEntry(portionEntries);
  if (!entry) return null;
  return getRecipeReference(entry.recipeId);
}

export function isEligibleTrimIngredient(line: RecipeReferenceLine): boolean {
  return (line.referenceWastePercent ?? 0) > 0;
}

export function eligibleRecipeIngredientsForTrim(recipe: RecipeReference): RecipeReferenceLine[] {
  return recipe.lines.filter(isEligibleTrimIngredient);
}

export function remainingRecipeIngredientsForTrim(
  recipe: RecipeReference,
  recordedIngredientIds: readonly string[],
): RecipeReferenceLine[] {
  const recorded = new Set(recordedIngredientIds);
  return eligibleRecipeIngredientsForTrim(recipe).filter((line) => !recorded.has(line.ingredientId));
}

export function trimIngredientAvailability(
  recipe: RecipeReference,
  recordedIngredientIds: readonly string[],
): TrimIngredientAvailability {
  if (eligibleRecipeIngredientsForTrim(recipe).length === 0) return 'none-eligible';
  return remainingRecipeIngredientsForTrim(recipe, recordedIngredientIds).length === 0
    ? 'all-recorded'
    : 'remaining';
}

export function hasReusableTrimWaste(trimEntries: readonly KitchenSkillsTrimEntry[]): boolean {
  return trimEntries.some((entry) => entry.actualWasteGrams > 0);
}
