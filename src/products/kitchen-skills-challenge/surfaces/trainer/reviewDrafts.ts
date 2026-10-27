import type { KitchenSkillsReviewedModule } from '@/products/kitchen-skills-challenge/domain/types';

export type KitchenSkillsReviewFormDraft = {
  timeScore: string;
  qualityScore: string;
  feedback: string;
};

export const EMPTY_REVIEW_DRAFT: KitchenSkillsReviewFormDraft = {
  timeScore: '',
  qualityScore: '',
  feedback: '',
};

export function reviewDraftStorageKey(
  actorId: string,
  sessionId: string,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): string {
  return `${actorId}::${sessionId}::${recipeId}::${module}`;
}

export function isReviewDraftDirty(draft: KitchenSkillsReviewFormDraft | undefined): boolean {
  if (!draft) return false;
  return (
    draft.timeScore.trim().length > 0 ||
    draft.qualityScore.trim().length > 0 ||
    draft.feedback.trim().length > 0
  );
}

/** True when any unsent draft exists across sessions (pending dispatched rows are not drafts). */
export function hasAnyUnsavedReviewDraft(
  draftsByKey: Readonly<Record<string, KitchenSkillsReviewFormDraft>>,
): boolean {
  return Object.values(draftsByKey).some((draft) => isReviewDraftDirty(draft));
}
