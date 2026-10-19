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

/** Per-recipe progress used for Finish (every saved recipe must be complete). */
export type KitchenSkillsRecipeProgress = {
  recipeId: string;
  hasEligibleTrimIngredients: boolean;
  hasRemainingEligibleTrimIngredients: boolean;
  trimCount: number;
  hasReusableTrimWaste: boolean;
  reuseComplete: boolean;
};

export type KitchenSkillsTaskProgress = {
  portionComplete: boolean;
  /** Active-recipe fields drive Trim/Reuse navigation. */
  trimCount: number;
  reuseComplete: boolean;
  trimInProgress: boolean;
  reuseInProgress: boolean;
  hasEligibleTrimIngredients: boolean;
  hasRemainingEligibleTrimIngredients: boolean;
  hasReusableTrimWaste: boolean;
  /** True when every saved Portion recipe satisfies its own completion rules. */
  allRecipesComplete: boolean;
  recipes: readonly KitchenSkillsRecipeProgress[];
};

export function hasKitchenSkillsDraftWork(progress: KitchenSkillsTaskProgress): boolean {
  return progress.trimInProgress || progress.reuseInProgress;
}

export function isKitchenSkillsRecipeComplete(recipe: KitchenSkillsRecipeProgress): boolean {
  if (!recipe.hasEligibleTrimIngredients) return true;
  if (recipe.trimCount === 0) return false;
  if (recipe.hasReusableTrimWaste) return recipe.reuseComplete;
  return true;
}

export function canFinishKitchenSkillsChallenge(progress: KitchenSkillsTaskProgress): boolean {
  if (!progress.portionComplete || hasKitchenSkillsDraftWork(progress)) return false;
  return progress.allRecipesComplete;
}

/**
 * A new Portion recipe may be started only when every already-saved recipe is complete
 * and there is no unfinished Trim/Reuse draft.
 */
export function canStartAnotherKitchenSkillsRecipe(progress: KitchenSkillsTaskProgress): boolean {
  if (progress.portionComplete === false) return true;
  return canFinishKitchenSkillsChallenge(progress);
}

/** Human-readable reason a new recipe cannot start yet (null when allowed). */
export function newRecipeBlockedReason(progress: KitchenSkillsTaskProgress): string | null {
  if (canStartAnotherKitchenSkillsRecipe(progress)) return null;
  if (hasKitchenSkillsDraftWork(progress)) {
    if (progress.trimInProgress) {
      return 'Finish the current Trim Smart measurement before starting another recipe.';
    }
    if (progress.reuseInProgress) {
      return 'Finish Rescue & Reuse for the current recipe before starting another recipe.';
    }
  }
  const unfinished = progress.recipes.find((recipe) => !isKitchenSkillsRecipeComplete(recipe));
  if (!unfinished) {
    return 'Finish the current recipe before starting another recipe.';
  }
  if (unfinished.hasEligibleTrimIngredients && unfinished.trimCount === 0) {
    return 'Complete Trim Smart for the saved recipe before starting another recipe.';
  }
  if (unfinished.hasReusableTrimWaste && !unfinished.reuseComplete) {
    return 'Complete Rescue & Reuse for the saved recipe before starting another recipe.';
  }
  return 'Finish the current recipe before starting another recipe.';
}

export function requiredKitchenSkillsSection(
  progress: KitchenSkillsTaskProgress,
): Exclude<KitchenSkillsHashSection, 'review'> {
  if (!progress.portionComplete) return 'portion';
  if (!progress.hasEligibleTrimIngredients) return 'trim';
  if (progress.trimCount === 0 || progress.trimInProgress) return 'trim';
  if (progress.hasReusableTrimWaste && (!progress.reuseComplete || progress.reuseInProgress)) {
    return 'reuse';
  }
  return 'trim';
}

export function canOpenKitchenSkillsReview(progress: KitchenSkillsTaskProgress): boolean {
  return canFinishKitchenSkillsChallenge(progress);
}

