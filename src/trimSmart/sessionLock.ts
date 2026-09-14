import { buildTrimSmartSessionId, getTrimSmartSessionDate } from './sessionIdentity';
import type { TrimSmartLockedSession } from './types';

export function ensureTrimSmartLockedSession(
  existing: TrimSmartLockedSession | null,
  options: {
    embedded: boolean;
    taskId: string | undefined;
    now?: Date;
  },
): TrimSmartLockedSession {
  if (existing) {
    return existing;
  }
  const sessionDate = getTrimSmartSessionDate(options.now);
  const sessionId = buildTrimSmartSessionId({
    embedded: options.embedded,
    taskId: options.taskId,
    sessionDate,
  });
  return { sessionId, sessionDate };
}
