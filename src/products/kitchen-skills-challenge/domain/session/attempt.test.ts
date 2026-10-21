/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearKitchenSkillsAttempt,
  createKitchenSkillsAttemptId,
  guardKitchenSkillsAttempt,
  hasDispatchedKitchenSkillsWork,
  kitchenSkillsAttemptStorageKey,
  readKitchenSkillsAttempt,
  recordDispatchedKitchenSkillsEntry,
  resetKitchenSkillsAttemptStorageForTests,
  resolveKitchenSkillsAttempt,
} from '@/products/kitchen-skills-challenge/domain/session/attempt';
import { buildKitchenSkillsSessionId } from '@/products/kitchen-skills-challenge/domain/session/identity';

const key = kitchenSkillsAttemptStorageKey('task-1', 'user-1');

function buildId(attemptId: string, sessionDate: string) {
  return buildKitchenSkillsSessionId({
    embedded: true,
    taskId: 'task-1',
    actorId: 'user-1',
    sessionDate,
    attemptId,
  });
}

afterEach(() => {
  resetKitchenSkillsAttemptStorageForTests();
});

describe('Kitchen Skills attempt record', () => {
  it('creates a unique attempt id that is stable once stored', () => {
    const first = createKitchenSkillsAttemptId(() => 0.1);
    const second = createKitchenSkillsAttemptId(() => 0.9);
    expect(first).not.toBe(second);
    const resolved = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'abc123xyz',
    });
    expect(resolved.record.sessionId).toBe('kitchen-day:task-1:user-1:2026-10-21:abc123xyz');
    const again = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T08:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'should-not-use',
    });
    expect(again.record.attemptId).toBe('abc123xyz');
    expect(again.resumed).toBe(true);
  });

  it('starts a new attempt after Finish clears the record', () => {
    const first = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'firstid1',
    });
    clearKitchenSkillsAttempt(key, first.record.attemptId);
    const second = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T08:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'secondid2',
    });
    expect(second.record.attemptId).toBe('secondid2');
    expect(second.record.sessionId).not.toBe(first.record.sessionId);
  });

  it('resumes an unfinished attempt after Helsinki midnight when work was dispatched', () => {
    const started = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T20:30:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'lateid1',
    });
    recordDispatchedKitchenSkillsEntry(key, started.record.attemptId, {
      module: 'portion',
      value: {
        sessionId: started.record.sessionId,
        sessionDate: started.record.sessionDate,
        submittedAt: '2026-10-21T20:40:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    });
    const afterMidnight = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-22',
      now: new Date('2026-10-21T21:30:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'newdayid',
    });
    expect(afterMidnight.record.attemptId).toBe('lateid1');
    expect(afterMidnight.record.sessionDate).toBe('2026-10-21');
    expect(hasDispatchedKitchenSkillsWork(afterMidnight.record)).toBe(true);
  });

  it('replaces an empty stale attempt after Helsinki midnight', () => {
    resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T20:30:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'emptyid1',
    });
    const afterMidnight = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-22',
      now: new Date('2026-10-21T21:30:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'newdayid',
    });
    expect(afterMidnight.record.attemptId).toBe('newdayid');
    expect(afterMidnight.record.sessionDate).toBe('2026-10-22');
  });

  it('treats another window Finish as a closed attempt', () => {
    const started = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'openidx1',
    });
    expect(guardKitchenSkillsAttempt(key, started.record.attemptId).status).toBe('open');
    clearKitchenSkillsAttempt(key, started.record.attemptId);
    expect(guardKitchenSkillsAttempt(key, started.record.attemptId).status).toBe('closed');
    expect(readKitchenSkillsAttempt(key)).toBeNull();
  });
});
