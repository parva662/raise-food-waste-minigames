import { describe, expect, it } from 'vitest';
import { ensureKitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/session/lock';

describe('Kitchen Day session lock', () => {
  it('locks Helsinki date and attempt id on first creation', () => {
    const session = ensureKitchenSkillsLockedSession(null, {
      embedded: false,
      taskId: undefined,
      attemptId: 'lockid1',
      now: new Date('2026-09-14T20:30:00.000Z'),
    });
    expect(session.sessionDate).toBe('2026-09-14');
    expect(session.sessionId).toBe('kitchen-day:standalone:2026-09-14:lockid1');
    expect(session.attemptId).toBe('lockid1');
  });

  it('keeps the locked session when the page stays open across midnight', () => {
    const locked = ensureKitchenSkillsLockedSession(null, {
      embedded: false,
      taskId: undefined,
      attemptId: 'lockid1',
      now: new Date('2026-09-14T20:30:00.000Z'),
    });
    const reused = ensureKitchenSkillsLockedSession(locked, {
      embedded: false,
      taskId: undefined,
      attemptId: 'otherid',
      now: new Date('2026-09-14T21:30:00.000Z'),
    });
    expect(reused).toEqual(locked);
    expect(reused.sessionDate).toBe('2026-09-14');
  });

  it('locks an embedded session with the authenticated participant and attempt', () => {
    const session = ensureKitchenSkillsLockedSession(null, {
      embedded: true,
      taskId: 'kitchen-day-task-1',
      actorId: 'user-1',
      attemptId: 'embid1',
      now: new Date('2026-09-22T20:30:00.000Z'),
    });
    expect(session.sessionDate).toBe('2026-09-22');
    expect(session.sessionId).toBe('kitchen-day:kitchen-day-task-1:user-1:2026-09-22:embid1');
  });
});
