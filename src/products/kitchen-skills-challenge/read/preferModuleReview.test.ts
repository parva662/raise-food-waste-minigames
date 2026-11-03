import { describe, expect, it } from 'vitest';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import {
  dedupeReviewsByModulePreference,
  preferModuleReview,
  reviewValuesMatch,
} from '@/products/kitchen-skills-challenge/read/preferModuleReview';

function review(
  overrides: Partial<KitchenSkillsReviewEntry> & Pick<KitchenSkillsReviewEntry, 'submittedAt' | 'persistId'>,
): KitchenSkillsReviewEntry {
  return {
    sessionId: 'kitchen-day:t:a:2026-11-03:1',
    sessionDate: '2026-11-03',
    recipeId: 'recipe-1',
    reviewedGame: 'portionPrecision',
    timeEfficiencyScore: 3,
    preparationQualityScore: 4,
    source: 'persisted',
    ...overrides,
  };
}

describe('preferModuleReview', () => {
  it('keeps the later submittedAt when legacy and combined overlap', () => {
    const older = review({ submittedAt: '2026-11-03T10:00:00.000Z', persistId: 'legacy-1' });
    const newer = review({
      submittedAt: '2026-11-03T12:00:00.000Z',
      persistId: 'combined-1:portionPrecision',
      timeEfficiencyScore: 5,
    });
    expect(preferModuleReview(older, newer)).toBe(newer);
    expect(dedupeReviewsByModulePreference([older, newer])).toEqual([newer]);
  });

  it('uses persistId as a stable tie-breaker', () => {
    const a = review({ submittedAt: '2026-11-03T12:00:00.000Z', persistId: 'aaa' });
    const b = review({ submittedAt: '2026-11-03T12:00:00.000Z', persistId: 'zzz' });
    expect(preferModuleReview(a, b)).toBe(b);
  });

  it('requires exact submitted values for confirmation matching', () => {
    const submitted = review({
      submittedAt: '2026-11-03T12:00:00.000Z',
      persistId: undefined,
      timeEfficiencyScore: 2,
      preparationQualityScore: 3,
      chefFeedback: 'ok',
    });
    expect(
      reviewValuesMatch(
        submitted,
        review({
          submittedAt: '2026-11-03T12:00:00.000Z',
          persistId: 'gb-1:portionPrecision',
          timeEfficiencyScore: 2,
          preparationQualityScore: 3,
          chefFeedback: 'ok',
        }),
      ),
    ).toBe(true);
    expect(
      reviewValuesMatch(
        submitted,
        review({
          submittedAt: '2026-11-03T12:00:00.000Z',
          persistId: 'gb-1:portionPrecision',
          timeEfficiencyScore: 1,
          preparationQualityScore: 3,
          chefFeedback: 'ok',
        }),
      ),
    ).toBe(false);
  });
});
