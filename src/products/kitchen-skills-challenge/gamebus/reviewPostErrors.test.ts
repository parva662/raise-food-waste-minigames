import { describe, expect, it } from 'vitest';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import {
  kitchenSkillsReviewCommitErrorMessage,
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

  it('explains selectedTaskOfMission-style GameBus rejections without claiming we send that field', () => {
    const message = kitchenSkillsReviewCommitErrorMessage(
      'selectedTaskOfMission: Property template is not linked to this activity template',
      'Portion Precision',
    );
    expect(message).toMatch(/does not send selectedTaskOfMission/i);
    expect(message).toMatch(/not saved/i);
  });

  it('maps unlinked property reasons to actionable copy', () => {
    expect(kitchenSkillsReviewCommitErrorMessage('unlinked_property:recipeId', 'Trim Smart')).toMatch(
      /recipeId/,
    );
  });
});
