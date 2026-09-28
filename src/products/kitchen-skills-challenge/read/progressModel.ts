import { wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type { KitchenDayChefSession } from '@/products/kitchen-skills-challenge/domain/types';

export interface KitchenDayProgressPoint {
  sessionId: string;
  sessionDate: string;
  wastePercent: number | null;
  durationMinutes: number | null;
  ingredientAccuracyPercent: number | null;
  finalWeightDeviationPercent: number | null;
  timeEfficiencyScore: number | null;
  preparationQualityScore: number | null;
}

export function buildKitchenDayProgressPoints(
  sessions: readonly KitchenDayChefSession[],
): KitchenDayProgressPoint[] {
  return [...sessions]
    .sort((left, right) => left.sessionDate.localeCompare(right.sessionDate))
    .map((session) => {
      const wasteValues = session.trimEntries.map((entry) =>
        wastePercentage(entry.actualWasteGrams, entry.ingredientWeightGrams),
      );
      const durations = session.trimEntries.map((entry) => entry.durationMinutes);
      const portionMetrics = session.portionEntries.map((entry) =>
        buildPortionRecipeMetrics(entry, getRecipeReference(entry.recipeId)),
      );
      return {
        sessionId: session.sessionId,
        sessionDate: session.sessionDate,
        wastePercent: average(wasteValues),
        durationMinutes: average(durations),
        ingredientAccuracyPercent: average(
          portionMetrics.flatMap((item) =>
            item.recipeIngredientAccuracyPercent == null ? [] : [item.recipeIngredientAccuracyPercent],
          ),
        ),
        finalWeightDeviationPercent: average(
          portionMetrics.flatMap((item) =>
            item.finalWeightDeviationPercent == null ? [] : [item.finalWeightDeviationPercent],
          ),
        ),
        timeEfficiencyScore: session.review?.timeEfficiencyScore ?? null,
        preparationQualityScore: session.review?.preparationQualityScore ?? null,
      };
    });
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
