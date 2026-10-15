import { describe, expect, it } from 'vitest';
import {
  buildKitchenSkillsTaskProgress,
  canFinishKitchenSkillsChallenge,
  canOpenKitchenSkillsReview,
  isKitchenSkillsNavEnabled,
  isKitchenSkillsRecipeComplete,
  requiredKitchenSkillsSection,
  type KitchenSkillsRecipeProgress,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

function recipe(partial: Partial<KitchenSkillsRecipeProgress> & { recipeId: string }): KitchenSkillsRecipeProgress {
  return {
    hasEligibleTrimIngredients: false,
    hasRemainingEligibleTrimIngredients: false,
    trimCount: 0,
    hasReusableTrimWaste: false,
    reuseComplete: false,
    ...partial,
  };
}

const start: KitchenSkillsTaskProgress = {
  portionComplete: false,
  trimCount: 0,
  reuseComplete: false,
  trimInProgress: false,
  reuseInProgress: false,
  hasEligibleTrimIngredients: false,
  hasRemainingEligibleTrimIngredients: false,
  hasReusableTrimWaste: false,
  allRecipesComplete: false,
  recipes: [],
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
      allRecipesComplete: false,
      recipes: [recipe({ recipeId: '42', hasEligibleTrimIngredients: true, hasRemainingEligibleTrimIngredients: true })],
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
      allRecipesComplete: true,
      recipes: [recipe({ recipeId: '23' })],
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
      allRecipesComplete: false,
      recipes: [
        recipe({
          recipeId: '42',
          hasEligibleTrimIngredients: true,
          hasRemainingEligibleTrimIngredients: true,
          trimCount: 1,
          hasReusableTrimWaste: true,
        }),
      ],
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
      allRecipesComplete: true,
      recipes: [
        recipe({
          recipeId: '42',
          hasEligibleTrimIngredients: true,
          trimCount: 1,
        }),
      ],
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
      allRecipesComplete: true,
      recipes: [
        recipe({
          recipeId: '42',
          hasEligibleTrimIngredients: true,
          trimCount: 2,
        }),
      ],
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
      allRecipesComplete: false,
      recipes: [
        recipe({
          recipeId: '42',
          hasEligibleTrimIngredients: true,
          hasRemainingEligibleTrimIngredients: true,
          trimCount: 1,
          hasReusableTrimWaste: true,
        }),
      ],
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
      allRecipesComplete: true,
      recipes: [
        recipe({
          recipeId: '42',
          hasEligibleTrimIngredients: true,
          trimCount: 1,
          hasReusableTrimWaste: true,
          reuseComplete: true,
        }),
      ],
    };
    expect(canFinishKitchenSkillsChallenge(complete)).toBe(true);
    expect(
      canFinishKitchenSkillsChallenge({ ...complete, hasRemainingEligibleTrimIngredients: true }),
    ).toBe(true);
    expect(canFinishKitchenSkillsChallenge({ ...complete, trimInProgress: true })).toBe(false);
    expect(canFinishKitchenSkillsChallenge({ ...complete, reuseInProgress: true })).toBe(false);
  });

  it('does not let one completed recipe satisfy another unfinished recipe', () => {
    const unfinishedB = recipe({
      recipeId: '5',
      hasEligibleTrimIngredients: true,
      trimCount: 0,
    });
    const finishedA = recipe({
      recipeId: '23',
      hasEligibleTrimIngredients: false,
    });
    expect(isKitchenSkillsRecipeComplete(finishedA)).toBe(true);
    expect(isKitchenSkillsRecipeComplete(unfinishedB)).toBe(false);
    expect(
      canFinishKitchenSkillsChallenge({
        ...start,
        portionComplete: true,
        allRecipesComplete: false,
        recipes: [finishedA, unfinishedB],
        hasEligibleTrimIngredients: true,
      }),
    ).toBe(false);
  });

  it('scopes Trim and Reuse progress to each recipeId when building task progress', () => {
    const portions: KitchenSkillsPortionEntry[] = [
      {
        sessionId: 's1',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T10:00:00.000Z',
        recipeId: '23',
        recipeName: 'FLOW mustamakkara',
        recipeComposition: [],
        finalRecipeWeightGrams: 1000,
        source: 'local',
      },
      {
        sessionId: 's1',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T11:00:00.000Z',
        recipeId: '42',
        recipeName: 'Hedelmät M,G',
        recipeComposition: [],
        finalRecipeWeightGrams: 3700,
        source: 'local',
      },
    ];
    const trims: KitchenSkillsTrimEntry[] = [
      {
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
      },
    ];
    const rescues: KitchenSkillsRescueEntry[] = [
      {
        sessionId: 's1',
        sessionDate: '2026-09-23',
        recipeId: '42',
        ingredientId: 'banaani',
        reusableWasteGrams: 200,
        reuseDestination: 'Smoothie',
        submittedAt: '2026-09-23T11:10:00.000Z',
        source: 'local',
      },
    ];
    const progress = buildKitchenSkillsTaskProgress({
      portionEntries: portions,
      trimEntries: trims,
      rescueEntries: rescues,
      activeRecipeId: '42',
      trimInProgress: false,
      reuseInProgress: false,
    });
    expect(progress.allRecipesComplete).toBe(true);
    expect(progress.trimCount).toBe(1);
    expect(progress.reuseComplete).toBe(true);
    expect(
      buildKitchenSkillsTaskProgress({
        portionEntries: portions,
        trimEntries: trims,
        rescueEntries: [],
        activeRecipeId: '23',
        trimInProgress: false,
        reuseInProgress: false,
      }).allRecipesComplete,
    ).toBe(false);
  });
});
