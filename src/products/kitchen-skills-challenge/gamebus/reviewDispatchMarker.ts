import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  isSessionLevelAssessment,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
} from '@/products/kitchen-skills-challenge/domain/types';

const STORAGE_PREFIX = 'ks-review-dispatched:';

export type KitchenSkillsReviewDispatchMarker = {
  actorId: string;
  sessionId: string;
  recipeId?: string;
  reviewedGame?: KitchenSkillsReviewedModule;
  sessionDate: string;
  submittedAt: string;
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
  /** Fingerprint of the trainer feed the tutor was looking at when the assessment was sent. */
  feedFingerprintAtDispatch?: string;
};

/**
 * Order-independent fingerprint of the trainer feed (activity ids). GameBus may replay a cached
 * INPUT_COLLECTIONS payload to a reloaded iframe, so receipt time alone does not prove a new fetch.
 */
export function kitchenSkillsTrainerFeedFingerprint(activities: readonly unknown[]): string {
  const ids = activities
    .map((activity) =>
      activity && typeof activity === 'object' ? (activity as { id?: unknown }).id : undefined,
    )
    .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number')
    .map(String)
    .sort();
  let hash = 5381;
  for (const id of ids) {
    for (let index = 0; index < id.length; index += 1) {
      hash = ((hash * 33) ^ id.charCodeAt(index)) >>> 0;
    }
    hash = ((hash * 33) ^ 44) >>> 0;
  }
  return `${ids.length}:${hash.toString(36)}`;
}

function storageKey(
  actorId: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
): string | null {
  const actor = actorId.trim();
  if (!actor || !entry.sessionId) return null;
  return `${STORAGE_PREFIX}${actor}:${reviewIdentityKey({
    sessionId: entry.sessionId,
    recipeId: entry.recipeId,
    reviewedGame: entry.reviewedGame,
  })}`;
}

