import { describe, expect, it } from 'vitest';
import {
  mapCombinedWastePracticeReview,
  orderedCombinedWastePracticeReviewPropertyRefs,
  requiredCombinedScoreRefsForModules,
  validateCombinedModuleScores,
  type KitchenSkillsCombinedReviewEntry,
} from '@/products/kitchen-skills-challenge/gamebus/combinedWastePracticeReview';
import { buildCombinedWastePracticeReviewActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildCombinedWastePracticeReviewActivityMessage';
import { validateCombinedWastePracticeReviewLinkedProperties } from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import type { TaskData } from '@/platform/gamebus/types';

function combinedTrainerTask(linked: readonly string[]): TaskData {
  return {
    ...kitchenSkillsTrainerTaskFixture,
    activityTemplates: [
      {
        id: 'kd-review-combined',
        slug: 'wastePracticeReview',
        name: 'Waste practice review',
        providers: [],
        linkedProperties: linked.map((ref, index) => ({
          order: index + 1,
          name: ref,
          required: !ref.endsWith('ChefFeedback'),
          ref,
        })),
      },
    ],
  };
}

const ALL_SCORE_LINKS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'recipeId',
  'portionTimeEfficiencyScore',
  'portionPreparationQualityScore',
  'portionChefFeedback',
  'trimTimeEfficiencyScore',
  'trimPreparationQualityScore',
  'trimChefFeedback',
  'rescueTimeEfficiencyScore',
  'rescuePreparationQualityScore',
  'rescueChefFeedback',
] as const;

describe('combined wastePracticeReview mapping', () => {
  it('portion-only omits trim and rescue properties', () => {
    const entry: KitchenSkillsCombinedReviewEntry = {
      sessionId: 'kitchen-day:t:a:2026-11-03:1',
      sessionDate: '2026-11-03',
      submittedAt: '2026-11-03T12:00:00.000Z',
      recipeId: 'recipe-1',
      modules: {
        portionPrecision: { timeEfficiencyScore: 0, preparationQualityScore: 5, chefFeedback: 'Nice' },
      },
    };
    expect(orderedCombinedWastePracticeReviewPropertyRefs(entry)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'recipeId',
      'portionTimeEfficiencyScore',
      'portionPreparationQualityScore',
      'portionChefFeedback',
    ]);
    const values = mapCombinedWastePracticeReview(entry);
    expect(values.portionTimeEfficiencyScore).toEqual({ value: 0 });
    expect(values.trimTimeEfficiencyScore).toBeUndefined();
    expect(values.rescueTimeEfficiencyScore).toBeUndefined();
    expect(values.reviewedGame).toBeUndefined();
    expect(values.timeEfficiencyScore).toBeUndefined();
  });

  it('all three modules include six scores and omit blank feedback', () => {
    const entry: KitchenSkillsCombinedReviewEntry = {
      sessionId: 'kitchen-day:t:a:2026-11-03:1',
      sessionDate: '2026-11-03',
      submittedAt: '2026-11-03T12:00:00.000Z',
      recipeId: 'recipe-1',
      modules: {
        portionPrecision: { timeEfficiencyScore: 1, preparationQualityScore: 2 },
        trimSmart: { timeEfficiencyScore: 3, preparationQualityScore: 4, chefFeedback: '  ' },
        rescueAndReuse: { timeEfficiencyScore: 5, preparationQualityScore: 0, chefFeedback: 'Reuse tip' },
      },
    };
    expect(orderedCombinedWastePracticeReviewPropertyRefs(entry)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'recipeId',
      'portionTimeEfficiencyScore',
      'portionPreparationQualityScore',
      'trimTimeEfficiencyScore',
      'trimPreparationQualityScore',
      'rescueTimeEfficiencyScore',
      'rescuePreparationQualityScore',
      'rescueChefFeedback',
    ]);
  });

  it('accepts zero scores and rejects empty modules', () => {
    expect(
      validateCombinedModuleScores({
        portionPrecision: { timeEfficiencyScore: 0, preparationQualityScore: 0 },
      }),
    ).toEqual({ ok: true });
    expect(validateCombinedModuleScores({})).toEqual({ ok: false, reason: 'empty_modules' });
  });

  it('builds one SILENT_ACTIVITY with actors and combined property wrappers', () => {
    const task = combinedTrainerTask(ALL_SCORE_LINKS);
    const message = buildCombinedWastePracticeReviewActivityMessage(
      task,
      {
        sessionId: 'kitchen-day:t:a:2026-11-03:1',
        sessionDate: '2026-11-03',
        submittedAt: '2026-11-03T12:00:00.000Z',
        recipeId: 'recipe-1',
        modules: {
          portionPrecision: { timeEfficiencyScore: 2, preparationQualityScore: 3 },
          trimSmart: { timeEfficiencyScore: 4, preparationQualityScore: 5 },
        },
      },
      'student-1',
    );
    expect(message.type).toBe('SILENT_ACTIVITY');
    expect(message.data.template).toBe('wastePracticeReview');
    expect(message.data.actors).toEqual(['student-1']);
    expect(message.data.properties.map((property) => property.template)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'recipeId',
      'portionTimeEfficiencyScore',
      'portionPreparationQualityScore',
      'trimTimeEfficiencyScore',
      'trimPreparationQualityScore',
    ]);
    expect(message.data.properties.every((property) => 'obj' in property && 'value' in property.obj)).toBe(
      true,
    );
  });

  it('names missing combined TASK property links', () => {
    const task = combinedTrainerTask(['sessionId', 'sessionDate', 'submittedAt', 'recipeId']);
    const result = validateCombinedWastePracticeReviewLinkedProperties(task, [
      'portionPrecision',
      'trimSmart',
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual([
      'portionTimeEfficiencyScore',
      'portionPreparationQualityScore',
      'trimTimeEfficiencyScore',
      'trimPreparationQualityScore',
    ]);
    expect(requiredCombinedScoreRefsForModules(['portionPrecision'])).toContain(
      'portionTimeEfficiencyScore',
    );
  });
});
