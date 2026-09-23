import type { KitchenDayRescueEntry } from '../kitchenDay/types';

export const RESCUE_AND_REUSE_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'ingredientId',
  'reusableWasteGrams',
  'reuseDestination',
  'submittedAt',
] as const;

export type RescueAndReusePropertyRef = (typeof RESCUE_AND_REUSE_REQUIRED_REFS)[number];

export function orderedRescueAndReusePropertyRefs(): readonly RescueAndReusePropertyRef[] {
  return RESCUE_AND_REUSE_REQUIRED_REFS;
}

export function mapRescueAndReuse(entry: KitchenDayRescueEntry) {
  return {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    ingredientId: { value: entry.ingredientId },
    reusableWasteGrams: { value: entry.reusableWasteGrams },
    reuseDestination: { value: entry.reuseDestination },
    submittedAt: { value: entry.submittedAt },
  };
}
