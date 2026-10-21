import { describe, expect, it } from 'vitest';
import {
  buildKitchenSkillsTaskProgress,
  canFinishKitchenSkillsChallenge,
  canOpenKitchenSkillsReview,
  isKitchenSkillsNavEnabled,
  requiredKitchenSkillsSection,
  unsavedKitchenSkillsDraftMessage,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

const empty: KitchenSkillsTaskProgress = {
  portionComplete: false,
  recipeId: null,
  trimCount: 0,
  rescueCount: 0,
  trimInProgress: false,
  reuseInProgress: false,
  hasEligibleTrimIngredients: false,
  hasRemainingEligibleTrimIngredients: false,
  hasReusableTrimWaste: false,
  remainingRescueIngredientIds: [],
};

const portion: KitchenSkillsPortionEntry = {
  sessionId: 's1',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T10:00:00.000Z',
  recipeId: '42',
  recipeName: 'Hedelmät M,G',
  recipeComposition: [],
  finalRecipeWeightGrams: 3700,
  source: 'local',
};

const trim: KitchenSkillsTrimEntry = {
  sessionId: 's1',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T11:05:00.000Z',
  recipeId: '42',
  ingredientId: 'banaani',
  ingredientName: 'Banaani',
  ingredientWeightGrams: 1500,
  trimTechniques: 'trimming',
  estimatedWasteGrams: 400,
  actualWasteGrams: 450,
  durationMinutes: 3,
  preparationStartedAt: '2026-09-23T11:00:00.000Z',
  preparationEndedAt: '2026-09-23T11:03:00.000Z',
  source: 'local',
};

describe('Kitchen Skills one-recipe challenge gates', () => {
  it('keeps Trim and Reuse locked until Portion is saved', () => {
    expect(requiredKitchenSkillsSection(empty)).toBe('portion');
    expect(isKitchenSkillsNavEnabled('portion', empty)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', empty)).toBe(false);
    expect(isKitchenSkillsNavEnabled('reuse', empty)).toBe(false);
    expect(canOpenKitchenSkillsReview(empty)).toBe(false);
    expect(canFinishKitchenSkillsChallenge(empty)).toBe(false);
  });

  it('lets the student finish after Portion only', () => {
    const afterPortion = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [],
      rescueEntries: [],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(afterPortion.portionComplete).toBe(true);
    expect(canFinishKitchenSkillsChallenge(afterPortion)).toBe(true);
    expect(canOpenKitchenSkillsReview(afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', afterPortion)).toBe(true);
    expect(isKitchenSkillsNavEnabled('reuse', afterPortion)).toBe(false);
  });

  it('lets a recipe with no eligible Trim ingredients finish after Portion', () => {
    const noEligible = buildKitchenSkillsTaskProgress({
      portionEntries: [
        {
          ...portion,
          recipeId: '23',
          recipeName: 'FLOW mustamakkara',
        },
      ],
      trimEntries: [],
      rescueEntries: [],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(noEligible.hasEligibleTrimIngredients).toBe(false);
    expect(canFinishKitchenSkillsChallenge(noEligible)).toBe(true);
    expect(isKitchenSkillsNavEnabled('trim', noEligible)).toBe(false);
    expect(requiredKitchenSkillsSection(noEligible)).toBe('portion');
  });

  it('unlocks Reuse after Trim waste and blocks Finish until that Rescue decision exists', () => {
    const afterTrim = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [trim],
      rescueEntries: [],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(isKitchenSkillsNavEnabled('reuse', afterTrim)).toBe(true);
    expect(canFinishKitchenSkillsChallenge(afterTrim)).toBe(false);
    expect(requiredKitchenSkillsSection(afterTrim)).toBe('reuse');
    expect(afterTrim.remainingRescueIngredientIds).toEqual(['banaani']);
  });

  it('does not open Reuse when saved Trim has no reusable waste', () => {
    const zeroWaste = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [{ ...trim, actualWasteGrams: 0 }],
      rescueEntries: [],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(isKitchenSkillsNavEnabled('reuse', zeroWaste)).toBe(false);
    expect(canFinishKitchenSkillsChallenge(zeroWaste)).toBe(true);
  });

  it('warns before abandoning an unsaved Trim or Rescue measurement', () => {
    expect(unsavedKitchenSkillsDraftMessage({ ...empty, trimInProgress: true })).toMatch(/Trim Smart/);
    expect(unsavedKitchenSkillsDraftMessage({ ...empty, reuseInProgress: true })).toMatch(/Rescue/);
    expect(unsavedKitchenSkillsDraftMessage(empty)).toBeNull();
  });

  it('keeps Finish blocked while a positive-waste Trim still needs Rescue, even with a draft', () => {
    const drafting = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [trim],
      rescueEntries: [],
      trimInProgress: true,
      reuseInProgress: false,
    });
    expect(canFinishKitchenSkillsChallenge(drafting)).toBe(false);
    expect(unsavedKitchenSkillsDraftMessage(drafting)).toMatch(/Trim Smart/);
  });

  it('lets Finish proceed after every positive-waste Trim has a Rescue decision', () => {
    const bananaRescue: KitchenSkillsRescueEntry = {
      sessionId: 's1',
      sessionDate: '2026-09-23',
      recipeId: '42',
      ingredientId: 'banaani',
      reusableWasteGrams: 200,
      reuseDestination: 'Soup',
      submittedAt: '2026-09-23T11:10:00.000Z',
      source: 'local',
    };
    const appleTrim: KitchenSkillsTrimEntry = {
      ...trim,
      ingredientId: 'omena',
      ingredientName: 'Omena',
    };
    const pendingSecond = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [trim, appleTrim],
      rescueEntries: [bananaRescue],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(pendingSecond.remainingRescueIngredientIds).toEqual(['omena']);
    expect(canFinishKitchenSkillsChallenge(pendingSecond)).toBe(false);
    const complete = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [trim, appleTrim],
      rescueEntries: [
        bananaRescue,
        {
          ...bananaRescue,
          ingredientId: 'omena',
          reusableWasteGrams: 0,
          reuseDestination: 'Cannot be reused',
        },
      ],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(complete.remainingRescueIngredientIds).toEqual([]);
    expect(canFinishKitchenSkillsChallenge(complete)).toBe(true);
  });

  it('scopes Trim and Rescue to the attempt recipe', () => {
    const otherTrim: KitchenSkillsTrimEntry = { ...trim, recipeId: '5', ingredientId: 'omena' };
    const rescue: KitchenSkillsRescueEntry = {
      sessionId: 's1',
      sessionDate: '2026-09-23',
      recipeId: '42',
      ingredientId: 'banaani',
      reusableWasteGrams: 200,
      reuseDestination: 'Smoothie',
      submittedAt: '2026-09-23T11:10:00.000Z',
      source: 'local',
    };
    const progress = buildKitchenSkillsTaskProgress({
      portionEntries: [portion],
      trimEntries: [trim, otherTrim],
      rescueEntries: [rescue],
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(progress.recipeId).toBe('42');
    expect(progress.trimCount).toBe(1);
    expect(progress.rescueCount).toBe(1);
    expect(progress.remainingRescueIngredientIds).toEqual([]);
  });
});
