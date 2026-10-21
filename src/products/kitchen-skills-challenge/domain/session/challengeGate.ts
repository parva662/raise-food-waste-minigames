import type { KitchenSkillsHashSection } from '@/app/routes';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  eligibleRecipeIngredientsForTrim,
  remainingRecipeIngredientsForTrim,
} from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

/**
 * Progress of one challenge attempt. An attempt has exactly one recipe: Portion is required,
 * Trim (any number of that recipe's ingredients) and Rescue (only for trimmed waste) are optional.
 */
export type KitchenSkillsTaskProgress = {
  portionComplete: boolean;
  recipeId: string | null;
  trimCount: number;
  rescueCount: number;
  trimInProgress: boolean;
  reuseInProgress: boolean;
  hasEligibleTrimIngredients: boolean;
  hasRemainingEligibleTrimIngredients: boolean;
  /** At least one trimmed ingredient of this recipe has actual waste above 0 g. */
  hasReusableTrimWaste: boolean;
  /** Trimmed ingredients with waste that still have no Rescue record. */
  remainingRescueIngredientIds: readonly string[];
};

export function hasKitchenSkillsDraftWork(progress: KitchenSkillsTaskProgress): boolean {
  return progress.trimInProgress || progress.reuseInProgress;
}

/** Finish is available as soon as Portion is saved; optional modules are never forced. */
export function canFinishKitchenSkillsChallenge(progress: KitchenSkillsTaskProgress): boolean {
  return progress.portionComplete;
}

/** Message for the confirm prompt before an unsaved measurement is abandoned (null = no draft). */
export function unsavedKitchenSkillsDraftMessage(progress: KitchenSkillsTaskProgress): string | null {
  if (progress.trimInProgress) {
    return 'Your Trim Smart measurement is not saved yet. Leave it without saving?';
  }
  if (progress.reuseInProgress) {
    return 'Your Rescue & Reuse entry is not saved yet. Leave it without saving?';
  }
  return null;
}

export function requiredKitchenSkillsSection(
  progress: KitchenSkillsTaskProgress,
): Exclude<KitchenSkillsHashSection, 'review'> {
  if (!progress.portionComplete) return 'portion';
  return progress.hasEligibleTrimIngredients ? 'trim' : 'portion';
}

export function canOpenKitchenSkillsReview(progress: KitchenSkillsTaskProgress): boolean {
  return progress.portionComplete;
}

export function isKitchenSkillsNavEnabled(
  section: KitchenSkillsHashSection,
  progress: KitchenSkillsTaskProgress,
): boolean {
  if (section === 'review') return canOpenKitchenSkillsReview(progress);
  if (section === 'portion') return true;
  if (section === 'trim') return progress.portionComplete && progress.hasEligibleTrimIngredients;
  return progress.portionComplete && progress.hasReusableTrimWaste;
}

export function buildKitchenSkillsTaskProgress(options: {
  portionEntries: readonly KitchenSkillsPortionEntry[];
  trimEntries: readonly KitchenSkillsTrimEntry[];
  rescueEntries: readonly KitchenSkillsRescueEntry[];
  trimInProgress: boolean;
  reuseInProgress: boolean;
}): KitchenSkillsTaskProgress {
  const { portionEntries, trimEntries, rescueEntries, trimInProgress, reuseInProgress } = options;
  const portion = portionEntries[0] ?? null;
  const recipeId = portion ? normalizeRecipeId(portion.recipeId) : null;
  const recipe = recipeId ? getRecipeReference(recipeId) : null;
  const trims = recipeId
    ? trimEntries.filter((entry) => normalizeRecipeId(entry.recipeId) === recipeId)
    : [];
  const rescues = recipeId
    ? rescueEntries.filter((entry) => normalizeRecipeId(entry.recipeId) === recipeId)
    : [];
  const eligible = recipe ? eligibleRecipeIngredientsForTrim(recipe) : [];
  const remaining = recipe
    ? remainingRecipeIngredientsForTrim(
        recipe,
        trims.map((entry) => entry.ingredientId),
      )
    : [];
  const withWaste = trims.filter((entry) => entry.actualWasteGrams > 0);
  return {
    portionComplete: portion !== null,
    recipeId,
    trimCount: trims.length,
    rescueCount: rescues.length,
    trimInProgress,
    reuseInProgress,
    hasEligibleTrimIngredients: eligible.length > 0,
    hasRemainingEligibleTrimIngredients: remaining.length > 0,
    hasReusableTrimWaste: withWaste.length > 0,
    remainingRescueIngredientIds: withWaste
      .filter((trim) => !rescues.some((rescue) => rescue.ingredientId === trim.ingredientId))
      .map((trim) => trim.ingredientId),
  };
}
