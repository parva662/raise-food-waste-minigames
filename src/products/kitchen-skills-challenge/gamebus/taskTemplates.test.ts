import { describe, expect, it } from 'vitest';
import {
  kitchenSkillsTrainerTaskFixture,
  kitchenSkillsTaskFixture,
} from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import {
  assertKitchenSkillsTask,
  missingKitchenSkillsTaskTemplates,
  selectKitchenSkillsActivityTemplate,
  selectWastePracticeReviewTemplate,
} from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';

const trimOnlyTaskFixture = {
  ...kitchenSkillsTaskFixture,
  activityTemplates: kitchenSkillsTaskFixture.activityTemplates.filter(
    (template) => template.slug === 'trimSmart',
  ),
};

describe('Kitchen Skills Challenge multi-template TASK', () => {
  it('accepts one TASK that lists all three Kitchen Skills Challenge activity templates', () => {
    expect(missingKitchenSkillsTaskTemplates(kitchenSkillsTaskFixture)).toEqual([]);
    expect(selectKitchenSkillsActivityTemplate(kitchenSkillsTaskFixture, 'trimSmart')).toBe(
      'trimSmart',
    );
    expect(selectKitchenSkillsActivityTemplate(kitchenSkillsTaskFixture, 'rescueAndReuse')).toBe(
      'rescueAndReuse',
    );
    expect(selectKitchenSkillsActivityTemplate(kitchenSkillsTaskFixture, 'portionPrecision')).toBe(
      'portionPrecision',
    );
  });

  it('rejects a TASK that only has trimSmart', () => {
    expect(missingKitchenSkillsTaskTemplates(trimOnlyTaskFixture)).toEqual([
      'rescueAndReuse',
      'portionPrecision',
    ]);
    expect(() => assertKitchenSkillsTask(trimOnlyTaskFixture)).toThrow(
      /missing required activity templates: rescueAndReuse, portionPrecision/,
    );
  });

  it('selects wastePracticeReview only when that template is on the TASK', () => {
    expect(selectWastePracticeReviewTemplate(kitchenSkillsTrainerTaskFixture)).toBe(
      'wastePracticeReview',
    );
    expect(() => selectWastePracticeReviewTemplate(kitchenSkillsTaskFixture)).toThrow(
      /wastePracticeReview/,
    );
  });
});
