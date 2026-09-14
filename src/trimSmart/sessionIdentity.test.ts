import { describe, expect, it } from 'vitest';
import { buildTrimSmartSessionId, getTrimSmartSessionDate } from './sessionIdentity';

describe('getTrimSmartSessionDate', () => {
  it('uses Europe/Helsinki YYYY-MM-DD', () => {
    const utcLate = new Date('2026-09-14T21:30:00.000Z');
    expect(getTrimSmartSessionDate(utcLate)).toBe('2026-09-15');

    const utcEarly = new Date('2026-09-14T20:59:59.000Z');
    expect(getTrimSmartSessionDate(utcEarly)).toBe('2026-09-14');
  });
});

describe('buildTrimSmartSessionId', () => {
  it('builds embedded session id from task and date', () => {
    expect(
      buildTrimSmartSessionId({
        embedded: true,
        taskId: 'task-123',
        sessionDate: '2026-09-14',
      }),
    ).toBe('trim-smart:task-123:2026-09-14');
  });

  it('is deterministic for same task and date', () => {
    const a = buildTrimSmartSessionId({
      embedded: true,
      taskId: 'task-123',
      sessionDate: '2026-09-14',
    });
    const b = buildTrimSmartSessionId({
      embedded: true,
      taskId: 'task-123',
      sessionDate: '2026-09-14',
    });
    expect(a).toBe(b);
  });

  it('differs when task or date changes', () => {
    const base = buildTrimSmartSessionId({
      embedded: true,
      taskId: 'task-123',
      sessionDate: '2026-09-14',
    });
    expect(
      buildTrimSmartSessionId({
        embedded: true,
        taskId: 'task-456',
        sessionDate: '2026-09-14',
      }),
    ).not.toBe(base);
    expect(
      buildTrimSmartSessionId({
        embedded: true,
        taskId: 'task-123',
        sessionDate: '2026-09-15',
      }),
    ).not.toBe(base);
  });

  it('builds standalone session id', () => {
    expect(
      buildTrimSmartSessionId({
        embedded: false,
        taskId: undefined,
        sessionDate: '2026-09-14',
      }),
    ).toBe('trim-smart:standalone:2026-09-14');
  });

  it('requires task id in embedded mode', () => {
    expect(() =>
      buildTrimSmartSessionId({
        embedded: true,
        taskId: '',
        sessionDate: '2026-09-14',
      }),
    ).toThrow();
  });
});
