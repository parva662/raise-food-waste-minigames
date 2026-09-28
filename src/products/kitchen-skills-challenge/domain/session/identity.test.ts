import { describe, expect, it } from 'vitest';
import { buildKitchenSkillsSessionId, getKitchenSkillsSessionDate } from '@/products/kitchen-skills-challenge/domain/session/identity';

describe('Kitchen Skills Challenge session identity', () => {
  it('uses Europe/Helsinki for sessionDate', () => {
    expect(getKitchenSkillsSessionDate(new Date('2026-09-14T21:30:00.000Z'))).toBe('2026-09-15');
    expect(getKitchenSkillsSessionDate(new Date('2026-09-14T20:59:59.000Z'))).toBe('2026-09-14');
  });

  it('builds one standalone session id for local development', () => {
    expect(
      buildKitchenSkillsSessionId({
        embedded: false,
        taskId: undefined,
        sessionDate: '2026-09-23',
      }),
    ).toBe('kitchen-day:standalone:2026-09-23');
  });

  it('builds participant-specific embedded session ids from task, actor, and date', () => {
    expect(
      buildKitchenSkillsSessionId({
        embedded: true,
        taskId: 'task-9',
        actorId: 'student-a',
        sessionDate: '2026-09-23',
      }),
    ).toBe('kitchen-day:task-9:student-a:2026-09-23');
    expect(
      buildKitchenSkillsSessionId({
        embedded: true,
        taskId: 'task-9',
        actorId: 'student-b',
        sessionDate: '2026-09-23',
      }),
    ).toBe('kitchen-day:task-9:student-b:2026-09-23');
  });

  it('keeps the same embedded session id for the same actor, task, and date', () => {
    const first = buildKitchenSkillsSessionId({
      embedded: true,
      taskId: 'task-9',
      actorId: 'student-a',
      sessionDate: '2026-09-23',
    });
    const second = buildKitchenSkillsSessionId({
      embedded: true,
      taskId: 'task-9',
      actorId: 'student-a',
      sessionDate: '2026-09-23',
    });
    expect(first).toBe(second);
  });

  it('refuses an embedded session without an authenticated actor', () => {
    expect(() =>
      buildKitchenSkillsSessionId({
        embedded: true,
        taskId: 'task-9',
        sessionDate: '2026-09-23',
      }),
    ).toThrow(/Authenticated GameBus participant id is required/);
  });
});
