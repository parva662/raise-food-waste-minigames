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
  hasEligibleTrimIngredients: false,
  hasRemainingEligibleTrimIngredients: false,
  hasReusableTrimWaste: false,
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
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: true,
    };
    expect(requiredKitchenSkillsSection(afterPortion)).toBe('trim');
    expect(isKitchenSkillsNavEnabled('portion', afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('reuse', afterPortion)).toBe(false);
  });

  it('lets a recipe with no eligible Trim ingredients complete after Portion', () => {
    const noEligible: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
    };
    expect(canFinishKitchenSkillsChallenge(noEligible)).toBe(true);
    expect(isKitchenSkillsNavEnabled('reuse', noEligible)).toBe(false);
    expect(requiredKitchenSkillsSection(noEligible)).toBe('trim');
  });

  it('unlocks Reuse after a Trim ingredient with reusable waste is saved', () => {
    const afterTrimSaved: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimCount: 1,
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: true,
      hasReusableTrimWaste: true,
    };
    expect(isKitchenSkillsNavEnabled('reuse', afterTrimSaved)).toBe(true);
    expect(canFinishKitchenSkillsChallenge(afterTrimSaved)).toBe(false);
  });

  it('does not open Reuse when saved Trim has no reusable waste', () => {
    const zeroWaste: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimCount: 1,
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: true,
      hasReusableTrimWaste: false,
    };
    expect(isKitchenSkillsNavEnabled('reuse', zeroWaste)).toBe(false);
    expect(canFinishKitchenSkillsChallenge(zeroWaste)).toBe(true);
  });

  it('lets the session finish after every eligible Trim is recorded with no reusable waste', () => {
    const allRecordedZeroWaste: KitchenSkillsTaskProgress = {
      ...start,
      portionComplete: true,
      trimCount: 2,
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: false,
      hasReusableTrimWaste: false,
    };
    expect(canFinishKitchenSkillsChallenge(allRecordedZeroWaste)).toBe(true);
    expect(isKitchenSkillsNavEnabled('reuse', allRecordedZeroWaste)).toBe(false);
  });

  it('lets the student return from Reuse to Trim to add another ingredient', () => {
    const onReuse: KitchenSkillsTaskProgress = {
      portionComplete: true,
      trimCount: 1,
      reuseComplete: false,
      trimInProgress: false,
      reuseInProgress: true,
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: true,
      hasReusableTrimWaste: true,
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
      hasEligibleTrimIngredients: true,
      hasRemainingEligibleTrimIngredients: false,
      hasReusableTrimWaste: true,
    };
    expect(canFinishKitchenSkillsChallenge(complete)).toBe(true);
    expect(
      canFinishKitchenSkillsChallenge({ ...complete, hasRemainingEligibleTrimIngredients: true }),
    ).toBe(true);
    expect(canFinishKitchenSkillsChallenge({ ...complete, trimInProgress: true })).toBe(false);
    expect(canFinishKitchenSkillsChallenge({ ...complete, reuseInProgress: true })).toBe(false);
  });
});
