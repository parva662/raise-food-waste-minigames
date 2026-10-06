import { describe, expect, it } from 'vitest';
import {
  canOpenKitchenSkillsReview,
  isKitchenSkillsNavEnabled,
  requiredKitchenSkillsSection,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';

const start: KitchenSkillsTaskProgress = {
  portionComplete: false,
  trimCount: 0,
  reuseComplete: false,
  reuseEntered: false,
  trimInProgress: false,
};

describe('Kitchen Skills completion-gated navigation', () => {
  it('keeps the student on Portion until the recipe is saved', () => {
    expect(requiredKitchenSkillsSection(start)).toBe('portion');
    expect(isKitchenSkillsNavEnabled('trim', start)).toBe(false);
    expect(isKitchenSkillsNavEnabled('reuse', start)).toBe(false);
    expect(canOpenKitchenSkillsReview(start)).toBe(false);
  });

  it('keeps the student on Trim after Portion until they choose Reuse', () => {
    const afterPortion: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimInProgress: true,
    };
    expect(requiredKitchenSkillsSection(afterPortion)).toBe('trim');
    expect(isKitchenSkillsNavEnabled('portion', afterPortion)).toBe(false);
    expect(isKitchenSkillsNavEnabled('reuse', afterPortion)).toBe(false);

    const afterTrimSaved: KitchenSkillsTaskProgress = {
      ...afterPortion,
      trimCount: 1,
      trimInProgress: false,
    };
    expect(requiredKitchenSkillsSection(afterTrimSaved)).toBe('trim');
    expect(isKitchenSkillsNavEnabled('reuse', afterTrimSaved)).toBe(false);
    expect(canOpenKitchenSkillsReview(afterTrimSaved)).toBe(false);
  });

  it('unlocks Reuse only after the student continues from a saved Trim ingredient', () => {
    const onReuse: KitchenSkillsTaskProgress = {
      portionComplete: true,
      trimCount: 1,
      reuseComplete: false,
      reuseEntered: true,
      trimInProgress: false,
    };
    expect(requiredKitchenSkillsSection(onReuse)).toBe('reuse');
    expect(isKitchenSkillsNavEnabled('trim', onReuse)).toBe(false);
    expect(canOpenKitchenSkillsReview(onReuse)).toBe(false);
  });

  it('allows Session Review only after Reuse is saved', () => {
    const complete: KitchenSkillsTaskProgress = {
      portionComplete: true,
      trimCount: 1,
      reuseComplete: true,
      reuseEntered: true,
      trimInProgress: false,
    };
    expect(canOpenKitchenSkillsReview(complete)).toBe(true);
    expect(isKitchenSkillsNavEnabled('review', complete)).toBe(true);
  });
});
