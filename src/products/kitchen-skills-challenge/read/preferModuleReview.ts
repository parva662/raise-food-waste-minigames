import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { reviewIdentityKey } from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';

/**
 * Deterministic per-module preference when both a legacy `reviewedGame` review and a
 * combined review (or two combined rows) cover the same student session + recipe + module.
 *
 * Rule (documented product contract):
 * 1. Later `submittedAt` wins (ISO lexicographic / chronological).
 * 2. Equal timestamps: lexicographically greater `persistId` wins.
 * 3. Still tied: lexicographically greater `reviewIdentityKey` + score fingerprint wins.
 *
 * Never double-count: callers keep exactly one entry per review identity key.
 */
export function compareModuleReviewsForPreference(
  left: KitchenSkillsReviewEntry,
  right: KitchenSkillsReviewEntry,
): number {
  const byTime = left.submittedAt.localeCompare(right.submittedAt);
  if (byTime !== 0) return byTime;
  const leftPersist = left.persistId ?? '';
  const rightPersist = right.persistId ?? '';
  const byPersist = leftPersist.localeCompare(rightPersist);
  if (byPersist !== 0) return byPersist;
  const leftFinger = `${reviewIdentityKey(left)}:${left.timeEfficiencyScore}:${left.preparationQualityScore}:${left.chefFeedback ?? ''}`;
  const rightFinger = `${reviewIdentityKey(right)}:${right.timeEfficiencyScore}:${right.preparationQualityScore}:${right.chefFeedback ?? ''}`;
  return leftFinger.localeCompare(rightFinger);
}

export function preferModuleReview(
  left: KitchenSkillsReviewEntry,
  right: KitchenSkillsReviewEntry,
): KitchenSkillsReviewEntry {
  return compareModuleReviewsForPreference(left, right) >= 0 ? left : right;
}

/** Collapse many reviews into one winner per `sessionId + recipeId + reviewedGame`. */
export function dedupeReviewsByModulePreference(
  reviews: readonly KitchenSkillsReviewEntry[],
): KitchenSkillsReviewEntry[] {
  const byKey = new Map<string, KitchenSkillsReviewEntry>();
  for (const review of reviews) {
    const key = reviewIdentityKey(review);
    const existing = byKey.get(key);
    byKey.set(key, existing ? preferModuleReview(existing, review) : review);
  }
  return [...byKey.values()];
}

/** True when a persisted feed row confirms the exact scores the tutor submitted. */
export function reviewValuesMatch(
  submitted: KitchenSkillsReviewEntry,
  persisted: KitchenSkillsReviewEntry,
): boolean {
  return (
    reviewIdentityKey(submitted) === reviewIdentityKey(persisted) &&
    submitted.timeEfficiencyScore === persisted.timeEfficiencyScore &&
    submitted.preparationQualityScore === persisted.preparationQualityScore &&
    (submitted.chefFeedback?.trim() ?? '') === (persisted.chefFeedback?.trim() ?? '')
  );
}
