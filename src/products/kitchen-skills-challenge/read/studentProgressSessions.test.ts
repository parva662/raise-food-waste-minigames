import { describe, expect, it } from 'vitest';
import { buildKitchenSkillsStudentProgressSessions } from '@/products/kitchen-skills-challenge/read/studentProgressSessions';
import { buildKitchenSkillsTrainerSessions } from '@/products/kitchen-skills-challenge/read/trainerSessions';

const sessionId = 'kitchen-day:task-1:user-1:2026-09-23';

function trimActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-trim-1',
    actor: { id: 'user-1', name: 'Student One' },
    template: { slug: 'trimSmart' },
    start: '2026-09-23T10:00:00.000Z',
    end: '2026-09-23T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
    ...overrides,
  };
}

describe('Student Progress sessions from kitchenGroupInputSelf', () => {
  it('shows Trim / Reuse / Portion before any tutor review exists', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions([
      trimActivity(),
      {
        id: 'act-rescue-1',
        template: { slug: 'rescueAndReuse' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
          { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
        ],
      },
      {
        id: 'act-portion-1',
        template: { slug: 'portionPrecision' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
          { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
          { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
          { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
          {
            template: { slug: 'recipeComposition' },
            value: {
              value: [{ ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' }],
            },
          },
        ],
      },
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.moduleReviews.trimSmart).toBeNull();
    expect(sessions[0]?.moduleReviews.rescueAndReuse).toBeNull();
    expect(sessions[0]?.moduleReviews.portionPrecision).toBeNull();
    expect(sessions[0]?.trimEntries[0]?.ingredientId).toBe('carrot');
    expect(sessions[0]?.rescueEntries[0]?.reuseDestination).toBe('Soup');
    expect(sessions[0]?.portionEntries[0]?.recipeId).toBe('mayonnaise');
  });

  it('keeps actor-less self activities instead of dropping them the way trainer grouping does', () => {
    const selfActivity = trimActivity({ actor: undefined });
    expect(buildKitchenSkillsTrainerSessions([selfActivity])).toEqual([]);
    const sessions = buildKitchenSkillsStudentProgressSessions([selfActivity], {
      actorId: 'user-1',
      actorName: 'Student One',
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.actorId).toBe('user-1');
    expect(sessions[0]?.trimEntries[0]?.ingredientId).toBe('carrot');
  });

  it('does not invent sessions from Chef-group activities that are not in the self feed', () => {
    expect(
      buildKitchenSkillsStudentProgressSessions([
        {
          id: 'group-forecast',
          actor: { id: 'chef-1', name: 'Chef' },
          template: { slug: 'chefForecast' },
          properties: [],
        },
      ]),
    ).toEqual([]);
  });

  it('attaches a tutor review even when actor ids disagree with self evidence', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [
        trimActivity({ actor: undefined }),
        {
          id: 'act-review-1',
          actor: { id: 'user-1', name: 'Student One' },
          template: { slug: 'wastePracticeReview' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionId } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
          ],
        },
      ],
      { actorId: 'self', actorName: 'Self' },
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(4);
    expect(sessions[0]?.moduleReviews.trimSmart?.preparationQualityScore).toBe(5);
  });

  it('attaches three independent module reviews without mixing sessions', () => {
    const otherSession = 'kitchen-day:task-1:user-1:2026-09-24';
    const sessions = buildKitchenSkillsStudentProgressSessions([
      trimActivity(),
      {
        id: 'act-rescue-1',
        actor: { id: 'user-1', name: 'Student One' },
        template: { slug: 'rescueAndReuse' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
          { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T10:10:00.000Z' } },
        ],
      },
      {
        id: 'act-portion-1',
        actor: { id: 'user-1', name: 'Student One' },
        template: { slug: 'portionPrecision' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T11:00:00.000Z' } },
          { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
          { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
          { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
          {
            template: { slug: 'recipeComposition' },
            value: {
              value: [{ ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' }],
            },
          },
        ],
      },
      {
        id: 'act-trim-other',
        actor: { id: 'user-1', name: 'Student One' },
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: otherSession } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T10:03:00.000Z' } },
          { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
          { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
          { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
          { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
          { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
          { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
        ],
      },
      {
        id: 'act-review-trim',
        actor: { id: 'user-1' },
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:00:00.000Z' } },
          { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 1 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
        ],
      },
      {
        id: 'act-review-rescue',
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:01:00.000Z' } },
          { template: { slug: 'reviewedGame' }, value: { value: 'rescueAndReuse' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 3 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 4 } },
        ],
      },
      {
        id: 'act-review-portion',
        actor: { id: 'other-user' },
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionId } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-23' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-23T15:02:00.000Z' } },
          { template: { slug: 'reviewedGame' }, value: { value: 'portionPrecision' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 5 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 0 } },
        ],
      },
      {
        id: 'act-review-other-session',
        actor: { id: 'user-1' },
        template: { slug: 'wastePracticeReview' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: otherSession } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-09-24' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-09-24T15:00:00.000Z' } },
          { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
          { template: { slug: 'timeEfficiencyScore' }, value: { value: 2 } },
          { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
        ],
      },
    ]);
    expect(sessions).toHaveLength(2);
    const first = sessions.find((session) => session.sessionId === sessionId);
    const second = sessions.find((session) => session.sessionId === otherSession);
    expect(first?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(1);
    expect(first?.moduleReviews.rescueAndReuse?.timeEfficiencyScore).toBe(3);
    expect(first?.moduleReviews.portionPrecision?.timeEfficiencyScore).toBe(5);
    expect(second?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(2);
    expect(second?.moduleReviews.rescueAndReuse).toBeNull();
    expect(second?.moduleReviews.portionPrecision).toBeNull();
  });
});
