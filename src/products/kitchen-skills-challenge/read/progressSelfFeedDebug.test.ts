import { describe, expect, it } from 'vitest';
import { buildKitchenSkillsStudentProgressSessions } from '@/products/kitchen-skills-challenge/read/studentProgressSessions';
import { summarizeKitchenSkillsSelfFeedReviews } from '@/products/kitchen-skills-challenge/read/progressSelfFeedDebug';

describe('Progress self-feed review diagnostic', () => {
  it('reports parsed and attached wastePracticeReview activities from the self feed', () => {
    const activities = [
      {
        id: 'trim-1',
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 's1' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:00:00.000Z' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
          { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
          { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
          { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
          { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
        ],
      },
      {
        id: 'review-ok',
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 's1' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
          { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
        ],
      },
      {
        id: 'review-bad',
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: 's1' } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:01:00.000Z' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
        ],
      },
    ];
    const sessions = buildKitchenSkillsStudentProgressSessions(activities);
    const summary = summarizeKitchenSkillsSelfFeedReviews(activities, sessions);
    expect(summary.wastePracticeReviewCount).toBe(2);
    expect(summary.parsedReviewCount).toBe(1);
    expect(summary.parseFailures).toEqual([{ activityId: 'review-bad', reason: 'missing_reviewedGame' }]);
    expect(summary.attachedReviews).toEqual([
      {
        sessionId: 's1',
        reviewedGame: 'trimSmart',
        timeEfficiencyScore: 4,
        preparationQualityScore: 5,
        hasFeedback: false,
      },
    ]);
  });
});
