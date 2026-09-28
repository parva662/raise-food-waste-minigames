export type PreparationTimerState =
  | { status: 'idle' }
  | { status: 'running'; startedAt: string }
  | { status: 'finished'; startedAt: string; endedAt: string; durationMinutes: number };

export function createIdleTimer(): PreparationTimerState {
  return { status: 'idle' };
}

export function startPreparationTimer(
  current: PreparationTimerState,
  startedAt: Date,
): PreparationTimerState {
  if (current.status === 'running' || current.status === 'finished') {
    return current;
  }
  return { status: 'running', startedAt: startedAt.toISOString() };
}

export function finishPreparationTimer(
  current: PreparationTimerState,
  endedAt: Date,
): PreparationTimerState {
  if (current.status !== 'running') {
    return current;
  }
  const startMs = new Date(current.startedAt).getTime();
  const endMs = endedAt.getTime();
  const durationMinutes = Math.max(0, (endMs - startMs) / 60_000);
  return {
    status: 'finished',
    startedAt: current.startedAt,
    endedAt: endedAt.toISOString(),
    durationMinutes,
  };
}

export function durationPayload(durationMinutes: number): { value: number; unit: 'minutes' } {
  return { value: durationMinutes, unit: 'minutes' };
}