export function isKitchenSkillsNavEnabled(
  section: KitchenSkillsHashSection,
  progress: KitchenSkillsTaskProgress,
): boolean {
  if (section === 'review') return canOpenKitchenSkillsReview(progress);
  if (section === 'portion') return true;
  if (section === 'trim') return progress.portionComplete;
  return (
    progress.portionComplete &&
    progress.trimCount > 0 &&
    !progress.trimInProgress &&
    progress.hasReusableTrimWaste
  );
}

function trimsForRecipe(
  trimEntries: readonly KitchenSkillsTrimEntry[],
  recipeId: string,
): KitchenSkillsTrimEntry[] {
  const normalized = normalizeRecipeId(recipeId);
  if (!normalized) return [];
  return trimEntries.filter((entry) => normalizeRecipeId(entry.recipeId) === normalized);
}

function rescuesForRecipe(
  rescueEntries: readonly KitchenSkillsRescueEntry[],
  recipeId: string,
): KitchenSkillsRescueEntry[] {
  const normalized = normalizeRecipeId(recipeId);
  if (!normalized) return [];
  return rescueEntries.filter((entry) => normalizeRecipeId(entry.recipeId) === normalized);
}

export function buildKitchenSkillsRecipeProgress(
  recipeId: string,
  trimEntries: readonly KitchenSkillsTrimEntry[],
  rescueEntries: readonly KitchenSkillsRescueEntry[],
): KitchenSkillsRecipeProgress {
  const recipe = getRecipeReference(recipeId);
  const trims = trimsForRecipe(trimEntries, recipeId);
  const rescues = rescuesForRecipe(rescueEntries, recipeId);
  const recordedIngredientIds = trims.map((entry) => entry.ingredientId);
  const eligible = recipe ? eligibleRecipeIngredientsForTrim(recipe) : [];
  const remaining = recipe
    ? remainingRecipeIngredientsForTrim(recipe, recordedIngredientIds)
    : [];
  const hasReusableTrimWaste = trims.some((entry) => entry.actualWasteGrams > 0);
  return {
    recipeId,
    hasEligibleTrimIngredients: eligible.length > 0,
    hasRemainingEligibleTrimIngredients: remaining.length > 0,
    trimCount: trims.length,
    hasReusableTrimWaste,
    // Same product rule as before, scoped to this recipe: one Reuse satisfies when reusable waste exists.
    reuseComplete: rescues.length > 0,
  };
}

export function buildKitchenSkillsTaskProgress(options: {
  portionEntries: readonly KitchenSkillsPortionEntry[];
  trimEntries: readonly KitchenSkillsTrimEntry[];
  rescueEntries: readonly KitchenSkillsRescueEntry[];
  activeRecipeId: string | null;
  trimInProgress: boolean;
  reuseInProgress: boolean;
}): KitchenSkillsTaskProgress {
  const { portionEntries, trimEntries, rescueEntries, activeRecipeId, trimInProgress, reuseInProgress } =
    options;
  const recipes = portionEntries.map((portion) =>
    buildKitchenSkillsRecipeProgress(portion.recipeId, trimEntries, rescueEntries),
  );
  const active =
    (activeRecipeId
      ? recipes.find((recipe) => normalizeRecipeId(recipe.recipeId) === normalizeRecipeId(activeRecipeId))
      : null) ??
    recipes[recipes.length - 1] ??
    null;

  return {
    portionComplete: portionEntries.length > 0,
    trimInProgress,
    reuseInProgress,
    trimCount: active?.trimCount ?? 0,
    reuseComplete: active?.reuseComplete ?? false,
    hasEligibleTrimIngredients: active?.hasEligibleTrimIngredients ?? false,
    hasRemainingEligibleTrimIngredients: active?.hasRemainingEligibleTrimIngredients ?? false,
    hasReusableTrimWaste: active?.hasReusableTrimWaste ?? false,
    allRecipesComplete:
      recipes.length > 0 && recipes.every((recipe) => isKitchenSkillsRecipeComplete(recipe)),
    recipes,
  };
}
