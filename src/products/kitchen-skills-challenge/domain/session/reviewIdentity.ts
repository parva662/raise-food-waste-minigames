import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
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

/** Recipes with saved Portion evidence, in feed order. */
export function listPortionRecipeIds(session: KitchenSkillsTrainerSession): string[] {
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
 * Every recipe that carries assessable evidence: Portion recipes first, then recipes
 * that only have Trim/Rescue rows with an explicit recipeId (must stay reachable in the UI).
 */
export function listSessionRecipeIds(session: KitchenSkillsTrainerSession): string[] {
  const ids = listPortionRecipeIds(session);
  const seen = new Set(ids);
  for (const pair of evidencedRecipeModules(session)) {
    if (seen.has(pair.recipeId)) continue;
    seen.add(pair.recipeId);
    ids.push(pair.recipeId);
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
  const ids = listPortionRecipeIds(session);
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
  if (portion?.recipeName) return portion.recipeName;
  return (rid ? getRecipeReference(rid)?.recipeName : null) ?? rid ?? recipeId;
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
  | 'awaiting_confirmation'
  | 'reviewed'
  | 'no_evidence';

/** Per evidenced recipe-module pair: nothing submitted, submitted but not in the feed, or confirmed. */
export type KitchenSkillsModuleAssessmentState =
  | 'needs_assessment'
  | 'awaiting_confirmation'
  | 'reviewed';

export function recipeModuleAssessmentState(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsModuleAssessmentState {
  const review = findRecipeModuleReview(session, recipeId, module);
  if (!review) return 'needs_assessment';
  return isReviewPersistConfirmed(review) ? 'reviewed' : 'awaiting_confirmation';
}

/**
 * Recipe REVIEWED only when every evidenced module is confirmed.
 * Any module with no submission keeps the recipe in NEEDS ASSESSMENT.
 */
export function recipeAssessmentStatus(
  session: KitchenSkillsTrainerSession,
  recipeId: string,
): KitchenSkillsRecipeAssessmentStatus {
  const rid = normalizeRecipeId(recipeId);
  if (!rid) return 'no_evidence';
  const pairs = evidencedRecipeModules(session).filter((pair) => pair.recipeId === rid);
  if (pairs.length === 0) return 'no_evidence';
  const states = pairs.map((pair) => recipeModuleAssessmentState(session, pair.recipeId, pair.module));
  if (states.includes('needs_assessment')) return 'needs_assessment';
  if (states.includes('awaiting_confirmation')) return 'awaiting_confirmation';
  return 'reviewed';
}

/** Count of Portion (and other) recipes whose every evidenced module is confirmed. */
export function countReviewedRecipes(session: KitchenSkillsTrainerSession): {
  reviewed: number;
  total: number;
} {
  const ids = listSessionRecipeIds(session);
  const reviewed = ids.filter((id) => recipeAssessmentStatus(session, id) === 'reviewed').length;
  return { reviewed, total: ids.length };
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
