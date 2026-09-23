import { describe, expect, it } from 'vitest';
import { buildKitchenDayChefSessions } from './chefSessions';

const sessionA = 'kitchen-day:task-1:user-1:2026-09-23';
const sessionB = 'kitchen-day:task-1:user-2:2026-09-23';

function trimActivity(actorId: string, sessionId: string, ingredientId: string) {
  return {
    id: `trim-${actorId}-${ingredientId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: ingredientId } },
      { template: { slug: 'ingredientName' }, value: { value: ingredientId } },
      { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
  };
}

describe('Kitchen Day chef session grouping', () => {
  it('groups completed records by participant actor and sessionId, not date only', () => {
    const sessions = buildKitchenDayChefSessions([
      trimActivity('user-1', sessionA, 'carrot'),
      trimActivity('user-2', sessionB, 'onion'),
    ]);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.sessionId).sort()).toEqual([sessionA, sessionB].sort());
    expect(sessions.find((session) => session.actorId === 'user-1')?.trimEntries[0]?.ingredientId).toBe(
      'carrot',
    );
    expect(sessions.find((session) => session.actorId === 'user-2')?.trimEntries[0]?.ingredientId).toBe(
      'onion',
    );
  });

  it('does not treat incomplete or actor-less activities as completed evidence', () => {
    const sessions = buildKitchenDayChefSessions([
      { template: { slug: 'trimSmart' }, properties: [] },
      { ...trimActivity('user-1', sessionA, 'carrot'), actor: undefined },
    ]);
    expect(sessions).toHaveLength(0);
  });
});
