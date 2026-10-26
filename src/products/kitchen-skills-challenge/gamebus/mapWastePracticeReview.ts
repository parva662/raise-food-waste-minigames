import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import {
  KITCHEN_SKILLS_REVIEWED_MODULES,
  type KitchenSkillsReviewedModule,
} from '@/products/kitchen-skills-challenge/domain/types';

export function isKitchenSkillsReviewedModule(value: unknown): value is KitchenSkillsReviewedModule {
  return (
    typeof value === 'string' &&
    (KITCHEN_SKILLS_REVIEWED_MODULES as readonly string[]).includes(value)
  );
}

/** Session-level tutor assessment — omit `reviewedGame` and `recipeId`. */
export const WASTE_PRACTICE_REVIEW_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'timeEfficiencyScore',
  'preparationQualityScore',
] as const;

/** Historical per-module properties — linked optional; never required for new session posts. */
export const WASTE_PRACTICE_REVIEW_DEPRECATED_MODULE_REFS = ['reviewedGame', 'recipeId'] as const;

export type WastePracticeReviewPropertyRef =
  | (typeof WASTE_PRACTICE_REVIEW_REQUIRED_REFS)[number]
  | 'chefFeedback';

export function orderedWastePracticeReviewPropertyRefs(
  entry: KitchenSkillsReviewEntry,
): readonly WastePracticeReviewPropertyRef[] {
  if (entry.chefFeedback?.trim()) {
    return [...WASTE_PRACTICE_REVIEW_REQUIRED_REFS, 'chefFeedback'];
  }
  return WASTE_PRACTICE_REVIEW_REQUIRED_REFS;
}

/**
 * Maps a session-level tutor assessment.
 * Does not post `reviewedGame` or `recipeId` (do not fabricate a module discriminator).
 */
export function mapWastePracticeReview(entry: KitchenSkillsReviewEntry) {
  if (entry.reviewedGame) {
    throw new Error('wastePracticeReview session posts must omit reviewedGame');
  }
  if (entry.recipeId?.trim()) {
    throw new Error('wastePracticeReview session posts must omit recipeId');
  }
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
