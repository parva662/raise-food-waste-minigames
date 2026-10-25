import { buildKitchenSkillsSessionId, getKitchenSkillsSessionDate } from '@/products/kitchen-skills-challenge/domain/session/identity';
import type { KitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/types';

export function ensureKitchenSkillsLockedSession(
  existing: KitchenSkillsLockedSession | null,
  options: {
    embedded: boolean;
    taskId: string | undefined;
    actorId?: string | undefined;
    attemptId: string;
    now?: Date;
    /** Resumed attempts keep the date they started on. */
    sessionDate?: string;
  },
): KitchenSkillsLockedSession {
  if (existing) {
    return existing;
  }
  const sessionDate = options.sessionDate ?? getKitchenSkillsSessionDate(options.now);
  const sessionId = buildKitchenSkillsSessionId({
    embedded: options.embedded,
    taskId: options.taskId,
    actorId: options.actorId,
    sessionDate,
    attemptId: options.attemptId,
  });
  return { sessionId, sessionDate, attemptId: options.attemptId };
}
