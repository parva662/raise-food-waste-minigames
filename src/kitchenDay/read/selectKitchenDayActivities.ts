import {
  filterActivitiesByTemplateReference,
  getActivityTemplateReference,
} from '../../gamebus/groupActivities';
import type { HistoricalTrimSample } from '../trim/reference';
import {
  readActivityPropertyNumber,
  readActivityPropertyString,
} from './groupActivityProperties';

export const KITCHEN_DAY_ACTIVITY_TEMPLATES = [
  'trimSmart',
  'rescueAndReuse',
  'portionPrecision',
  'wastePracticeReview',
] as const;

export function selectKitchenDayActivities(activities: readonly unknown[]): unknown[] {
  return activities.filter((activity) => {
    const template = getActivityTemplateReference(activity);
    return (
      template !== null &&
      (KITCHEN_DAY_ACTIVITY_TEMPLATES as readonly string[]).includes(template)
    );
  });
}

export function selectTrimSmartActivities(activities: readonly unknown[]): unknown[] {
  return filterActivitiesByTemplateReference(activities, 'trimSmart');
}

export function historicalTrimSamplesFromGroupActivities(
  activities: readonly unknown[],
): HistoricalTrimSample[] {
  return selectTrimSmartActivities(activities).flatMap((activity) => {
    const ingredientId = readActivityPropertyString(activity, 'ingredientId');
    const ingredientWeightGrams = readActivityPropertyNumber(activity, 'ingredientWeightGrams');
    const actualWasteGrams =
      readActivityPropertyNumber(activity, 'actualWasteGrams') ??
      readActivityPropertyNumber(activity, 'participantWasteGrams');
    if (!ingredientId || ingredientWeightGrams == null || ingredientWeightGrams <= 0) {
      return [];
    }
    if (actualWasteGrams == null) return [];
    return [{ ingredientId, ingredientWeightGrams, actualWasteGrams }];
  });
}

export function findTrimEntryKeys(activity: unknown): {
  sessionId: string | null;
  ingredientId: string | null;
} {
  return {
    sessionId: readActivityPropertyString(activity, 'sessionId'),
    ingredientId: readActivityPropertyString(activity, 'ingredientId'),
  };
}
