import { describe, expect, it } from 'vitest';
import { buildKitchenDayProgressPoints } from './progressModel';

describe('Kitchen Day progress derived metrics', () => {
  it('recalculates ingredient accuracy and final-weight deviation from current reference data', () => {
    const points = buildKitchenDayProgressPoints([
      {
        actorId: 'user-1',
        actorName: 'Student',
        sessionId: 's1',
        sessionDate: '2026-09-22',
        trimEntries: [],
        rescueEntries: [],
        review: null,
        portionEntries: [
          {
            sessionId: 's1',
            sessionDate: '2026-09-22',
            submittedAt: '2026-09-22T11:00:00.000Z',
            recipeId: '1',
            recipeName: 'Ankanrinta FLOW',
            finalRecipeWeightGrams: 13500,
            source: 'persisted',
            recipeComposition: [
              { ingredientId: 'ankka-rintafilee', ingredientName: 'Duck', actualAmount: 11250, unit: 'g' },
              { ingredientId: 'rosmariini-tuore-100g', ingredientName: 'Rosemary', actualAmount: 450, unit: 'g' },
              { ingredientId: 'berner-merisuola-keskikarkea-25', ingredientName: 'Salt', actualAmount: 900, unit: 'g' },
              { ingredientId: 'meira-luomu-mustapippuri', ingredientName: 'Pepper', actualAmount: 900, unit: 'g' },
            ],
          },
        ],
      },
    ]);
    expect(points[0]?.ingredientAccuracyPercent).toBe(100);
    expect(points[0]?.finalWeightDeviationPercent).toBe(0);
  });
});
