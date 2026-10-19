import { describe, expect, it } from 'vitest';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import {
  kitchenSkillsReviewAwaitingMessage,
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewSavedMessage,
  validateWastePracticeReviewLinkedProperties,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
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

describe('wastePracticeReview linked property validation', () => {
  it('accepts the trainer fixture with all required refs linked', () => {
    expect(validateWastePracticeReviewLinkedProperties(kitchenSkillsTrainerTaskFixture, entry)).toEqual({
      ok: true,
    });
  });

  it('rejects when a required property is not linked on the activity template', () => {
    const task = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
        if (template.slug !== 'wastePracticeReview') return template;
        return {
          ...template,
          linkedProperties: (template.linkedProperties ?? []).filter((item) => item.ref !== 'recipeId'),
        };
      }),
    };
    const result = validateWastePracticeReviewLinkedProperties(task, entry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unlinked_property:recipeId');
      expect(result.missing).toContain('recipeId');
    }
  });

  it('describes client configuration failures without claiming a GameBus server rejection', () => {
    expect(kitchenSkillsReviewCommitErrorMessage('unlinked_property:recipeId', 'Trim Smart')).toMatch(
      /activity configuration is incomplete/i,
    );
    expect(kitchenSkillsReviewCommitErrorMessage('already_dispatched', 'Portion Precision')).toMatch(
      /could not be verified/i,
    );
    expect(kitchenSkillsReviewAwaitingMessage()).toMatch(/Waiting for confirmation/i);
    expect(kitchenSkillsReviewSavedMessage()).toMatch(/saved/i);
  });
});
