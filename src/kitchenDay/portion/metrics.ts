import type { KitchenDayPortionEntry, RecipeCompositionLine } from '../types';
import type { RecipeReference, RecipeReferenceLine } from './recipes';

export interface IngredientPortionMetric {
  ingredientId: string;
  ingredientName: string;
  targetAmount: number | null;
  actualAmount: number;
  unit: string;
  differenceGrams: number | null;
  signedDeviationPercent: number | null;
  absoluteErrorPercent: number | null;
}

export interface PortionRecipeMetrics {
  recipeId: string;
  recipeName: string;
  recipeIngredientErrorPercent: number | null;
  recipeIngredientAccuracyPercent: number | null;
  expectedFinalWeightGrams: number | null;
  recordedFinalWeightGrams: number;
  finalWeightDifferenceGrams: number | null;
  finalWeightDeviationPercent: number | null;
  ingredients: IngredientPortionMetric[];
}

export function signedDeviationPercent(actualAmount: number, targetAmount: number): number | null {
  if (!(targetAmount > 0) || !Number.isFinite(actualAmount)) return null;
  return ((actualAmount - targetAmount) / targetAmount) * 100;
}

export function absoluteErrorPercent(actualAmount: number, targetAmount: number): number | null {
  const signed = signedDeviationPercent(actualAmount, targetAmount);
  return signed == null ? null : Math.abs(signed);
}

export function recipeIngredientErrorPercent(
  lines: readonly { actualAmount: number; targetAmount: number }[],
): number | null {
  const usable = lines.filter((line) => line.targetAmount > 0 && Number.isFinite(line.actualAmount));
  if (usable.length === 0) return null;
  const targetSum = usable.reduce((sum, line) => sum + line.targetAmount, 0);
  if (!(targetSum > 0)) return null;
  const absoluteSum = usable.reduce(
    (sum, line) => sum + Math.abs(line.actualAmount - line.targetAmount),
    0,
  );
  return (absoluteSum / targetSum) * 100;
}

export function recipeIngredientAccuracyPercent(errorPercent: number | null): number | null {
  if (errorPercent == null || !Number.isFinite(errorPercent)) return null;
  return Math.max(0, 100 - errorPercent);
}

export function finalWeightDifferenceGrams(
  recordedFinalWeightGrams: number,
  expectedFinalWeightGrams: number,
): number | null {
  if (!(expectedFinalWeightGrams > 0) || !Number.isFinite(recordedFinalWeightGrams)) return null;
  return recordedFinalWeightGrams - expectedFinalWeightGrams;
}

export function finalWeightDeviationPercent(
  recordedFinalWeightGrams: number,
  expectedFinalWeightGrams: number,
): number | null {
  const difference = finalWeightDifferenceGrams(recordedFinalWeightGrams, expectedFinalWeightGrams);
  if (difference == null) return null;
  return (Math.abs(difference) / expectedFinalWeightGrams) * 100;
}

export function measureIngredientLine(
  actual: RecipeCompositionLine,
  required: RecipeReferenceLine | undefined,
): IngredientPortionMetric {
  const targetAmount = required && required.requiredAmount > 0 ? required.requiredAmount : null;
  const signed =
    targetAmount == null ? null : signedDeviationPercent(actual.actualAmount, targetAmount);
  return {
    ingredientId: actual.ingredientId,
    ingredientName: actual.ingredientName,
    targetAmount,
    actualAmount: actual.actualAmount,
    unit: actual.unit,
    differenceGrams: targetAmount == null ? null : actual.actualAmount - targetAmount,
    signedDeviationPercent: signed,
    absoluteErrorPercent: signed == null ? null : Math.abs(signed),
  };
}

export function buildPortionRecipeMetrics(
  entry: KitchenDayPortionEntry,
  recipe: RecipeReference | null,
): PortionRecipeMetrics {
  const ingredients = entry.recipeComposition.map((line) =>
    measureIngredientLine(
      line,
      recipe?.lines.find((item) => item.ingredientId === line.ingredientId),
    ),
  );
  const error = recipe
    ? recipeIngredientErrorPercent(
        ingredients.flatMap((item) =>
          item.targetAmount == null
            ? []
            : [{ actualAmount: item.actualAmount, targetAmount: item.targetAmount }],
        ),
      )
    : null;
  const expected = recipe && recipe.expectedFinalWeightGrams > 0 ? recipe.expectedFinalWeightGrams : null;
  return {
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    recipeIngredientErrorPercent: error,
    recipeIngredientAccuracyPercent: recipeIngredientAccuracyPercent(error),
    expectedFinalWeightGrams: expected,
    recordedFinalWeightGrams: entry.finalRecipeWeightGrams,
    finalWeightDifferenceGrams:
      expected == null ? null : finalWeightDifferenceGrams(entry.finalRecipeWeightGrams, expected),
    finalWeightDeviationPercent:
      expected == null ? null : finalWeightDeviationPercent(entry.finalRecipeWeightGrams, expected),
    ingredients,
  };
}
