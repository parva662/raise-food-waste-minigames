import { describe, expect, it } from 'vitest';
import {
  canFinishKitchenSkillsChallenge,
  canOpenKitchenSkillsReview,
  isKitchenSkillsNavEnabled,
  requiredKitchenSkillsSection,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';

const start: KitchenSkillsTaskProgress = {
  portionComplete: false,
  trimCount: 0,
  reuseComplete: false,
  trimInProgress: false,
  reuseInProgress: false,
};

describe('Kitchen Skills prerequisite-gated navigation', () => {
  it('keeps Trim and Reuse locked until Portion is saved', () => {
    expect(requiredKitchenSkillsSection(start)).toBe('portion');
    expect(isKitchenSkillsNavEnabled('portion', start)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', start)).toBe(false);
    expect(isKitchenSkillsNavEnabled('reuse', start)).toBe(false);
    expect(canOpenKitchenSkillsReview(start)).toBe(false);
    expect(canFinishKitchenSkillsChallenge(start)).toBe(false);
  });

  it('allows going back to Portion after it is saved, including during Trim', () => {
    const afterPortion: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimInProgress: true,
    };
    expect(requiredKitchenSkillsSection(afterPortion)).toBe('trim');
    expect(isKitchenSkillsNavEnabled('portion', afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('reuse', afterPortion)).toBe(false);
  });

  it('unlocks Reuse after a Trim ingredient is saved and not in progress', () => {
    const afterTrimSaved: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimCount: 1,
    };
    expect(isKitchenSkillsNavEnabled('reuse', afterTrimSaved)).toBe(true);
    expect(canFinishKitchenSkillsChallenge(afterTrimSaved)).toBe(false);
  });

  it('lets the student return from Reuse to Trim to add another ingredient', () => {
    const onReuse: KitchenSkillsTaskProgress = {
      portionComplete: true,
      trimCount: 1,
      reuseComplete: false,
      trimInProgress: false,
      reuseInProgress: true,
    };
    expect(isKitchenSkillsNavEnabled('trim', onReuse)).toBe(true);
    expect(isKitchenSkillsNavEnabled('portion', onReuse)).toBe(true);
    expect(canFinishKitchenSkillsChallenge(onReuse)).toBe(false);
    expect(canOpenKitchenSkillsReview(onReuse)).toBe(false);
  });

  it('blocks Finish while there is unfinished Trim or Reuse work', () => {
    const complete: KitchenSkillsTaskProgress = {
      portionComplete: true,
      trimCount: 1,
      reuseComplete: true,
      trimInProgress: false,
      reuseInProgress: false,
    };
    expect(canFinishKitchenSkillsChallenge(complete)).toBe(true);
    expect(canFinishKitchenSkillsChallenge({ ...complete, trimInProgress: true })).toBe(false);
    expect(canFinishKitchenSkillsChallenge({ ...complete, reuseInProgress: true })).toBe(false);
  });
});
