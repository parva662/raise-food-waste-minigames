import { getOperationalDateIso } from '@/shared/time/dates';

export function getKitchenSkillsSessionDate(now: Date = new Date()): string {
  return getOperationalDateIso(now);
}

export function buildKitchenSkillsSessionId(options: {
  embedded: boolean;
  taskId: string | undefined;
  actorId?: string | undefined;
  sessionDate: string;
}): string {
  if (options.embedded) {
    if (!options.taskId?.trim()) {
      throw new Error('GameBus TASK id is required to build Kitchen Skills Challenge sessionId');
    }
    if (!options.actorId?.trim()) {
      throw new Error(
        'Authenticated GameBus participant id is required to build Kitchen Skills Challenge sessionId',
      );
    }
    return `kitchen-day:${options.taskId.trim()}:${options.actorId.trim()}:${options.sessionDate}`;
  }
  return `kitchen-day:standalone:${options.sessionDate}`;
}
