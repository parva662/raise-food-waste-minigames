import { describe, expect, it } from 'vitest';
import { buildWastePracticeReviewActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildWastePracticeReviewActivityMessage';
import { kitchenSkillsTrainerTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { WASTE_PRACTICE_REVIEW_REQUIRED_REFS } from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import type { KitchenSkillsReviewEntry } from '@/products/kitchen-skills-challenge/domain/types';
import type { TaskData } from '@/platform/gamebus/types';

const entry: KitchenSkillsReviewEntry = {
  sessionId: 'kitchen-day:task:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T12:00:00.000Z',
  timeEfficiencyScore: 4,
  preparationQualityScore: 5,
  chefFeedback: '  Keep the tip steady.  ',
  source: 'local',
};

function reviewTaskWithLinked(
  refs: readonly string[],
  mode: 'ref' | 'slug',
): TaskData {
  return {
    ...kitchenSkillsTrainerTaskFixture,
    activityTemplates: kitchenSkillsTrainerTaskFixture.activityTemplates.map((template) => {
      if (template.slug !== 'wastePracticeReview') return template;
      return {
        ...template,
        linkedProperties: refs.map((value, index) =>
          mode === 'slug'
            ? { order: index + 1, name: value, required: true, slug: value }
            : { order: index + 1, name: value, required: true, ref: value },
        ),
      };
    }),
  };
}

describe('buildWastePracticeReviewActivityMessage', () => {
  it('includes chefFeedback when the live template links it', () => {
    const message = buildWastePracticeReviewActivityMessage(
      kitchenSkillsTrainerTaskFixture,
      entry,
      'user-1',
    );
    const templates = message.data.properties.map((property) => property.template);
    expect(templates).toContain('chefFeedback');
    expect(message.data.properties.find((property) => property.template === 'chefFeedback')?.obj).toEqual({
      value: 'Keep the tip steady.',
    });
  });

  it('omits chefFeedback when the live template does not link it (slug-only TASK shape)', () => {
    const task = reviewTaskWithLinked(WASTE_PRACTICE_REVIEW_REQUIRED_REFS, 'slug');
    const message = buildWastePracticeReviewActivityMessage(task, entry, 'user-1');
    const templates = message.data.properties.map((property) => property.template);
    expect(templates).not.toContain('chefFeedback');
    expect(templates).toEqual([...WASTE_PRACTICE_REVIEW_REQUIRED_REFS]);
  });

  it('keeps chefFeedback when linked via slug instead of legacy ref', () => {
    const task = reviewTaskWithLinked([...WASTE_PRACTICE_REVIEW_REQUIRED_REFS, 'chefFeedback'], 'slug');
    const message = buildWastePracticeReviewActivityMessage(task, entry, 'user-1');
    expect(message.data.properties.map((property) => property.template)).toContain('chefFeedback');
  });
});
