import { describe, expect, it } from 'vitest';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import {
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewSavedMessage,
  validateWastePracticeReviewLinkedProperties,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';

const entry: KitchenSkillsReviewEntry = {
  sessionId: 's1',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T12:00:00.000Z',
  timeEfficiencyScore: 4,
  preparationQualityScore: 5,
  source: 'local',
};

describe('wastePracticeReview linked property validation', () => {
  it('accepts the trainer fixture with session-level required refs linked', () => {
    expect(validateWastePracticeReviewLinkedProperties(kitchenSkillsTrainerTaskFixture, entry)).toEqual({
      ok: true,
    });
  });

  it('rejects when a session-level required property is not linked', () => {
    const task = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
        if (template.slug !== 'wastePracticeReview') return template;
        return {
          ...template,
          linkedProperties: (template.linkedProperties ?? []).filter(
            (item) => item.ref !== 'timeEfficiencyScore',
          ),
        };
      }),
    };
    const result = validateWastePracticeReviewLinkedProperties(task, entry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unlinked_property:timeEfficiencyScore');
      expect(result.missing).toContain('timeEfficiencyScore');
    }
  });

  it('blocks when GameBus still requires reviewedGame or recipeId', () => {
    const task = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
        if (template.slug !== 'wastePracticeReview') return template;
        return {
          ...template,
          linkedProperties: [
            ...(template.linkedProperties ?? []).filter(
              (item) => (item.slug ?? item.ref) !== 'reviewedGame',
            ),
            { order: 99, name: 'reviewedGame', required: true, ref: 'reviewedGame' },
          ],
        };
      }),
    };
    const result = validateWastePracticeReviewLinkedProperties(task, entry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('gamebus_session_review_blocked');
      expect(result.missing).toContain('reviewedGame');
    }
  });

  it('accepts required links when GameBus exposes them as slug instead of legacy ref', () => {
    const task = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
        if (template.slug !== 'wastePracticeReview') return template;
        return {
          ...template,
          linkedProperties: (template.linkedProperties ?? []).map((item, index) => ({
            order: item.order ?? index + 1,
            name: item.name ?? item.ref,
            required: item.required,
            slug: item.ref,
          })),
        };
      }),
    };
    expect(validateWastePracticeReviewLinkedProperties(task, entry)).toEqual({ ok: true });
  });

  it('rejects when the wastePracticeReview activity template is missing', () => {
    const task = {
      ...kitchenSkillsTrainerTaskFixture,
      activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.filter(
        (template) => template.slug !== 'wastePracticeReview',
      ),
    };
    const result = validateWastePracticeReviewLinkedProperties(task, entry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_task_template');
    }
  });

  it('describes client configuration failures without claiming a GameBus server rejection', () => {
    expect(
      kitchenSkillsReviewCommitErrorMessage('unlinked_property:sessionId', 'Tutor', ['sessionId']),
    ).toMatch(/required property links are missing on wastePracticeReview: sessionId/i);
    expect(kitchenSkillsReviewCommitErrorMessage('missing_task_template', 'Tutor')).toMatch(
      /wastePracticeReview activity template is missing/i,
    );
    expect(kitchenSkillsReviewCommitErrorMessage('already_dispatched', 'Tutor')).toMatch(
      /already submitted/i,
    );
    expect(
      kitchenSkillsReviewCommitErrorMessage('gamebus_session_review_blocked', 'Tutor', [
        'reviewedGame',
      ]),
    ).toMatch(/makes these wastePracticeReview properties optional/i);
    expect(kitchenSkillsReviewSavedMessage()).toMatch(/saved/i);
  });
});
