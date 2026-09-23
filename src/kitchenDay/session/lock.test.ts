import { describe, expect, it } from 'vitest';
import { ensureKitchenDayLockedSession } from './lock';

describe('Kitchen Day session lock', () => {
  it('locks Helsinki date on first creation', () => {
    const session = ensureKitchenDayLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: new Date('2026-09-14T20:30:00.000Z'),
    });
    expect(session.sessionDate).toBe('2026-09-14');
    expect(session.sessionId).toBe('kitchen-day:standalone:2026-09-14');
  });

  it('keeps the locked session when the page stays open across midnight', () => {
    const locked = ensureKitchenDayLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: new Date('2026-09-14T20:30:00.000Z'),
    });
    const reused = ensureKitchenDayLockedSession(locked, {
      embedded: false,
      taskId: undefined,
      now: new Date('2026-09-14T21:30:00.000Z'),
    });
    expect(reused).toEqual(locked);
    expect(reused.sessionDate).toBe('2026-09-14');
  });
});
