import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';

export const WASTE_PRACTICE_REVIEW_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'reviewedGame',
  'timeEfficiencyScore',
  'preparationQualityScore',
] as const;

export type WastePracticeReviewPropertyRef =
  | (typeof WASTE_PRACTICE_REVIEW_REQUIRED_REFS)[number]
  | 'chefFeedback';

export function isKitchenSkillsReviewedModule(value: unknown): value is KitchenSkillsReviewedModule {
  return (
    typeof value === 'string' &&
    (KITCHEN_SKILLS_REVIEWED_MODULES as readonly string[]).includes(value)
  );
}

export function orderedWastePracticeReviewPropertyRefs(
  entry: KitchenSkillsReviewEntry,
): readonly WastePracticeReviewPropertyRef[] {
  if (entry.chefFeedback?.trim()) {
    return [...WASTE_PRACTICE_REVIEW_REQUIRED_REFS, 'chefFeedback'];
  }
  return WASTE_PRACTICE_REVIEW_REQUIRED_REFS;
}

export function mapWastePracticeReview(entry: KitchenSkillsReviewEntry) {
  const values: Partial<Record<WastePracticeReviewPropertyRef, { value: string | number }>> = {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    reviewedGame: { value: entry.reviewedGame },
    timeEfficiencyScore: { value: entry.timeEfficiencyScore },
    preparationQualityScore: { value: entry.preparationQualityScore },
  };
  if (entry.chefFeedback?.trim()) {
    values.chefFeedback = { value: entry.chefFeedback.trim() };
  }
  return values;
}
