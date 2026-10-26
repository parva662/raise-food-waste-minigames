import { describe, expect, it } from 'vitest';
import {
  evidencedRecipeModules,
  findRecipeModuleReview,
  hasDuplicateReviewIdentity,
  isLegacySessionReview,
  isSessionLevelAssessment,
  recipeModulesAwaitingAssessment,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import { emptyModuleReviews } from '@/products/kitchen-skills-challenge/read/trainerSessions';

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
    sessionAssessment: null,
    moduleReviews: emptyModuleReviews(),
    ...partial,
  };
}

describe('recipe-level review identity', () => {
  it('keys reviews by session, recipe, and module', () => {
    expect(
      reviewIdentityKey({
        sessionId: 's1',
        recipeId: 'a',
        reviewedGame: 'portionPrecision',
      }),
    ).toBe('s1::a::portionPrecision');
    expect(
      reviewIdentityKey({
        sessionId: 's1',
        recipeId: 'b',
        reviewedGame: 'portionPrecision',
      }),
    ).not.toBe(
      reviewIdentityKey({
        sessionId: 's1',
        recipeId: 'a',
        reviewedGame: 'portionPrecision',
      }),
    );
  });

  it('treats missing recipeId with reviewedGame as a historical legacy module review', () => {
    expect(
      isLegacySessionReview({
        sessionId: 's1',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T15:00:00.000Z',
        reviewedGame: 'trimSmart',
        timeEfficiencyScore: 3,
        preparationQualityScore: 4,
        source: 'persisted',
      }),
    ).toBe(true);
  });

  it('treats missing recipeId and reviewedGame as a session-level assessment', () => {
    expect(isSessionLevelAssessment({})).toBe(true);
    expect(isSessionLevelAssessment({ recipeId: null, reviewedGame: null })).toBe(true);
    expect(
      isLegacySessionReview({
        sessionId: 's1',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T15:00:00.000Z',
        timeEfficiencyScore: 3,
        preparationQualityScore: 4,
        source: 'persisted',
      }),
    ).toBe(false);
  });

  it('lists independent evidenced pairs per recipe', () => {
    const s = session({
      portionEntries: [
        {
          sessionId: 's1',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T09:00:00.000Z',
          recipeId: 'recipe-a',
          recipeName: 'A',
          recipeComposition: [],
          finalRecipeWeightGrams: 1000,
          source: 'persisted',
        },
        {
          sessionId: 's1',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T09:30:00.000Z',
          recipeId: 'recipe-b',
          recipeName: 'B',
          recipeComposition: [],
          finalRecipeWeightGrams: 1000,
          source: 'persisted',
        },
      ],
      trimEntries: [
        {
          sessionId: 's1',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T10:00:00.000Z',
          recipeId: 'recipe-a',
          ingredientId: 'carrot',
          ingredientName: 'Carrot',
          ingredientWeightGrams: 1000,
          trimTechniques: 'trimming',
          estimatedWasteGrams: 100,
          actualWasteGrams: 80,
          durationMinutes: 2,
          preparationStartedAt: '2026-09-23T10:00:00.000Z',
          preparationEndedAt: '2026-09-23T10:02:00.000Z',
          source: 'persisted',
        },
      ],
    });
    expect(evidencedRecipeModules(s)).toEqual([
      { recipeId: 'recipe-a', module: 'portionPrecision' },
      { recipeId: 'recipe-b', module: 'portionPrecision' },
      { recipeId: 'recipe-a', module: 'trimSmart' },
    ]);
    expect(recipeModulesAwaitingAssessment(s)).toHaveLength(3);
  });

  it('keeps recipe reviews independent and does not collide with legacy reviews', () => {
    const legacy = {
      sessionId: 's1',
      sessionDate: '2026-09-23',
      submittedAt: '2026-09-23T14:00:00.000Z',
      reviewedGame: 'portionPrecision' as const,
      timeEfficiencyScore: 1,
      preparationQualityScore: 1,
      source: 'persisted' as const,
    };
    const recipeA = {
      ...legacy,
      recipeId: 'recipe-a',
      timeEfficiencyScore: 5,
      preparationQualityScore: 4,
      submittedAt: '2026-09-23T16:00:00.000Z',
    };
    const s = session({
      portionEntries: [
        {
          sessionId: 's1',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T09:00:00.000Z',
          recipeId: 'recipe-a',
          recipeName: 'A',
          recipeComposition: [],
          finalRecipeWeightGrams: 1000,
          source: 'persisted',
        },
        {
          sessionId: 's1',
          sessionDate: '2026-09-23',
          submittedAt: '2026-09-23T09:30:00.000Z',
          recipeId: 'recipe-b',
          recipeName: 'B',
          recipeComposition: [],
          finalRecipeWeightGrams: 1000,
          source: 'persisted',
        },
      ],
      reviews: [legacy, recipeA],
      moduleReviews: {
        trimSmart: null,
        rescueAndReuse: null,
        portionPrecision: legacy,
      },
    });
    expect(findRecipeModuleReview(s, 'recipe-a', 'portionPrecision')?.timeEfficiencyScore).toBe(5);
    expect(findRecipeModuleReview(s, 'recipe-b', 'portionPrecision')).toBeNull();
    expect(hasDuplicateReviewIdentity(s.reviews, recipeA)).toBe(true);
    expect(
      hasDuplicateReviewIdentity(s.reviews, {
        ...recipeA,
        recipeId: 'recipe-b',
      }),
    ).toBe(false);
    expect(recipeModulesAwaitingAssessment(s).map((pair) => pair.recipeId).sort()).toEqual([
      'recipe-b',
    ]);
  });
});