function canUseSessionStorage(): boolean {
  try {
    return typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Non-authoritative marker that a SILENT_ACTIVITY was dispatched for this assessment.
 * Never treat as GameBus persistence confirmation — only blocks accidental re-post after reload.
 */
export function markKitchenSkillsReviewDispatched(
  actorId: string,
  entry: KitchenSkillsReviewEntry,
  feedFingerprintAtDispatch?: string | null,
): void {
  const key = storageKey(actorId, entry);
  if (!key || !canUseSessionStorage()) return;
  const recipeId = normalizeRecipeId(entry.recipeId ?? '') || undefined;
  const marker: KitchenSkillsReviewDispatchMarker = {
    actorId: actorId.trim(),
    sessionId: entry.sessionId,
    ...(recipeId ? { recipeId } : {}),
    ...(entry.reviewedGame ? { reviewedGame: entry.reviewedGame } : {}),
    sessionDate: entry.sessionDate,
    submittedAt: entry.submittedAt,
    timeEfficiencyScore: entry.timeEfficiencyScore,
    preparationQualityScore: entry.preparationQualityScore,
    ...(entry.chefFeedback?.trim() ? { chefFeedback: entry.chefFeedback.trim() } : {}),
    ...(feedFingerprintAtDispatch ? { feedFingerprintAtDispatch } : {}),
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(marker));
  } catch {
    // Quota / private mode — in-memory attempt keys still protect the current tab.
  }
}

export function hasKitchenSkillsReviewDispatchMarker(
  actorId: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
): boolean {
  const key = storageKey(actorId, entry);
  if (!key || !canUseSessionStorage()) return false;
  try {
    return sessionStorage.getItem(key) != null;
  } catch {
    return false;
  }
}

export function clearKitchenSkillsReviewDispatchMarker(
  actorId: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
): void {
  const key = storageKey(actorId, entry);
  if (!key || !canUseSessionStorage()) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readKitchenSkillsReviewDispatchMarker(
  actorId: string,
  entry: Pick<KitchenSkillsReviewEntry, 'sessionId' | 'recipeId' | 'reviewedGame'>,
): KitchenSkillsReviewDispatchMarker | null {
  const key = storageKey(actorId, entry);
  if (!key || !canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KitchenSkillsReviewDispatchMarker;
    if (typeof parsed.sessionId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** GameBus normally stores a silent activity within seconds; allow generous slack. */
export const KITCHEN_SKILLS_FEED_CONFIRMATION_GRACE_MS = 60_000;

export type KitchenSkillsTrainerFeedState = {
  receivedAtMs: number | null;
  fingerprint: string | null;
  /** The feed contains this student's evidence for the review's session. */
  sessionInFeed: boolean;
};

/**
 * Historical helper for per-module awaiting UX. Session-level assessments do not use
 * awaiting-confirmation screens; this remains for marker-based duplicate protection tests.
 */
export function isAwaitingReviewMissingFromRefreshedFeed(
  review: Pick<
    KitchenSkillsReviewEntry,
    'awaitingPersist' | 'submittedAt' | 'sessionId' | 'recipeId' | 'reviewedGame'
  >,
  studentActorId: string,
  feed: KitchenSkillsTrainerFeedState,
): boolean {
  if (!review.awaitingPersist || feed.receivedAtMs == null || !feed.fingerprint) return false;
  if (!feed.sessionInFeed) return false;
  const marker = readKitchenSkillsReviewDispatchMarker(studentActorId, review);
  if (!marker || marker.actorId !== studentActorId.trim() || marker.sessionId !== review.sessionId) {
    return false;
  }
  if (isSessionLevelAssessment(review)) {
    if (marker.reviewedGame || marker.recipeId) return false;
  } else if (
    marker.reviewedGame !== review.reviewedGame ||
    marker.recipeId !== normalizeRecipeId(review.recipeId ?? '')
  ) {
    return false;
  }
  if (!marker.feedFingerprintAtDispatch || marker.feedFingerprintAtDispatch === feed.fingerprint) {
    return false;
  }
  const submittedMs = Date.parse(review.submittedAt);
  if (!Number.isFinite(submittedMs)) return false;
  return submittedMs + KITCHEN_SKILLS_FEED_CONFIRMATION_GRACE_MS < feed.receivedAtMs;
}

/** Build local rows from markers for tutor sessions (reload duplicate protection). */
export function awaitingReviewsFromDispatchMarkers(
  sessions: readonly { actorId: string; sessionId: string }[],
): KitchenSkillsReviewEntry[] {
  if (!canUseSessionStorage()) return [];
  const out: KitchenSkillsReviewEntry[] = [];
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      let marker: KitchenSkillsReviewDispatchMarker;
      try {
        marker = JSON.parse(raw) as KitchenSkillsReviewDispatchMarker;
      } catch {
        continue;
      }
      const matches = sessions.some(
        (session) =>
          session.actorId === marker.actorId && session.sessionId === marker.sessionId,
      );
      if (!matches) continue;
      // Session-level markers restore as submitted-not-confirmed (never fabricate persistId).
      if (!marker.reviewedGame) {
        out.push({
          sessionId: marker.sessionId,
          sessionDate: marker.sessionDate,
          submittedAt: marker.submittedAt,
          timeEfficiencyScore: marker.timeEfficiencyScore,
          preparationQualityScore: marker.preparationQualityScore,
          ...(marker.chefFeedback ? { chefFeedback: marker.chefFeedback } : {}),
          source: 'local',
          awaitingPersist: true,
        });
        continue;
      }
      out.push({
        sessionId: marker.sessionId,
        sessionDate: marker.sessionDate,
        submittedAt: marker.submittedAt,
        ...(marker.recipeId ? { recipeId: marker.recipeId } : {}),
        reviewedGame: marker.reviewedGame,
        timeEfficiencyScore: marker.timeEfficiencyScore,
        preparationQualityScore: marker.preparationQualityScore,
        ...(marker.chefFeedback ? { chefFeedback: marker.chefFeedback } : {}),
        source: 'local',
        awaitingPersist: true,
      });
    }
  } catch {
    return out;
  }
  return out;
}

export function clearKitchenSkillsReviewDispatchMarkersForTests(): void {
  if (!canUseSessionStorage()) return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    for (const key of keys) sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
