import { wastePercentage } from '../trim/derived';
import type { KitchenDayChefSession } from '../types';

export interface KitchenDayProgressPoint {
  sessionId: string;
  sessionDate: string;
  wastePercent: number | null;
  durationMinutes: number | null;
  portionExactShare: number | null;
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
      return {
        sessionId: session.sessionId,
        sessionDate: session.sessionDate,
        wastePercent: average(wasteValues),
        durationMinutes: average(durations),
        portionExactShare: null,
        timeEfficiencyScore: session.review?.timeEfficiencyScore ?? null,
        preparationQualityScore: session.review?.preparationQualityScore ?? null,
      };
    });
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
