import { describe, expect, it } from 'vitest';
import { createIdleTimer, durationPayload, finishPreparationTimer, startPreparationTimer } from './timer';

describe('Kitchen Day Trim timer', () => {
  it('starts from idle and ignores a second start', () => {
    const idle = createIdleTimer();
    const started = startPreparationTimer(idle, new Date('2026-09-23T10:00:00.000Z'));
    expect(started.status).toBe('running');
    const again = startPreparationTimer(started, new Date('2026-09-23T10:01:00.000Z'));
    expect(again).toEqual(started);
  });

  it('does not finish before start', () => {
    const finished = finishPreparationTimer(createIdleTimer(), new Date('2026-09-23T10:02:00.000Z'));
    expect(finished.status).toBe('idle');
  });

  it('derives duration from the real interval', () => {
    const started = startPreparationTimer(createIdleTimer(), new Date('2026-09-23T10:00:00.000Z'));
    const finished = finishPreparationTimer(started, new Date('2026-09-23T10:03:00.000Z'));
    expect(finished.status).toBe('finished');
    if (finished.status === 'finished') {
      expect(finished.durationMinutes).toBe(3);
      expect(durationPayload(finished.durationMinutes)).toEqual({ value: 3, unit: 'minutes' });
    }
    expect(finishPreparationTimer(finished, new Date('2026-09-23T10:09:00.000Z'))).toEqual(finished);
  });
});
