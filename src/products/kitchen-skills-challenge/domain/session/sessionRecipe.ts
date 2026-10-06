import type { RecipeReference, RecipeReferenceLine } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';

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

export function remainingRecipeIngredientsForTrim(
  recipe: RecipeReference,
  recordedIngredientIds: readonly string[],
): RecipeReferenceLine[] {
  const recorded = new Set(recordedIngredientIds);
  return recipe.lines.filter((line) => !recorded.has(line.ingredientId));
}
