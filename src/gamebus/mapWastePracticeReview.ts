import type { KitchenDayReviewEntry } from '../kitchenDay/types';

export const WASTE_PRACTICE_REVIEW_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'timeEfficiencyScore',
  'preparationQualityScore',
] as const;

export type WastePracticeReviewPropertyRef =
  | (typeof WASTE_PRACTICE_REVIEW_REQUIRED_REFS)[number]
  | 'chefFeedback';

export function orderedWastePracticeReviewPropertyRefs(
  entry: KitchenDayReviewEntry,
): readonly WastePracticeReviewPropertyRef[] {
  if (entry.chefFeedback?.trim()) {
    return [...WASTE_PRACTICE_REVIEW_REQUIRED_REFS, 'chefFeedback'];
  }
  return WASTE_PRACTICE_REVIEW_REQUIRED_REFS;
}

export function mapWastePracticeReview(entry: KitchenDayReviewEntry) {
  const values: Partial<Record<WastePracticeReviewPropertyRef, { value: string | number }>> = {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    timeEfficiencyScore: { value: entry.timeEfficiencyScore },
    preparationQualityScore: { value: entry.preparationQualityScore },
  };
  if (entry.chefFeedback?.trim()) {
    values.chefFeedback = { value: entry.chefFeedback.trim() };
  }
  return values;
}
