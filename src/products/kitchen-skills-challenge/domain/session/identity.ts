import { getOperationalDateIso } from '@/shared/time/dates';

export function getKitchenSkillsSessionDate(now: Date = new Date()): string {
  return getOperationalDateIso(now);
}

/**
 * One `sessionId` per challenge attempt:
 * `kitchen-day:{taskId}:{actorId}:{sessionDate}:{attemptId}` (embedded) or
 * `kitchen-day:standalone:{sessionDate}:{attemptId}`.
 *
 * Historical GameBus records use the day-scoped form without `:{attemptId}`. Readers group by the
 * full string and never parse it, so both forms stay readable.
 */
export function buildKitchenSkillsSessionId(options: {
  embedded: boolean;
  taskId: string | undefined;
  actorId?: string | undefined;
  sessionDate: string;
  attemptId: string;
}): string {
  const attemptId = options.attemptId.trim();
  if (!attemptId) {
    throw new Error('Attempt id is required to build Kitchen Skills Challenge sessionId');
  }
  if (options.embedded) {
    if (!options.taskId?.trim()) {
      throw new Error('GameBus TASK id is required to build Kitchen Skills Challenge sessionId');
    }
    if (!options.actorId?.trim()) {
      throw new Error(
        'Authenticated GameBus participant id is required to build Kitchen Skills Challenge sessionId',
      );
    }
    return `kitchen-day:${options.taskId.trim()}:${options.actorId.trim()}:${options.sessionDate}:${attemptId}`;
  }
  return `kitchen-day:standalone:${options.sessionDate}:${attemptId}`;
}
