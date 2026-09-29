import { describe, expect, it } from 'vitest';
import {
  canContinueToEstimate,
  parseActualWasteGrams,
  parseEstimatedWasteGrams,
  parseStartingWeightGrams,
  validateIngredientSetup,
} from '@/products/kitchen-skills-challenge/domain/trim/validation';

describe('Kitchen Day Trim validation', () => {
  it('validates name and starting weight without a category field', () => {
    expect(
      validateIngredientSetup({
        ingredientName: 'Carrot',
        startingWeightGrams: '5000',
      }),
    ).toEqual([]);
    expect(
      validateIngredientSetup({
        ingredientName: '',
        startingWeightGrams: '5000',
      }),
    ).toEqual(['ingredientName']);
    expect(
      validateIngredientSetup({
        ingredientName: 'Carrot',
        startingWeightGrams: '0',
      }),
    ).toEqual(['startingWeightGrams']);
  });

  it('requires a positive starting weight', () => {
    expect(parseStartingWeightGrams('5000').ok).toBe(true);
    expect(parseStartingWeightGrams('').ok).toBe(false);
    expect(parseStartingWeightGrams('0').ok).toBe(false);
    expect(parseStartingWeightGrams('-1').ok).toBe(false);
  });

  it('accepts estimate 0 and rejects estimate above starting weight', () => {
    expect(parseEstimatedWasteGrams('0', 5000)).toEqual({ ok: true, value: 0 });
    expect(parseEstimatedWasteGrams('600', 5000).ok).toBe(true);
    expect(parseEstimatedWasteGrams('', 5000).ok).toBe(false);
    expect(parseEstimatedWasteGrams('-1', 5000).ok).toBe(false);
    expect(parseEstimatedWasteGrams('5001', 5000).ok).toBe(false);
  });

  it('accepts actual waste 0 and rejects actual above starting weight', () => {
    expect(parseActualWasteGrams('0', 5000)).toEqual({ ok: true, value: 0 });
    expect(parseActualWasteGrams('450', 5000).ok).toBe(true);
    expect(parseActualWasteGrams('', 5000).ok).toBe(false);
    expect(parseActualWasteGrams('-1', 5000).ok).toBe(false);
    expect(parseActualWasteGrams('5001', 5000).ok).toBe(false);
  });

  it('requires a technique before the estimate step', () => {
    expect(canContinueToEstimate(null)).toBe(false);
    expect(canContinueToEstimate('trimming')).toBe(true);
  });
});
