import type { KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { durationPayload } from '@/products/kitchen-skills-challenge/domain/trim/timer';

export const KITCHEN_SKILLS_TRIM_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'ingredientId',
  'ingredientName',
  'ingredientWeightGrams',
  'trimTechniques',
  'estimatedWasteGrams',
  'actualWasteGrams',
  'duration',
] as const;

export type KitchenSkillsTrimPropertyRef = (typeof KITCHEN_SKILLS_TRIM_REQUIRED_REFS)[number];

export function orderedKitchenSkillsTrimPropertyRefs(): readonly KitchenSkillsTrimPropertyRef[] {
  return KITCHEN_SKILLS_TRIM_REQUIRED_REFS;
}

export function mapKitchenSkillsTrimSmart(entry: KitchenSkillsTrimEntry) {
  return {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    ingredientId: { value: entry.ingredientId },
    ingredientName: { value: entry.ingredientName },
    ingredientWeightGrams: { value: entry.ingredientWeightGrams },
    trimTechniques: { value: entry.trimTechniques },
    estimatedWasteGrams: { value: entry.estimatedWasteGrams },
    actualWasteGrams: { value: entry.actualWasteGrams },
    duration: durationPayload(entry.durationMinutes),
  };
}
