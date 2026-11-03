import { describe, expect, it } from 'vitest';
import {
  parsePersistedReviewEntries,
  parsePersistedReviewEntry,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import { buildKitchenSkillsTrainerSessions } from '@/products/kitchen-skills-challenge/read/trainerSessions';

function prop(slug: string, value: string | number | unknown) {
  return { template: { slug }, value: { value } };
}

describe('parse combined and legacy wastePracticeReview', () => {
  it('expands a combined activity into module review rows', () => {
    const activity = {
      id: 'rev-combined-1',
      actor: { id: 'student-1', displayName: 'Ada' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-1:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T12:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('portionTimeEfficiencyScore', 1),
        prop('portionPreparationQualityScore', 2),
        prop('trimTimeEfficiencyScore', 3),
        prop('trimPreparationQualityScore', 4),
        prop('trimChefFeedback', 'Trim tip'),
      ],
    };
    const reviews = parsePersistedReviewEntries(activity);
    expect(reviews.map((review) => review.reviewedGame)).toEqual(['portionPrecision', 'trimSmart']);
    expect(reviews.find((review) => review.reviewedGame === 'trimSmart')?.chefFeedback).toBe('Trim tip');
    expect(reviews.every((review) => review.recipeId === 'recipe-1')).toBe(true);
  });

  it('still parses legacy reviewedGame activities', () => {
    const activity = {
      id: 'rev-legacy-1',
      actor: { id: 'student-1' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-1:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T11:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('reviewedGame', 'rescueAndReuse'),
        prop('timeEfficiencyScore', 5),
        prop('preparationQualityScore', 5),
        prop('chefFeedback', 'Legacy rescue'),
      ],
    };
    expect(parsePersistedReviewEntry(activity)?.reviewedGame).toBe('rescueAndReuse');
  });

  it('does not double-count when legacy and newer combined overlap', () => {
    const portion = {
      id: 'portion-1',
      actor: { id: 'student-1', displayName: 'Ada' },
      template: { slug: 'portionPrecision' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-1:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T09:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('recipeName', 'Soup'),
        prop('finalRecipeWeightGrams', 1000),
        prop('recipeComposition', [] as unknown[]),
      ],
    };
    const legacy = {
      id: 'rev-legacy',
      actor: { id: 'student-1', displayName: 'Ada' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-1:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T10:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('reviewedGame', 'portionPrecision'),
        prop('timeEfficiencyScore', 1),
        prop('preparationQualityScore', 1),
      ],
    };
    const combined = {
      id: 'rev-combined',
      actor: { id: 'student-1', displayName: 'Ada' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-1:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T12:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('portionTimeEfficiencyScore', 4),
        prop('portionPreparationQualityScore', 5),
      ],
    };
    const sessions = buildKitchenSkillsTrainerSessions([portion, legacy, combined]);
    expect(sessions).toHaveLength(1);
    const portionReviews = sessions[0]!.reviews.filter(
      (review) => review.reviewedGame === 'portionPrecision',
    );
    expect(portionReviews).toHaveLength(1);
    expect(portionReviews[0]?.timeEfficiencyScore).toBe(4);
  });

  it('keeps student and session isolation', () => {
    const portionA = {
      id: 'portion-a',
      actor: { id: 'student-a', displayName: 'Ada' },
      template: { slug: 'portionPrecision' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-a:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T09:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('recipeName', 'Soup'),
        prop('finalRecipeWeightGrams', 1000),
        prop('recipeComposition', [] as unknown[]),
      ],
    };
    const reviewB = {
      id: 'rev-b',
      actor: { id: 'student-b', displayName: 'Bea' },
      template: { slug: 'wastePracticeReview' },
      properties: [
        prop('sessionId', 'kitchen-day:t:student-a:2026-11-03:1'),
        prop('sessionDate', '2026-11-03'),
        prop('submittedAt', '2026-11-03T12:00:00.000Z'),
        prop('recipeId', 'recipe-1'),
        prop('portionTimeEfficiencyScore', 5),
        prop('portionPreparationQualityScore', 5),
      ],
    };
    const sessions = buildKitchenSkillsTrainerSessions([portionA, reviewB]);
    expect(sessions[0]?.reviews).toHaveLength(0);
  });
});
