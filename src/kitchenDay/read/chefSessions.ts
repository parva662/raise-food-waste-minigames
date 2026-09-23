import type { KitchenDayChefSession } from '../types';
import {
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedReviewEntry,
  parsePersistedTrimEntry,
  readActivityActorId,
  readActivityActorName,
} from './kitchenDayReadModel';

export function chefSessionKey(actorId: string, sessionId: string): string {
  return `${actorId}::${sessionId}`;
}

export function buildKitchenDayChefSessions(
  activities: readonly unknown[],
): KitchenDayChefSession[] {
  const sessions = new Map<string, KitchenDayChefSession>();

  const ensure = (activity: unknown, sessionId: string, sessionDate: string) => {
    const actorId = readActivityActorId(activity);
    if (!actorId) return null;
    const key = chefSessionKey(actorId, sessionId);
    const existing = sessions.get(key);
    if (existing) return existing;
    const created: KitchenDayChefSession = {
      actorId,
      actorName: readActivityActorName(activity) ?? actorId,
      sessionId,
      sessionDate,
      trimEntries: [],
      rescueEntries: [],
      portionEntries: [],
      review: null,
    };
    sessions.set(key, created);
    return created;
  };

  for (const activity of activities) {
    const trim = parsePersistedTrimEntry(activity);
    if (trim) {
      const session = ensure(activity, trim.sessionId, trim.sessionDate);
      session?.trimEntries.push(trim);
      continue;
    }
    const rescue = parsePersistedRescueEntry(activity);
    if (rescue) {
      const session = ensure(activity, rescue.sessionId, rescue.sessionDate);
      session?.rescueEntries.push(rescue);
      continue;
    }
    const portion = parsePersistedPortionEntry(activity);
    if (portion) {
      const session = ensure(activity, portion.sessionId, portion.sessionDate);
      session?.portionEntries.push(portion);
    }
  }

  for (const activity of activities) {
    const review = parsePersistedReviewEntry(activity);
    if (!review) continue;
    for (const session of sessions.values()) {
      if (session.sessionId === review.sessionId && !session.review) {
        session.review = review;
      }
    }
  }

  return [...sessions.values()].sort((left, right) => {
    const byName = left.actorName.localeCompare(right.actorName);
    if (byName !== 0) return byName;
    return left.sessionId.localeCompare(right.sessionId);
  });
}

export function findKitchenDayChefSession(
  sessions: readonly KitchenDayChefSession[],
  sessionId: string | null,
): KitchenDayChefSession | undefined {
  if (!sessionId) return undefined;
  return sessions.find((session) => session.sessionId === sessionId);
}
