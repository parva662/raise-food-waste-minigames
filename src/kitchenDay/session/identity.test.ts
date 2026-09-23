import { describe, expect, it } from 'vitest';
import { buildKitchenDaySessionId, getKitchenDaySessionDate } from './identity';

describe('Kitchen Day session identity', () => {
  it('uses Europe/Helsinki for sessionDate', () => {
    expect(getKitchenDaySessionDate(new Date('2026-09-14T21:30:00.000Z'))).toBe('2026-09-15');
    expect(getKitchenDaySessionDate(new Date('2026-09-14T20:59:59.000Z'))).toBe('2026-09-14');
  });

  it('builds one shared standalone session id', () => {
    expect(
      buildKitchenDaySessionId({
        embedded: false,
        taskId: undefined,
        sessionDate: '2026-09-23',
      }),
    ).toBe('kitchen-day:standalone:2026-09-23');
  });

  it('builds one shared embedded session id from the task', () => {
    expect(
      buildKitchenDaySessionId({
        embedded: true,
        taskId: 'task-9',
        sessionDate: '2026-09-23',
      }),
    ).toBe('kitchen-day:task-9:2026-09-23');
  });
});
