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
  emptySessionReviews,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

/**
 * Group the authenticated student's own Kitchen Skills activities by session.
 * Used by Student Progress from `kitchenGroupInputSelf.activities` (`GET /api/me/activities`).
 *
 * Identity isolation: `/api/me/activities` is not a trust boundary for `activity.actor.id`.
 * Only activities whose `actor.id` equals the authenticated GameBus user are attributed.
 * Missing authenticated identity or missing/foreign `actor.id` fail closed (no personal history).
 *
 * Tutor `wastePracticeReview` rows are included when `actor.id` is the student being reviewed
 * (on-behalf posts set actor to the student; `createdBy` may be the tutor).
 */
export function buildKitchenSkillsStudentProgressSessions(
  activities: readonly unknown[],
  identity: { actorId?: string | null; actorName?: string | null } = {},
): KitchenSkillsTrainerSession[] {
  const authenticatedActorId =
    typeof identity.actorId === 'string' && identity.actorId.trim().length > 0
      ? identity.actorId.trim()
      : null;
  if (!authenticatedActorId) {
    return [];
  }

  const authenticatedActorName =
    typeof identity.actorName === 'string' && identity.actorName.trim().length > 0
      ? identity.actorName.trim()
      : authenticatedActorId;

  const ownedActivities = activities.filter(
    (activity) => readActivityActorId(activity) === authenticatedActorId,
  );

  const sessions = new Map<string, KitchenSkillsTrainerSession>();

  const ensure = (activity: unknown, sessionId: string, sessionDate: string) => {
    const existing = sessions.get(sessionId);
    if (existing) return existing;
    const created: KitchenSkillsTrainerSession = {
      actorId: authenticatedActorId,
      actorName: readActivityActorName(activity) ?? authenticatedActorName,
      sessionId,
      sessionDate,
      trimEntries: [],
      rescueEntries: [],
      portionEntries: [],
      reviews: emptySessionReviews(),
      moduleReviews: emptyModuleReviews(),
    };
    sessions.set(sessionId, created);
    return created;
  };

  for (const activity of ownedActivities) {
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

  for (const activity of ownedActivities) {
    const review = parsePersistedReviewEntry(activity);
    if (!review) continue;
    // Review-only session shell: still requires actor.id === authenticated student.
    ensure(activity, review.sessionId, review.sessionDate);
    attachModuleReviewToMatchingSessions(sessions.values(), activity, review, {
      requireActorMatch: true,
    });
  }

  return [...sessions.values()].sort((left, right) => {
    const byDate = left.sessionDate.localeCompare(right.sessionDate);
    if (byDate !== 0) return byDate;
    return left.sessionId.localeCompare(right.sessionId);
  });
}
