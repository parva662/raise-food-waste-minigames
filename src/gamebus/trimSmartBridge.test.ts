// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostTrimSmartActivity,
} from './bridge';
import { trimSmartTaskFixture } from './trimSmartTaskFixtures';
import type { TrimSmartSubmission } from '../trimSmart/types';

function submissionFor(ingredientName: string, waste: number): TrimSmartSubmission {
  return {
    sessionId: 'trim-smart:task-123:2026-09-14',
    sessionDate: '2026-09-14',
    ingredientCategory: 'vegetables',
    ingredientId: ingredientName.toLowerCase(),
    ingredientName,
    ingredientWeightGrams: 1000,
    participantWasteGrams: waste,
    practice: 'careful_trimming',
    submittedAt: `2026-09-14T08:00:0${waste}.000Z`,
  };
}

describe('tryPostTrimSmartActivity', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    ingestTaskForTests(trimSmartTaskFixture);
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('blocks duplicate posts for the same attempt key', () => {
    const submission = submissionFor('Carrot', 1);
    const first = tryPostTrimSmartActivity(submission, 'trim-smart-attempt-1');
    expect(first.ok).toBe(true);
    const second = tryPostTrimSmartActivity(submission, 'trim-smart-attempt-1');
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('duplicate');
    }
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
  });

  it('allows multiple trimSmart ACTIVITIES in the same session', () => {
    const carrot = tryPostTrimSmartActivity(submissionFor('Carrot', 1), 'trim-smart-attempt-1');
    const onion = tryPostTrimSmartActivity(submissionFor('Onion', 2), 'trim-smart-attempt-2');
    expect(carrot.ok).toBe(true);
    expect(onion.ok).toBe(true);
    expect(window.parent.postMessage).toHaveBeenCalledTimes(2);
  });

  it('allows the same ingredient name on a later attempt key', () => {
    const first = tryPostTrimSmartActivity(submissionFor('Carrot', 1), 'trim-smart-attempt-1');
    const second = tryPostTrimSmartActivity(submissionFor('Carrot', 2), 'trim-smart-attempt-2');
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(window.parent.postMessage).toHaveBeenCalledTimes(2);
  });

  it('does not mark failed posts as posted', () => {
    const badTask = { ...trimSmartTaskFixture, activityTemplates: [] };
    resetGameBusBridgeForTests();
    ingestTaskForTests(badTask);
    const submission = submissionFor('Carrot', 1);
    const failed = tryPostTrimSmartActivity(submission, 'trim-smart-attempt-1');
    expect(failed.ok).toBe(false);
    resetGameBusBridgeForTests();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    ingestTaskForTests(trimSmartTaskFixture);
    const retry = tryPostTrimSmartActivity(submission, 'trim-smart-attempt-1');
    expect(retry.ok).toBe(true);
  });

  it('does not include forbidden properties in payload', () => {
    const result = tryPostTrimSmartActivity(submissionFor('Carrot', 1), 'trim-smart-attempt-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const templates = result.message.data.properties.map((property) => property.template);
      expect(templates).not.toContain('chefPerformanceScore');
      expect(templates).not.toContain('sessionCategoryWasteGrams');
      expect(templates).not.toContain('participantId');
    }
  });
});
