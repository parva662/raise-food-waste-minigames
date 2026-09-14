import { getOperationalDateIso } from '../utils/dates';

export function getTrimSmartSessionDate(now: Date = new Date()): string {
  return getOperationalDateIso(now);
}

export function buildTrimSmartSessionId(options: {
  embedded: boolean;
  taskId: string | undefined;
  sessionDate: string;
}): string {
  if (options.embedded) {
    if (!options.taskId?.trim()) {
      throw new Error('GameBus TASK id is required to build trimSmart sessionId');
    }
    return `trim-smart:${options.taskId.trim()}:${options.sessionDate}`;
  }
  return `trim-smart:standalone:${options.sessionDate}`;
}
