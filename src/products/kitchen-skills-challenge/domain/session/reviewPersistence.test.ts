import { describe, expect, it } from 'vitest';
import {
  findAwaitingRecipeModuleReview,
  findConfirmedRecipeModuleReview,
  hasDuplicateReviewIdentity,
  isReviewPersistConfirmed,
  recipeAssessmentStatus,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { mergeKitchenSkillsRecords } from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import {
  emptyModuleReviews,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';

function portion(recipeId: string, name: string) {
  return {
    sessionId: 's1',
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T09:00:00.000Z',
    recipeId,
    recipeName: name,
    recipeComposition: [],
    finalRecipeWeightGrams: 1000,
    source: 'persisted' as const,
  };
}

function review(
  recipeId: string,
  partial: Partial<KitchenSkillsReviewEntry> = {},
): KitchenSkillsReviewEntry {
  return {
    sessionId: 's1',
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T12:00:00.000Z',
    recipeId,
    reviewedGame: 'portionPrecision',
    timeEfficiencyScore: 4,
    preparationQualityScore: 5,
    source: 'persisted',
    persistId: `pid-${recipeId}`,
    ...partial,
  };
}

function session(partial: Partial<KitchenSkillsTrainerSession>): KitchenSkillsTrainerSession {
  return {
    actorId: 'user-1',
    actorName: 'Student',
    sessionId: 's1',
    sessionDate: '2026-09-23',
    trimEntries: [],
    rescueEntries: [],
    portionEntries: [],
    reviews: [],
    moduleReviews: emptyModuleReviews(),
    ...partial,
  };
}

describe('review persistence identity and status', () => {
  it('merges local and persisted reviews by sessionId + recipeId + reviewedGame', () => {
    const local = [
      review('a', { source: 'local', awaitingPersist: true, persistId: undefined, timeEfficiencyScore: 1 }),
      review('b', { source: 'local', awaitingPersist: true, persistId: undefined, timeEfficiencyScore: 2 }),
      review('c', { source: 'local', awaitingPersist: true, persistId: undefined, timeEfficiencyScore: 3 }),
    ];
    const persisted = [review('a', { timeEfficiencyScore: 5 })];
    const merged = mergeKitchenSkillsRecords(
      local,
      persisted,
      (left, right) => reviewIdentityKey(left) === reviewIdentityKey(right),
    );
    expect(merged).toHaveLength(3);
    expect(merged.find((item) => item.recipeId === 'a')?.timeEfficiencyScore).toBe(5);
    expect(merged.find((item) => item.recipeId === 'a')?.source).toBe('persisted');
    expect(merged.find((item) => item.recipeId === 'b')?.timeEfficiencyScore).toBe(2);
    expect(merged.find((item) => item.recipeId === 'c')?.timeEfficiencyScore).toBe(3);
  });

  it('does not treat awaiting postMessage rows as confirmed REVIEWED', () => {
    const awaiting = review('a', {
      source: 'local',
      awaitingPersist: true,
      persistId: undefined,
    });
    expect(isReviewPersistConfirmed(awaiting)).toBe(false);
    const s = session({
      portionEntries: [portion('a', 'A'), portion('b', 'B')],
      reviews: [awaiting],
    });
    expect(findConfirmedRecipeModuleReview(s, 'a', 'portionPrecision')).toBeNull();
    expect(findAwaitingRecipeModuleReview(s, 'a', 'portionPrecision')).toEqual(awaiting);
    expect(recipeAssessmentStatus(s, 'a')).toBe('needs_assessment');
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
  });

  it('marks a Portion-only recipe REVIEWED after its confirmed Portion assessment', () => {
    const s = session({
      portionEntries: [portion('a', 'A'), portion('b', 'B')],
      reviews: [review('a')],
    });
    expect(recipeAssessmentStatus(s, 'a')).toBe('reviewed');
    expect(recipeAssessmentStatus(s, 'b')).toBe('needs_assessment');
    expect(sessionAssessmentStatus(s)).toBe('partially_reviewed');
  });

  it('keeps three distinct Portion reviews after hydration', () => {
    const s = session({
      portionEntries: [portion('a', 'A'), portion('b', 'B'), portion('c', 'C')],
      reviews: [review('a'), review('b'), review('c')],
    });
    expect(findConfirmedRecipeModuleReview(s, 'a', 'portionPrecision')?.recipeId).toBe('a');
    expect(findConfirmedRecipeModuleReview(s, 'b', 'portionPrecision')?.recipeId).toBe('b');
    expect(findConfirmedRecipeModuleReview(s, 'c', 'portionPrecision')?.recipeId).toBe('c');
    expect(sessionAssessmentStatus(s)).toBe('reviewed');
  });

  it('blocks genuine duplicate confirmed reviews but not awaiting-only rows', () => {
    const confirmed = review('a');
    const awaiting = review('a', {
      source: 'local',
      awaitingPersist: true,
      persistId: undefined,
    });
    expect(hasDuplicateReviewIdentity([confirmed], confirmed)).toBe(true);
    expect(hasDuplicateReviewIdentity([awaiting], awaiting)).toBe(false);
  });
});
