import { getOperationalDateIso } from '../../utils/dates';

export function getKitchenDaySessionDate(now: Date = new Date()): string {
  return getOperationalDateIso(now);
}

export function buildKitchenDaySessionId(options: {
  embedded: boolean;
  taskId: string | undefined;
  sessionDate: string;
}): string {
  if (options.embedded) {
    if (!options.taskId?.trim()) {
      throw new Error('GameBus TASK id is required to build Kitchen Day sessionId');
    }
    return `kitchen-day:${options.taskId.trim()}:${options.sessionDate}`;
  }
  return `kitchen-day:standalone:${options.sessionDate}`;
}
