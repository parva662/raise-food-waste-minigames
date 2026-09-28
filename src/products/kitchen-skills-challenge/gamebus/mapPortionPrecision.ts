import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';

export const PORTION_PRECISION_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'recipeId',
  'recipeName',
  'recipeComposition',
  'finalRecipeWeightGrams',
] as const;

export type PortionPrecisionPropertyRef = (typeof PORTION_PRECISION_REQUIRED_REFS)[number];

export function orderedPortionPrecisionPropertyRefs(): readonly PortionPrecisionPropertyRef[] {
  return PORTION_PRECISION_REQUIRED_REFS;
}

export function mapPortionPrecision(entry: KitchenSkillsPortionEntry) {
  return {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    recipeId: { value: entry.recipeId },
    recipeName: { value: entry.recipeName },
    recipeComposition: { value: entry.recipeComposition },
    finalRecipeWeightGrams: { value: entry.finalRecipeWeightGrams },
  };
}
