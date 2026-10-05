import { wastePercentage } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { buildPortionRecipeMetrics } from '@/products/kitchen-skills-challenge/domain/portion/metrics';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { moduleHasEvidence } from '@/products/kitchen-skills-challenge/read/trainerSessions';

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

export type KitchenSkillsProgressMetricKey =
  | 'wastePercent'
  | 'durationMinutes'
  | 'ingredientAccuracyPercent'
  | 'finalWeightDeviationPercent';

export type KitchenSkillsProgressMetricOption = {
  key: KitchenSkillsProgressMetricKey;
  label: string;
  unit: 'percent' | 'minutes';
};

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

export function sortKitchenSkillsSessionsNewestFirst(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsTrainerSession[] {
  return [...sessions].sort((left, right) => {
    const byDate = right.sessionDate.localeCompare(left.sessionDate);
    if (byDate !== 0) return byDate;
    return right.sessionId.localeCompare(left.sessionId);
  });
}

export function progressMetricsForModule(
  module: KitchenSkillsReviewedModule,
): readonly KitchenSkillsProgressMetricOption[] {
  switch (module) {
    case 'trimSmart':
      return [
        { key: 'wastePercent', label: 'Waste rate', unit: 'percent' },
        { key: 'durationMinutes', label: 'Preparation duration', unit: 'minutes' },
      ];
    case 'rescueAndReuse':
      return [];
    case 'portionPrecision':
      return [
        { key: 'ingredientAccuracyPercent', label: 'Ingredient accuracy', unit: 'percent' },
        { key: 'finalWeightDeviationPercent', label: 'Final-weight deviation', unit: 'percent' },
      ];
  }
}

export function metricSeriesForModule(
  points: readonly KitchenSkillsProgressPoint[],
  key: KitchenSkillsProgressMetricKey,
): Array<{ sessionId: string; sessionDate: string; value: number }> {
  return points.flatMap((point) => {
    const value = point[key];
    if (value == null) return [];
    return [{ sessionId: point.sessionId, sessionDate: point.sessionDate, value }];
  });
}

export function sessionsForModule(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): KitchenSkillsTrainerSession[] {
  return sortKitchenSkillsSessionsNewestFirst(
    sessions.filter(
      (session) => moduleHasEvidence(session, module) || session.moduleReviews[module] !== null,
    ),
  );
}

export function moduleReviewHistory(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): Array<{ session: KitchenSkillsTrainerSession; review: KitchenSkillsReviewEntry }> {
  return sortKitchenSkillsSessionsNewestFirst(sessions).flatMap((session) => {
    const review = session.moduleReviews[module];
    if (!review) return [];
    return [{ session, review }];
  });
}

export function latestModuleReviewAcrossSessions(
  sessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
): { session: KitchenSkillsTrainerSession; review: KitchenSkillsReviewEntry } | null {
  return moduleReviewHistory(sessions, module)[0] ?? null;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
