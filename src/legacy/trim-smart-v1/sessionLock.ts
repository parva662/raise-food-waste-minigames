import { buildTrimSmartSessionId, getTrimSmartSessionDate } from '@/legacy/trim-smart-v1/sessionIdentity';
import type { TrimSmartLockedSession } from '@/legacy/trim-smart-v1/types';

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
