import { buildKitchenDaySessionId, getKitchenDaySessionDate } from '@/products/kitchen-skills-challenge/domain/session/identity';
import type { KitchenDayLockedSession } from '@/products/kitchen-skills-challenge/domain/types';

export function ensureKitchenDayLockedSession(
  existing: KitchenDayLockedSession | null,
  options: {
    embedded: boolean;
    taskId: string | undefined;
    actorId?: string | undefined;
    now?: Date;
  },
): KitchenDayLockedSession {
  if (existing) {
    return existing;
  }
  const sessionDate = getKitchenDaySessionDate(options.now);
  const sessionId = buildKitchenDaySessionId({
    embedded: options.embedded,
    taskId: options.taskId,
    actorId: options.actorId,
    sessionDate,
  });
  return { sessionId, sessionDate };
}
