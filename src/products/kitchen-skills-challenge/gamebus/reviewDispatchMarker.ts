import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import { reviewIdentityKey } from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
} from '@/products/kitchen-skills-challenge/domain/types';

const STORAGE_PREFIX = 'ks-review-dispatched:';

export type KitchenSkillsReviewDispatchMarker = {
  actorId: string;
  sessionId: string;
  recipeId: string;
  reviewedGame: KitchenSkillsReviewedModule;
  sessionDate: string;
  submittedAt: string;
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
};

function storageKey(actorId: string, entry: {
  sessionId: string;
  recipeId?: string | null;
  reviewedGame: KitchenSkillsReviewedModule;
}): string | null {
  const actor = actorId.trim();
  const recipeId = normalizeRecipeId(entry.recipeId ?? '');
  if (!actor || !entry.sessionId || !recipeId) return null;
  return `${STORAGE_PREFIX}${actor}:${reviewIdentityKey({
    sessionId: entry.sessionId,
    recipeId,
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
): void {
  const key = storageKey(actorId, entry);
  const recipeId = normalizeRecipeId(entry.recipeId ?? '');
  if (!key || !recipeId || !canUseSessionStorage()) return;
  const marker: KitchenSkillsReviewDispatchMarker = {
    actorId: actorId.trim(),
    sessionId: entry.sessionId,
    recipeId,
    reviewedGame: entry.reviewedGame,
    sessionDate: entry.sessionDate,
    submittedAt: entry.submittedAt,
    timeEfficiencyScore: entry.timeEfficiencyScore,
    preparationQualityScore: entry.preparationQualityScore,
    ...(entry.chefFeedback?.trim() ? { chefFeedback: entry.chefFeedback.trim() } : {}),
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
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.recipeId !== 'string' ||
      typeof parsed.reviewedGame !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Build awaiting local rows from markers for tutor sessions (reload recovery). */
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
      out.push({
        sessionId: marker.sessionId,
        sessionDate: marker.sessionDate,
        submittedAt: marker.submittedAt,
        recipeId: marker.recipeId,
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
