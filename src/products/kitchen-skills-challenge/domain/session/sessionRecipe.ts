import type { RecipeReference, RecipeReferenceLine } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type { KitchenSkillsPortionEntry, KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';

export type TrimIngredientAvailability = 'none-eligible' | 'remaining' | 'all-recorded';

/** Milliseconds since epoch for a Portion submission; unparseable instants sort as earliest. */
export function portionSubmissionInstantMs(entry: KitchenSkillsPortionEntry): number {
  const ms = Date.parse(entry.submittedAt);
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

/** Latest valid Portion entry by `submittedAt` (not array order). */
export function latestPortionEntryBySubmittedAt(
  portionEntries: readonly KitchenSkillsPortionEntry[],
): KitchenSkillsPortionEntry | null {
  if (portionEntries.length === 0) return null;
  let latest: KitchenSkillsPortionEntry | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;
  for (const entry of portionEntries) {
    const ms = portionSubmissionInstantMs(entry);
    if (ms >= latestMs) {
      latest = entry;
      latestMs = ms;
    }
  }
  return latest;
}

/**
 * Active Portion row for the Kitchen Skills challenge UI.
 * Prefer an explicit `activeRecipeId` (latest submission of that recipe); otherwise the
 * most recently submitted valid Portion entry.
 */
export function selectActivePortionEntry(
  portionEntries: readonly KitchenSkillsPortionEntry[],
  activeRecipeId?: string | null,
): KitchenSkillsPortionEntry | null {
  if (activeRecipeId) {
    let latestMatch: KitchenSkillsPortionEntry | null = null;
    let latestMs = Number.NEGATIVE_INFINITY;
    for (const entry of portionEntries) {
      if (entry.recipeId !== activeRecipeId) continue;
      const ms = portionSubmissionInstantMs(entry);
      if (ms >= latestMs) {
        latestMatch = entry;
        latestMs = ms;
      }
    }
    if (latestMatch) return latestMatch;
  }
  return latestPortionEntryBySubmittedAt(portionEntries);
}

/** @deprecated Prefer {@link selectActivePortionEntry} with an explicit active recipe id. */
export function sessionRecipeEntry(
  portionEntries: readonly KitchenSkillsPortionEntry[],
  activeRecipeId?: string | null,
): KitchenSkillsPortionEntry | null {
  return selectActivePortionEntry(portionEntries, activeRecipeId);
}

export function sessionRecipeReference(
  portionEntries: readonly KitchenSkillsPortionEntry[],
  activeRecipeId?: string | null,
): RecipeReference | null {
  const entry = selectActivePortionEntry(portionEntries, activeRecipeId);
  if (!entry) return null;
  return getRecipeReference(entry.recipeId);
}

/**
 * Infer which saved Portion recipe a Trim ingredient belongs to for JAMIX comparison.
 * Trim activities do not persist `recipeId`. When zero or multiple saved recipes contain
 * the ingredient, association is ambiguous — return null (reference unavailable).
 */
export function resolveRecipeReferenceForTrimIngredient(
  ingredientId: string,
  portionEntries: readonly KitchenSkillsPortionEntry[],
): RecipeReference | null {
  const matchingRecipeIds = new Set<string>();
  for (const entry of portionEntries) {
    const recipe = getRecipeReference(entry.recipeId);
    if (!recipe) continue;
    if (recipe.lines.some((line) => line.ingredientId === ingredientId)) {
      matchingRecipeIds.add(entry.recipeId);
    }
  }
  if (matchingRecipeIds.size !== 1) return null;
  const [recipeId] = matchingRecipeIds;
  return recipeId ? getRecipeReference(recipeId) : null;
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
