import { describe, expect, it } from 'vitest';
import { getRecipeReference } from '@/products/kitchen-skills-challenge/domain/portion/recipes';
import {
  compareTrimIngredientToRecipeReference,
  compareTrimSessionFromPortion,
  compareTrimSessionToRecipeReference,
} from '@/products/kitchen-skills-challenge/domain/trim/objectiveComparison';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

function trimEntry(
  ingredientId: string,
  ingredientName: string,
  startingWeightGrams: number,
  actualWasteGrams: number,
): KitchenSkillsTrimEntry {
  return {
    sessionId: 's1',
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T10:03:00.000Z',
    ingredientId,
    ingredientName,
    ingredientWeightGrams: startingWeightGrams,
    trimTechniques: 'trimming',
    estimatedWasteGrams: actualWasteGrams,
    actualWasteGrams,
    durationMinutes: 3,
    preparationStartedAt: '2026-09-23T10:00:00.000Z',
    preparationEndedAt: '2026-09-23T10:03:00.000Z',
    source: 'persisted',
  };
}

function hedelmatPortion(): KitchenSkillsPortionEntry {
  return {
    sessionId: 's1',
    sessionDate: '2026-09-23',
    submittedAt: '2026-09-23T09:00:00.000Z',
    recipeId: '42',
    recipeName: 'Hedelmät M,G',
    recipeComposition: [
      { ingredientId: 'banaani', ingredientName: 'Banaani', actualAmount: 1500, unit: 'g' },
      { ingredientId: 'omena', ingredientName: 'Omena', actualAmount: 1200, unit: 'g' },
      { ingredientId: 'viinirypale-tumma-kiveton', ingredientName: 'Grape', actualAmount: 1000, unit: 'g' },
    ],
    finalRecipeWeightGrams: 3700,
    source: 'persisted',
  };
}

describe('objective Trim vs JAMIX comparison', () => {
  const recipe = getRecipeReference('42');

  it('compares one Trim ingredient to its recipe-specific JAMIX reference', () => {
    const comparison = compareTrimIngredientToRecipeReference(
      trimEntry('banaani', 'Banaani', 5000, 450),
      recipe,
    );
    expect(comparison.status).toBe('available');
    if (comparison.status !== 'available') return;
    expect(comparison.actualTrimPercent).toBe(9);
    expect(comparison.referenceWastePercent).toBe(37);
    expect(comparison.referenceRemovedGrams).toBe(1850);
    expect(comparison.deltaPercentagePoints).toBe(9 - 37);
  });

  it('weights a session by starting grams instead of averaging percents equally', () => {
    const session = compareTrimSessionToRecipeReference(
      [
        trimEntry('banaani', 'Banaani', 5000, 450),
        trimEntry('omena', 'Omena', 1000, 50),
      ],
      recipe,
    );
    expect(session.status).toBe('available');
    if (session.status !== 'available') return;
    expect(session.actualRemovedGrams).toBe(500);
    expect(session.totalStartingWeightGrams).toBe(6000);
    expect(session.actualTrimPercent).toBeCloseTo((500 / 6000) * 100);
    expect(session.referenceRemovedGrams).toBe(1850 + 200);
    expect(session.referenceTrimPercent).toBeCloseTo((2050 / 6000) * 100);
    expect(session.deltaPercentagePoints).toBeCloseTo(session.actualTrimPercent - session.referenceTrimPercent);
    const equalAverage = (9 + 5) / 2;
    expect(session.actualTrimPercent).not.toBeCloseTo(equalAverage);
  });

  it('reconstructs the recipe join from persisted Portion on reload', () => {
    const session = compareTrimSessionFromPortion(
      [trimEntry('banaani', 'Banaani', 1500, 300)],
      [hedelmatPortion()],
    );
    expect(session.status).toBe('available');
    if (session.status !== 'available') return;
    expect(session.referenceTrimPercent).toBe(37);
    expect(session.actualTrimPercent).toBe(20);
    expect(session.deltaPercentagePoints).toBe(20 - 37);
  });

  it('reports above, equal, and below reference', () => {
    const below = compareTrimIngredientToRecipeReference(
      trimEntry('banaani', 'Banaani', 1000, 100),
      recipe,
    );
    const equal = compareTrimIngredientToRecipeReference(
      trimEntry('omena', 'Omena', 1000, 200),
      recipe,
    );
    const above = compareTrimIngredientToRecipeReference(
      trimEntry('viinirypale-tumma-kiveton', 'Grape', 1000, 80),
      recipe,
    );
    expect(below.status === 'available' && below.deltaPercentagePoints < 0).toBe(true);
    expect(equal.status === 'available' && equal.deltaPercentagePoints).toBe(0);
    expect(above.status === 'available' && above.deltaPercentagePoints > 0).toBe(true);
  });

  it('treats a 0 percent JAMIX reference as valid', () => {
    const ankanrinta = getRecipeReference('1');
    const comparison = compareTrimIngredientToRecipeReference(
      trimEntry('ankka-rintafilee', 'Duck', 1000, 50),
      ankanrinta,
    );
    expect(comparison.status).toBe('available');
    if (comparison.status !== 'available') return;
    expect(comparison.referenceWastePercent).toBe(0);
    expect(comparison.referenceRemovedGrams).toBe(0);
    expect(comparison.actualTrimPercent).toBe(5);
    expect(comparison.deltaPercentagePoints).toBe(5);
  });

  it('does not guess when the recipe or ingredient cannot be joined', () => {
    expect(compareTrimIngredientToRecipeReference(trimEntry('banaani', 'Banaani', 1000, 90), null).status).toBe(
      'unavailable',
    );
    expect(
      compareTrimIngredientToRecipeReference(trimEntry('unknown-fruit', 'Unknown', 1000, 90), recipe).status,
    ).toBe('unavailable');
    expect(compareTrimSessionFromPortion([trimEntry('carrot', 'Carrot', 5000, 450)], []).status).toBe(
      'unavailable',
    );
  });

  it('marks a multi-ingredient session unavailable unless every ingredient has a reference', () => {
    const session = compareTrimSessionToRecipeReference(
      [trimEntry('banaani', 'Banaani', 5000, 450), trimEntry('carrot', 'Carrot', 1000, 90)],
      recipe,
    );
    expect(session.status).toBe('unavailable');
    expect(session.actualTrimPercent).toBeCloseTo((540 / 6000) * 100);
  });
});
