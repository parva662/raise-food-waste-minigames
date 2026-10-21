/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import {
  awaitingReviewsFromDispatchMarkers,
  clearKitchenSkillsReviewDispatchMarker,
  clearKitchenSkillsReviewDispatchMarkersForTests,
  hasKitchenSkillsReviewDispatchMarker,
  isAwaitingReviewMissingFromRefreshedFeed,
  KITCHEN_SKILLS_FEED_CONFIRMATION_GRACE_MS,
  kitchenSkillsTrainerFeedFingerprint,
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

describe('Assess again guard (missing after a refreshed feed)', () => {
  const oldFeed = kitchenSkillsTrainerFeedFingerprint([{ id: 1 }, { id: 2 }]);
  const newFeed = kitchenSkillsTrainerFeedFingerprint([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const row: KitchenSkillsReviewEntry = { ...entry, awaitingPersist: true };
  const sentAt = Date.parse(row.submittedAt);
  const later = sentAt + KITCHEN_SKILLS_FEED_CONFIRMATION_GRACE_MS + 1;
  const refreshed = { receivedAtMs: later, fingerprint: newFeed, sessionInFeed: true };

  it('fingerprints the feed by activity ids, independent of order', () => {
    expect(kitchenSkillsTrainerFeedFingerprint([{ id: 2 }, { id: '1' }])).toBe(oldFeed);
    expect(newFeed).not.toBe(oldFeed);
  });

  it('unlocks only for a later, different feed that still holds the session but lacks the review', () => {
    markKitchenSkillsReviewDispatched('user-1', entry, oldFeed);
    expect(isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', refreshed)).toBe(true);
  });

  it('stays locked when the old iframe snapshot is replayed (same feed, new receipt time)', () => {
    markKitchenSkillsReviewDispatched('user-1', entry, oldFeed);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', { ...refreshed, fingerprint: oldFeed }),
    ).toBe(false);
  });

  it('stays locked without a matching dispatch marker or without a dispatch-time fingerprint', () => {
    expect(isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', refreshed)).toBe(false);
    markKitchenSkillsReviewDispatched('user-1', entry, oldFeed);
    expect(isAwaitingReviewMissingFromRefreshedFeed(row, 'user-2', refreshed)).toBe(false);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed({ ...row, recipeId: 'recipe-b' }, 'user-1', refreshed),
    ).toBe(false);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed({ ...row, reviewedGame: 'trimSmart' }, 'user-1', refreshed),
    ).toBe(false);
    clearKitchenSkillsReviewDispatchMarkersForTests();
    markKitchenSkillsReviewDispatched('user-1', entry);
    expect(isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', refreshed)).toBe(false);
  });

  it('stays locked when the feed lacks the student session, arrived too soon, or the review is confirmed', () => {
    markKitchenSkillsReviewDispatched('user-1', entry, oldFeed);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', { ...refreshed, sessionInFeed: false }),
    ).toBe(false);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', { ...refreshed, receivedAtMs: sentAt + 10_000 }),
    ).toBe(false);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed(row, 'user-1', { ...refreshed, receivedAtMs: null }),
    ).toBe(false);
    expect(
      isAwaitingReviewMissingFromRefreshedFeed({ ...row, awaitingPersist: false }, 'user-1', refreshed),
    ).toBe(false);
  });
});
