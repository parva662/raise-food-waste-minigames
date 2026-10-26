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

/** One draft per student session (session-level assessment). */
export function reviewDraftStorageKey(actorId: string, sessionId: string): string {
  return `${actorId}::${sessionId}::session`;
}

export function isReviewDraftDirty(draft: KitchenSkillsReviewFormDraft | undefined): boolean {
  if (!draft) return false;
  return (
    draft.timeScore.trim().length > 0 ||
    draft.qualityScore.trim().length > 0 ||
    draft.feedback.trim().length > 0
  );
}

/** True when any unsent draft exists across sessions. */
export function hasAnyUnsavedReviewDraft(
  draftsByKey: Readonly<Record<string, KitchenSkillsReviewFormDraft>>,
): boolean {
  return Object.values(draftsByKey).some((draft) => isReviewDraftDirty(draft));
}
