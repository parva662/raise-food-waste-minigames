import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';

/** Unique key for a recipe-module tutor assessment (or legacy session-level). */
export function reviewIdentityKey(review: {
  sessionId: string;
  recipeId?: string | null;
  reviewedGame: KitchenSkillsReviewedModule;
}): string {
  const recipePart = normalizeRecipeId(review.recipeId ?? '') || '__legacy__';
  return `${review.sessionId}::${recipePart}::${review.reviewedGame}`;
}

export function isLegacySessionReview(review: KitchenSkillsReviewEntry): boolean {
  return !normalizeRecipeId(review.recipeId ?? '');
}

export type EvidencedRecipeModule = {
  recipeId: string;
  module: KitchenSkillsReviewedModule;
};

export function listSessionRecipeIds(session: KitchenSkillsTrainerSession): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const portion of session.portionEntries) {
    const rid = normalizeRecipeId(portion.recipeId);
    if (!rid || seen.has(rid)) continue;
    seen.add(rid);
    ids.push(rid);
  }
  return ids;
}

/**
 * Resolve which recipe an evidence row belongs to.
 * Legacy Trim/Rescue rows without recipeId attach to the sole Portion recipe when unambiguous.
 */
export function resolveEvidenceRecipeId(
  session: KitchenSkillsTrainerSession,
  entryRecipeId?: string | null,
): string | null {
  const rid = normalizeRecipeId(entryRecipeId ?? '');
  if (rid) return rid;
  const ids = listSessionRecipeIds(session);
  return ids.length === 1 ? ids[0]! : null;
}

export function recipeModuleHasEvidence(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): boolean {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return false;
  switch (module) {
    case 'portionPrecision':
      return session.portionEntries.some((entry) => normalizeRecipeId(entry.recipeId) === rid);
    case 'trimSmart':
      return session.trimEntries.some(
        (entry) => resolveEvidenceRecipeId(session, entry.recipeId) === rid,
      );
    case 'rescueAndReuse':
      return session.rescueEntries.some(
        (entry) => resolveEvidenceRecipeId(session, entry.recipeId) === rid,
      );
  }
}

/** Every evidenced (recipeId, module) pair that requires an independent tutor assessment. */
export function evidencedRecipeModules(
  session: KitchenSkillsTrainerSession,
): EvidencedRecipeModule[] {
  const pairs: EvidencedRecipeModule[] = [];
  const seen = new Set<string>();

  const push = (recipeId: string, module: KitchenSkillsReviewedModule) => {
    const rid = normalizeRecipeId(recipeId);
    if (!rid) return;
    const key = `${rid}::${module}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ recipeId: rid, module });
  };

  for (const portion of session.portionEntries) {
    push(portion.recipeId, 'portionPrecision');
  }
  for (const trim of session.trimEntries) {
    const rid = resolveEvidenceRecipeId(session, trim.recipeId);
    if (rid) push(rid, 'trimSmart');
  }
  for (const rescue of session.rescueEntries) {
    const rid = resolveEvidenceRecipeId(session, rescue.recipeId);
    if (rid) push(rid, 'rescueAndReuse');
  }

  return pairs;
}

/** A review is confirmed only after GameBus hydration (or a non-embed local commit). */
export function isReviewPersistConfirmed(review: KitchenSkillsReviewEntry): boolean {
  if (review.awaitingPersist) return false;
  return review.source === 'persisted' || Boolean(review.persistId);
}

export function findRecipeModuleReview(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsReviewEntry | null {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return null;
  return (
    session.reviews.find(
      (review) =>
        !isLegacySessionReview(review) &&
        normalizeRecipeId(review.recipeId ?? '') === rid &&
        review.reviewedGame === module,
    ) ?? null
  );
}

export function findConfirmedRecipeModuleReview(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsReviewEntry | null {
  const review = findRecipeModuleReview(session, recipeId, module);
  return review && isReviewPersistConfirmed(review) ? review : null;
}

export function findAwaitingRecipeModuleReview(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsReviewEntry | null {
  const review = findRecipeModuleReview(session, recipeId, module);
  return review && !isReviewPersistConfirmed(review) ? review : null;
}

export function recipeDisplayName(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): string {
  const rid = normalizeRecipeId(recipeId);
  const portion = session.portionEntries.find(
    (entry) => normalizeRecipeId(entry.recipeId) === rid,
  );
  return portion?.recipeName ?? rid ?? recipeId;
}

export function reviewsForRecipe(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsReviewEntry[] {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return [];
  return session.reviews.filter(
    (review) =>
      !isLegacySessionReview(review) && normalizeRecipeId(review.recipeId ?? '') === rid,
  );
}

export function legacySessionReviews(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsReviewEntry[] {
  return session.reviews.filter(isLegacySessionReview);
}

export function hasRecipeModuleReview(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): boolean {
  return findConfirmedRecipeModuleReview(session, recipeId, module) !== null;
}

export function recipeModulesAwaitingAssessment(
  session: KitchenSkillsTrainerSession,
): EvidencedRecipeModule[] {
  return evidencedRecipeModules(session).filter(
    (pair) => !hasRecipeModuleReview(session, pair.recipeId, pair.module),
  );
}

export type KitchenSkillsRecipeAssessmentStatus =
  | 'needs_assessment'
  | 'reviewed'
  | 'no_evidence';

/** Recipe REVIEWED only when every evidenced module for that recipe has a confirmed assessment. */
export function recipeAssessmentStatus(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsRecipeAssessmentStatus {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return 'no_evidence';
  const pairs = evidencedRecipeModules(session).filter((pair) => pair.recipeId === rid);
  if (pairs.length === 0) return 'no_evidence';
  const awaiting = pairs.filter(
    (pair) => findConfirmedRecipeModuleReview(session, pair.recipeId, pair.module) === null,
  );
  return awaiting.length === 0 ? 'reviewed' : 'needs_assessment';
}

/** Whether a review conflicts with an existing confirmed one for the same identity. */
export function hasDuplicateReviewIdentity(
  reviews: readonly KitchenSkillsReviewEntry[],
  candidate: KitchenSkillsReviewEntry,
): boolean {
  const key = reviewIdentityKey(candidate);
  return reviews.some(
    (item) => reviewIdentityKey(item) === key && isReviewPersistConfirmed(item),
  );
}

/** Any in-memory row (confirmed or awaiting) for the same identity. */
export function findReviewByIdentity(
  reviews: readonly KitchenSkillsReviewEntry[],
  candidate: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
): KitchenSkillsReviewEntry | null {
  const key = reviewIdentityKey(candidate);
  return reviews.find((item) => reviewIdentityKey(item) === key) ?? null;
}

/**
 * Modules that have evidence but cannot be attributed to a recipe still use
 * legacy session-level {@link KitchenSkillsTrainerSession.moduleReviews}.
 */
export function unattributedEvidenceModules(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsReviewedModule[] {
  const attributed = new Set(evidencedRecipeModules(session).map((pair) => pair.module));
  return KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) => {
    if (attributed.has(module)) return false;
    switch (module) {
      case 'trimSmart':
        return session.trimEntries.length > 0;
      case 'rescueAndReuse':
        return session.rescueEntries.length > 0;
      case 'portionPrecision':
        return session.portionEntries.length > 0;
    }
  });
}

export { KITCHEN_SKILLS_REVIEWED_MODULES };
