import { wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import type { RecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import { sessionRecipeReference } from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

export type TrimReferenceUnavailableReason = 'missing-recipe' | 'missing-ingredient' | 'missing-reference';

export type TrimIngredientObjectiveComparison =
  | {
      status: 'available';
      ingredientId: string;
      ingredientName: string;
      startingWeightGrams: number;
      actualRemovedGrams: number;
      actualTrimPercent: number;
      referenceWastePercent: number;
      referenceRemovedGrams: number;
      deltaPercentagePoints: number;
    }
  | {
      status: 'unavailable';
      ingredientId: string;
      ingredientName: string;
      startingWeightGrams: number;
      actualRemovedGrams: number;
      actualTrimPercent: number | null;
      reason: TrimReferenceUnavailableReason;
    };

export type TrimSessionObjectiveComparison =
  | {
      status: 'available';
      actualRemovedGrams: number;
      referenceRemovedGrams: number;
      totalStartingWeightGrams: number;
      actualTrimPercent: number;
      referenceTrimPercent: number;
      deltaPercentagePoints: number;
      ingredients: TrimIngredientObjectiveComparison[];
    }
  | {
      status: 'unavailable';
      actualRemovedGrams: number;
      totalStartingWeightGrams: number;
      actualTrimPercent: number | null;
      ingredients: TrimIngredientObjectiveComparison[];
    };

function hasNumericReference(value: number | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function actualTrimPercentOrNull(removedGrams: number, startingWeightGrams: number): number | null {
  if (!(startingWeightGrams > 0) || !Number.isFinite(removedGrams)) return null;
  return wastePercentage(removedGrams, startingWeightGrams);
}

export function compareTrimIngredientToRecipeReference(
  entry: KitchenSkillsTrimEntry,
  recipe: RecipeReference | null,
): TrimIngredientObjectiveComparison {
  const actualTrimPercent = actualTrimPercentOrNull(entry.actualWasteGrams, entry.ingredientWeightGrams);
  const base = {
    ingredientId: entry.ingredientId,
    ingredientName: entry.ingredientName,
    startingWeightGrams: entry.ingredientWeightGrams,
    actualRemovedGrams: entry.actualWasteGrams,
    actualTrimPercent,
  };

  if (!recipe) {
    return { ...base, status: 'unavailable', reason: 'missing-recipe' };
  }

  const line = recipe.lines.find((item) => item.ingredientId === entry.ingredientId);
  if (!line) {
    return { ...base, status: 'unavailable', reason: 'missing-ingredient' };
  }
  if (!hasNumericReference(line.referenceWastePercent) || actualTrimPercent == null) {
    return { ...base, status: 'unavailable', reason: 'missing-reference' };
  }

  const referenceRemovedGrams = (entry.ingredientWeightGrams * line.referenceWastePercent) / 100;
  return {
    ...base,
    status: 'available',
    actualTrimPercent,
    referenceWastePercent: line.referenceWastePercent,
    referenceRemovedGrams,
    deltaPercentagePoints: actualTrimPercent - line.referenceWastePercent,
  };
}

export function compareTrimSessionToRecipeReference(
  trimEntries: readonly KitchenSkillsTrimEntry[],
  recipe: RecipeReference | null,
): TrimSessionObjectiveComparison {
  const ingredients = trimEntries.map((entry) => compareTrimIngredientToRecipeReference(entry, recipe));
  const totalStartingWeightGrams = trimEntries.reduce((sum, entry) => sum + entry.ingredientWeightGrams, 0);
  const actualRemovedGrams = trimEntries.reduce((sum, entry) => sum + entry.actualWasteGrams, 0);
  const actualTrimPercent = actualTrimPercentOrNull(actualRemovedGrams, totalStartingWeightGrams);

  const comparable = ingredients.filter(
    (item): item is Extract<TrimIngredientObjectiveComparison, { status: 'available' }> =>
      item.status === 'available',
  );
  if (comparable.length === 0 || comparable.length !== ingredients.length || actualTrimPercent == null) {
    return {
      status: 'unavailable',
      actualRemovedGrams,
      totalStartingWeightGrams,
      actualTrimPercent,
      ingredients,
    };
  }

  const referenceRemovedGrams = comparable.reduce((sum, item) => sum + item.referenceRemovedGrams, 0);
  const referenceTrimPercent = (referenceRemovedGrams / totalStartingWeightGrams) * 100;
  return {
    status: 'available',
    actualRemovedGrams,
    referenceRemovedGrams,
    totalStartingWeightGrams,
    actualTrimPercent,
    referenceTrimPercent,
    deltaPercentagePoints: actualTrimPercent - referenceTrimPercent,
    ingredients,
  };
}

export function compareTrimSessionFromPortion(
  trimEntries: readonly KitchenSkillsTrimEntry[],
  portionEntries: readonly KitchenSkillsPortionEntry[],
): TrimSessionObjectiveComparison {
  return compareTrimSessionToRecipeReference(trimEntries, sessionRecipeReference(portionEntries));
}
