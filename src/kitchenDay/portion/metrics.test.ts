import { describe, expect, it } from 'vitest';
import {
  absoluteErrorPercent,
  buildPortionRecipeMetrics,
  finalWeightDeviationPercent,
  finalWeightDifferenceGrams,
  recipeIngredientAccuracyPercent,
  recipeIngredientErrorPercent,
  signedDeviationPercent,
} from './metrics';
import type { RecipeReference } from './recipes';

const recipe: RecipeReference = {
  recipeId: 'demo',
  recipeName: 'Demo',
  expectedFinalWeightGrams: 1850,
  lines: [
    { ingredientId: 'yogurt', ingredientName: 'Yogurt', requiredAmount: 1000, unit: 'g' },
    { ingredientId: 'salt', ingredientName: 'Salt', requiredAmount: 8, unit: 'g' },
  ],
};

describe('Portion Precision derived metrics', () => {
  it('calculates signed and absolute ingredient deviation', () => {
    expect(signedDeviationPercent(100, 100)).toBe(0);
    expect(signedDeviationPercent(110, 100)).toBe(10);
    expect(signedDeviationPercent(75, 100)).toBe(-25);
    expect(absoluteErrorPercent(75, 100)).toBe(25);
    expect(signedDeviationPercent(10, 0)).toBeNull();
  });

  it('uses weighted whole-recipe ingredient error so tiny lines do not dominate', () => {
    expect(
      recipeIngredientErrorPercent([
        { actualAmount: 1000, targetAmount: 1000 },
        { actualAmount: 100, targetAmount: 100 },
        { actualAmount: 8, targetAmount: 8 },
        { actualAmount: 2, targetAmount: 2 },
      ]),
    ).toBe(0);
    expect(recipeIngredientAccuracyPercent(0)).toBe(100);

    const weighted = recipeIngredientErrorPercent([
      { actualAmount: 900, targetAmount: 1000 },
      { actualAmount: 16, targetAmount: 8 },
    ]);
    expect(weighted).toBeCloseTo((108 / 1008) * 100, 10);
    expect(recipeIngredientAccuracyPercent(weighted)).toBeCloseTo(100 - (108 / 1008) * 100, 10);
    expect(weighted).not.toBeCloseTo((10 + 100) / 2, 5);
  });

  it('calculates final-weight deviation from the recipe reference, not ingredient totals', () => {
    expect(finalWeightDifferenceGrams(1850, 1850)).toBe(0);
    expect(finalWeightDeviationPercent(1850, 1850)).toBe(0);
    expect(finalWeightDifferenceGrams(1890, 1850)).toBe(40);
    expect(finalWeightDeviationPercent(1890, 1850)).toBeCloseTo((40 / 1850) * 100, 10);
    expect(finalWeightDifferenceGrams(1810, 1850)).toBe(-40);
    expect(finalWeightDeviationPercent(1810, 1850)).toBeCloseTo((40 / 1850) * 100, 10);
  });

  it('builds review metrics from persisted amounts and current reference data', () => {
    const metrics = buildPortionRecipeMetrics(
      {
        sessionId: 's',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T11:00:00.000Z',
        recipeId: 'demo',
        recipeName: 'Demo',
        finalRecipeWeightGrams: 1810,
        source: 'local',
        recipeComposition: [
          { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
          { ingredientId: 'salt', ingredientName: 'Salt', actualAmount: 4, unit: 'g' },
        ],
      },
      recipe,
    );
    expect(metrics.recipeIngredientErrorPercent).toBeCloseTo((4 / 1008) * 100, 10);
    expect(metrics.expectedFinalWeightGrams).toBe(1850);
    expect(metrics.finalWeightDifferenceGrams).toBe(-40);
    expect(metrics.ingredients[0]?.signedDeviationPercent).toBe(0);
    expect(metrics.ingredients[1]?.signedDeviationPercent).toBe(-50);
  });

  it('does not invent metrics when the recipe reference is missing', () => {
    const metrics = buildPortionRecipeMetrics(
      {
        sessionId: 's',
        sessionDate: '2026-09-23',
        submittedAt: '2026-09-23T11:00:00.000Z',
        recipeId: 'unknown',
        recipeName: 'Unknown',
        finalRecipeWeightGrams: 200,
        source: 'local',
        recipeComposition: [
          { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
        ],
      },
      null,
    );
    expect(metrics.recipeIngredientAccuracyPercent).toBeNull();
    expect(metrics.expectedFinalWeightGrams).toBeNull();
    expect(metrics.finalWeightDeviationPercent).toBeNull();
    expect(metrics.ingredients[0]?.targetAmount).toBeNull();
  });
});
