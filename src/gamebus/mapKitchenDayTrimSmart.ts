import type { KitchenDayTrimEntry } from '../kitchenDay/types';
import { durationPayload } from '../kitchenDay/trim/timer';

export const KITCHEN_DAY_TRIM_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'ingredientId',
  'ingredientName',
  'ingredientCategory',
  'ingredientWeightGrams',
  'trimTechniques',
  'estimatedWasteGrams',
  'actualWasteGrams',
  'duration',
] as const;

export type KitchenDayTrimPropertyRef = (typeof KITCHEN_DAY_TRIM_REQUIRED_REFS)[number];

export function orderedKitchenDayTrimPropertyRefs(): readonly KitchenDayTrimPropertyRef[] {
  return KITCHEN_DAY_TRIM_REQUIRED_REFS;
}

export function mapKitchenDayTrimSmart(entry: KitchenDayTrimEntry) {
  return {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    ingredientId: { value: entry.ingredientId },
    ingredientName: { value: entry.ingredientName },
    ingredientCategory: { value: entry.ingredientCategory },
    ingredientWeightGrams: { value: entry.ingredientWeightGrams },
    trimTechniques: { value: entry.trimTechniques },
    estimatedWasteGrams: { value: entry.estimatedWasteGrams },
    actualWasteGrams: { value: entry.actualWasteGrams },
    duration: durationPayload(entry.durationMinutes),
  };
}
