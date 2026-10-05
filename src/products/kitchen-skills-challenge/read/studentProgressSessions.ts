import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import {
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedReviewEntry,
  parsePersistedTrimEntry,
  readActivityActorId,
  readActivityActorName,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import {
  attachModuleReviewToMatchingSessions,
  emptyModuleReviews,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

/**
 * Group the authenticated student's own Kitchen Skills activities by session.
 * Used by Student Progress from `kitchenGroupInputSelf.activities` (`GET /api/me/activities`).
 * Self-scoped: do not require `activity.actor.id`, and do not wait for `wastePracticeReview`.
 */
export function buildKitchenSkillsStudentProgressSessions(
  activities: readonly unknown[],
  identity: { actorId?: string | null; actorName?: string | null } = {},
): KitchenSkillsTrainerSession[] {
  const fallbackActorId = identity.actorId && identity.actorId.length > 0 ? identity.actorId : 'self';
  const fallbackActorName =
    identity.actorName && identity.actorName.length > 0 ? identity.actorName : fallbackActorId;
  const sessions = new Map<string, KitchenSkillsTrainerSession>();

  const ensure = (activity: unknown, sessionId: string, sessionDate: string) => {
    const existing = sessions.get(sessionId);
    if (existing) {
      const actorId = readActivityActorId(activity);
      if (actorId && existing.actorId === fallbackActorId) {
        existing.actorId = actorId;
        existing.actorName = readActivityActorName(activity) ?? existing.actorName;
      }
      return existing;
    }
    const actorId = readActivityActorId(activity) ?? fallbackActorId;
    const created: KitchenSkillsTrainerSession = {
      actorId,
      actorName: readActivityActorName(activity) ?? fallbackActorName,
      sessionId,
      sessionDate,
      trimEntries: [],
      rescueEntries: [],
      portionEntries: [],
      moduleReviews: emptyModuleReviews(),
    };
    sessions.set(sessionId, created);
    return created;
  };

  for (const activity of activities) {
    const trim = parsePersistedTrimEntry(activity);
    if (trim) {
      const session = ensure(activity, trim.sessionId, trim.sessionDate);
      session.trimEntries.push(trim);
      continue;
    }
    const rescue = parsePersistedRescueEntry(activity);
    if (rescue) {
      const session = ensure(activity, rescue.sessionId, rescue.sessionDate);
      session.rescueEntries.push(rescue);
      continue;
    }
    const portion = parsePersistedPortionEntry(activity);
    if (portion) {
      const session = ensure(activity, portion.sessionId, portion.sessionDate);
      session.portionEntries.push(portion);
    }
  }

  for (const activity of activities) {
    const review = parsePersistedReviewEntry(activity);
    if (!review) continue;
    // Ensure a session shell exists so a persisted review still surfaces when
    // evidence for that sessionId is missing/unparseable in the same self feed.
    ensure(activity, review.sessionId, review.sessionDate);
    // Self Progress is one student; sessions are keyed by sessionId. Actor ids on
    // evidence vs review can disagree (fallback "self" vs real actor), so match by session only.
    attachModuleReviewToMatchingSessions(sessions.values(), activity, review, {
      requireActorMatch: false,
    });
  }

  return [...sessions.values()].sort((left, right) => {
    const byDate = left.sessionDate.localeCompare(right.sessionDate);
    if (byDate !== 0) return byDate;
    return left.sessionId.localeCompare(right.sessionId);
  });
}
