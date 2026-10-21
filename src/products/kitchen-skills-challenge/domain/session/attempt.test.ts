/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  archiveFinishedKitchenSkillsAttempt,
  clearKitchenSkillsAttempt,
  createKitchenSkillsAttemptId,
  guardKitchenSkillsAttempt,
  hasDispatchedKitchenSkillsWork,
  kitchenSkillsAttemptStorageKey,
  readArchivedKitchenSkillsAttempt,
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
  vi.restoreAllMocks();
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

  it.each([
    ['23:59:59', '2026-10-21T20:59:59.000Z', '2026-10-21'],
    ['00:00:00', '2026-10-21T21:00:00.000Z', '2026-10-22'],
    ['00:00:01', '2026-10-21T21:00:01.000Z', '2026-10-22'],
  ] as const)(
    'keeps a dispatched unfinished attempt at Helsinki %s without reposting',
    (_label, iso, today) => {
      const started = resolveKitchenSkillsAttempt({
        key,
        today: '2026-10-21',
        now: new Date('2026-10-21T20:59:59.000Z'),
        buildSessionId: buildId,
        createAttemptId: () => 'lateid1',
      });
      recordDispatchedKitchenSkillsEntry(key, started.record.attemptId, {
        module: 'portion',
        value: {
          sessionId: started.record.sessionId,
          sessionDate: started.record.sessionDate,
          submittedAt: '2026-10-21T20:59:59.000Z',
          recipeId: '42',
          recipeName: 'Hedelmät M,G',
          recipeComposition: [],
          finalRecipeWeightGrams: 3700,
          source: 'local',
        },
      });
      const resolved = resolveKitchenSkillsAttempt({
        key,
        today,
        now: new Date(iso),
        buildSessionId: buildId,
        createAttemptId: () => 'newdayid',
      });
      expect(resolved.record.attemptId).toBe('lateid1');
      expect(resolved.record.sessionDate).toBe('2026-10-21');
      expect(resolved.record.sessionId).toBe(started.record.sessionId);
      expect(hasDispatchedKitchenSkillsWork(resolved.record)).toBe(true);
    },
  );

  it('archives dispatched Finish evidence without auto-reposting it on the next open', () => {
    const first = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'firstid1',
    });
    recordDispatchedKitchenSkillsEntry(key, first.record.attemptId, {
      module: 'portion',
      value: {
        sessionId: first.record.sessionId,
        sessionDate: first.record.sessionDate,
        submittedAt: '2026-10-21T07:10:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    });
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(true);
    expect(readKitchenSkillsAttempt(key)).toBeNull();
    const archived = readArchivedKitchenSkillsAttempt(first.record.sessionId);
    expect(archived?.portion?.recipeId).toBe('42');
    const second = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T08:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'secondid2',
    });
    expect(second.record.attemptId).toBe('secondid2');
    expect(second.record.sessionId).not.toBe(first.record.sessionId);
    expect(second.record.portion).toBeNull();
    expect(readArchivedKitchenSkillsAttempt(first.record.sessionId)?.attemptId).toBe('firstid1');
  });

  it('does not clear the active attempt when archive storage throws', () => {
    const first = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'failarch',
    });
    recordDispatchedKitchenSkillsEntry(key, first.record.attemptId, {
      module: 'portion',
      value: {
        sessionId: first.record.sessionId,
        sessionDate: first.record.sessionDate,
        submittedAt: '2026-10-21T07:10:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    });
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
      if (String(name).startsWith('ks-attempt-archive:v1:')) {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    });
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(false);
    expect(readKitchenSkillsAttempt(key)?.attemptId).toBe('failarch');
    expect(readArchivedKitchenSkillsAttempt(first.record.sessionId)).toBeNull();
    vi.restoreAllMocks();
    const resumed = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T08:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'should-not-use',
    });
    expect(resumed.record.attemptId).toBe('failarch');
    expect(resumed.resumed).toBe(true);
  });

  it('retries Finish archive after a previous storage failure', () => {
    const first = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'retryid1',
    });
    recordDispatchedKitchenSkillsEntry(key, first.record.attemptId, {
      module: 'portion',
      value: {
        sessionId: first.record.sessionId,
        sessionDate: first.record.sessionDate,
        submittedAt: '2026-10-21T07:10:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    });
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
      if (String(name).startsWith('ks-attempt-archive:v1:')) {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    });
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(false);
    vi.restoreAllMocks();
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(true);
    expect(readKitchenSkillsAttempt(key)).toBeNull();
    expect(readArchivedKitchenSkillsAttempt(first.record.sessionId)?.attemptId).toBe('retryid1');
    const second = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T08:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'newopen1',
    });
    expect(second.record.attemptId).toBe('newopen1');
    expect(readArchivedKitchenSkillsAttempt(first.record.sessionId)?.attemptId).toBe('retryid1');
  });

  it('does not close Finish when clearing the active attempt throws', () => {
    const first = resolveKitchenSkillsAttempt({
      key,
      today: '2026-10-21',
      now: new Date('2026-10-21T07:00:00.000Z'),
      buildSessionId: buildId,
      createAttemptId: () => 'clearfail',
    });
    recordDispatchedKitchenSkillsEntry(key, first.record.attemptId, {
      module: 'portion',
      value: {
        sessionId: first.record.sessionId,
        sessionDate: first.record.sessionDate,
        submittedAt: '2026-10-21T07:10:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    });
    const original = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, name) {
      if (String(name) === key) {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      }
      return original.call(this, name);
    });
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(false);
    expect(readKitchenSkillsAttempt(key)?.attemptId).toBe('clearfail');
    vi.restoreAllMocks();
    expect(archiveFinishedKitchenSkillsAttempt(key, first.record.attemptId)).toBe(true);
    expect(readKitchenSkillsAttempt(key)).toBeNull();
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
