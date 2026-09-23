import { buildKitchenDaySessionId, getKitchenDaySessionDate } from './identity';
import type { KitchenDayLockedSession } from '../types';

export function ensureKitchenDayLockedSession(
  existing: KitchenDayLockedSession | null,
  options: {
    embedded: boolean;
    taskId: string | undefined;
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
    sessionDate,
  });
  return { sessionId, sessionDate };
}
