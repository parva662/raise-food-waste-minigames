/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import {
  awaitingReviewsFromDispatchMarkers,
  clearKitchenSkillsReviewDispatchMarker,
  clearKitchenSkillsReviewDispatchMarkersForTests,
  hasKitchenSkillsReviewDispatchMarker,
  markKitchenSkillsReviewDispatched,
  readKitchenSkillsReviewDispatchMarker,
} from '@/products/kitchen-skills-challenge/gamebus/reviewDispatchMarker';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

const entry: KitchenSkillsReviewEntry = {
  sessionId: 's1',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T12:00:00.000Z',
  recipeId: 'recipe-a',
  reviewedGame: 'portionPrecision',
  timeEfficiencyScore: 4,
  preparationQualityScore: 5,
  source: 'local',
};

afterEach(() => {
  clearKitchenSkillsReviewDispatchMarkersForTests();
});

describe('review dispatch markers', () => {
  it('stores a non-authoritative pending marker and restores awaiting rows', () => {
    markKitchenSkillsReviewDispatched('user-1', entry);
    expect(hasKitchenSkillsReviewDispatchMarker('user-1', entry)).toBe(true);
    expect(readKitchenSkillsReviewDispatchMarker('user-1', entry)?.recipeId).toBe('recipe-a');
    const awaiting = awaitingReviewsFromDispatchMarkers([
      { actorId: 'user-1', sessionId: 's1' },
    ]);
    expect(awaiting).toHaveLength(1);
    expect(awaiting[0]?.awaitingPersist).toBe(true);
    expect(awaiting[0]?.recipeId).toBe('recipe-a');
    clearKitchenSkillsReviewDispatchMarker('user-1', entry);
    expect(hasKitchenSkillsReviewDispatchMarker('user-1', entry)).toBe(false);
  });

  it('does not treat another actor marker as the current student', () => {
    markKitchenSkillsReviewDispatched('user-1', entry);
    expect(hasKitchenSkillsReviewDispatchMarker('user-2', entry)).toBe(false);
  });
});
