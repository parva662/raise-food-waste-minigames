import { describe, expect, it } from 'vitest';
import { ensureTrimSmartLockedSession } from './sessionLock';

describe('ensureTrimSmartLockedSession', () => {
  it('locks session identity on first ingredient start', () => {
    const beforeMidnight = new Date('2026-09-14T20:30:00.000Z');
    const session = ensureTrimSmartLockedSession(null, {
      embedded: true,
      taskId: 'task-123',
      now: beforeMidnight,
    });
    expect(session.sessionDate).toBe('2026-09-14');
    expect(session.sessionId).toBe('trim-smart:task-123:2026-09-14');
  });

  it('reuses locked session identity for later ingredients', () => {
    const dayOne = new Date('2026-09-14T20:30:00.000Z');
    const afterMidnight = new Date('2026-09-14T21:30:00.000Z');
    const locked = ensureTrimSmartLockedSession(null, {
      embedded: true,
      taskId: 'task-123',
      now: dayOne,
    });
    const reused = ensureTrimSmartLockedSession(locked, {
      embedded: true,
      taskId: 'task-123',
      now: afterMidnight,
    });
    expect(reused).toEqual(locked);
    expect(reused.sessionDate).toBe('2026-09-14');
  });

  it('uses Helsinki date after midnight for a new session', () => {
    const afterMidnight = new Date('2026-09-14T21:30:00.000Z');
    const session = ensureTrimSmartLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: afterMidnight,
    });
    expect(session.sessionDate).toBe('2026-09-15');
    expect(session.sessionId).toBe('trim-smart:standalone:2026-09-15');
  });

  it('uses Helsinki date before midnight boundary', () => {
    const beforeMidnight = new Date('2026-09-14T20:59:59.000Z');
    const session = ensureTrimSmartLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: beforeMidnight,
    });
    expect(session.sessionDate).toBe('2026-09-14');
  });
});
