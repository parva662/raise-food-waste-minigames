import { wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';

export interface KitchenSkillsProgressPoint {
  sessionId: string;
  sessionDate: string;
  wastePercent: number | null;
  durationMinutes: number | null;
  ingredientAccuracyPercent: number | null;
  finalWeightDeviationPercent: number | null;
  trimTimeEfficiencyScore: number | null;
  trimPreparationQualityScore: number | null;
  rescueTimeEfficiencyScore: number | null;
  rescuePreparationQualityScore: number | null;
  portionTimeEfficiencyScore: number | null;
  portionPreparationQualityScore: number | null;
}

export function buildKitchenSkillsProgressPoints(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsProgressPoint[] {
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
      const { trimSmart, rescueAndReuse, portionPrecision } = session.moduleReviews;
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
        trimTimeEfficiencyScore: trimSmart?.timeEfficiencyScore ?? null,
        trimPreparationQualityScore: trimSmart?.preparationQualityScore ?? null,
        rescueTimeEfficiencyScore: rescueAndReuse?.timeEfficiencyScore ?? null,
        rescuePreparationQualityScore: rescueAndReuse?.preparationQualityScore ?? null,
        portionTimeEfficiencyScore: portionPrecision?.timeEfficiencyScore ?? null,
        portionPreparationQualityScore: portionPrecision?.preparationQualityScore ?? null,
      };
    });
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
