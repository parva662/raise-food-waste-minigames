import { buildKitchenSkillsSessionId, getKitchenSkillsSessionDate } from '@/products/kitchen-skills-challenge/domain/session/identity';
import type { KitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/types';

export function ensureKitchenSkillsLockedSession(
  existing: KitchenSkillsLockedSession | null,
  options: {
    embedded: boolean;
    taskId: string | undefined;
    actorId?: string | undefined;
    now?: Date;
  },
): KitchenSkillsLockedSession {
  if (existing) {
    return existing;
  }
  const sessionDate = getKitchenSkillsSessionDate(options.now);
  const sessionId = buildKitchenSkillsSessionId({
    embedded: options.embedded,
    taskId: options.taskId,
    actorId: options.actorId,
    sessionDate,
  });
  return { sessionId, sessionDate };
}
