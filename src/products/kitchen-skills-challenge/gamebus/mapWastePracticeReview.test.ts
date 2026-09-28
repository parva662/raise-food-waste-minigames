import { describe, expect, it } from 'vitest';
import { kitchenSkillsTrainerTaskFixture, kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { buildWastePracticeReviewActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildWastePracticeReviewActivityMessage';
import {
  mapWastePracticeReview,
  orderedWastePracticeReviewPropertyRefs,
} from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

const entry: KitchenSkillsReviewEntry = {
  sessionId: 'kitchen-day:task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T14:00:00.000Z',
  timeEfficiencyScore: 0,
  preparationQualityScore: 5,
  source: 'local',
};

describe('wastePracticeReview mapper', () => {
  it('posts the exact required properties and omits blank chefFeedback', () => {
    expect(orderedWastePracticeReviewPropertyRefs(entry)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'timeEfficiencyScore',
      'preparationQualityScore',
    ]);
    const values = mapWastePracticeReview(entry);
    expect(Object.keys(values)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'timeEfficiencyScore',
      'preparationQualityScore',
    ]);
    expect(values).not.toHaveProperty('chefFeedback');
    expect(values).not.toHaveProperty('reviewedActivityId');
    expect(values).not.toHaveProperty('reviewedGame');
    expect(values).not.toHaveProperty('reasonCode');
    expect(values).not.toHaveProperty('freeTextNote');
    expect(values).not.toHaveProperty('unusualEvent');
    expect(values).not.toHaveProperty('serviceDate');
  });

  it('includes chefFeedback only when non-empty', () => {
    const withFeedback = mapWastePracticeReview({ ...entry, chefFeedback: '  Keep the pace.  ' });
    expect(withFeedback.chefFeedback).toEqual({ value: 'Keep the pace.' });
    expect(orderedWastePracticeReviewPropertyRefs({ ...entry, chefFeedback: '  Keep the pace.  ' })).toContain(
      'chefFeedback',
    );
  });

  it('validates wastePracticeReview against the TASK template before build', () => {
    expect(buildWastePracticeReviewActivityMessage(kitchenSkillsTrainerTaskFixture, entry).data.template).toBe(
      'wastePracticeReview',
    );
    expect(() => buildWastePracticeReviewActivityMessage(kitchenSkillsTaskFixture, entry)).toThrow(
      /wastePracticeReview/,
    );
  });
});
