import { describe, expect, it } from 'vitest';
import {
  parseParticipantWasteGrams,
  parseStartingWeightGrams,
  validateIngredientStepInput,
} from './validation';
import { TRIM_SMART_VISIBLE_PRACTICE_OPTIONS } from './practiceLabels';

describe('trim smart validation', () => {
  it('validates ingredient step fields', () => {
    expect(
      validateIngredientStepInput({
        ingredientCategory: '',
        ingredientName: '',
        startingWeightGrams: '',
      }),
    ).toEqual(['ingredientCategory', 'ingredientName', 'startingWeightGrams']);

    expect(
      validateIngredientStepInput({
        ingredientCategory: 'vegetables',
        ingredientName: 'Carrot',
        startingWeightGrams: '1000',
      }),
    ).toEqual([]);
  });

  it('rejects zero and negative starting weight', () => {
    expect(
      validateIngredientStepInput({
        ingredientCategory: 'vegetables',
        ingredientName: 'Carrot',
        startingWeightGrams: '0',
      }),
    ).toContain('startingWeightGrams');
    expect(
      validateIngredientStepInput({
        ingredientCategory: 'vegetables',
        ingredientName: 'Carrot',
        startingWeightGrams: '-1',
      }),
    ).toContain('startingWeightGrams');
  });

  it('parses starting weight grams', () => {
    expect(parseStartingWeightGrams('')).toEqual({ ok: false, issue: 'blank' });
    expect(parseStartingWeightGrams('0')).toEqual({ ok: false, issue: 'invalid' });
    expect(parseStartingWeightGrams('12.5')).toEqual({ ok: true, value: 12.5 });
  });

  it('parses participant waste grams', () => {
    expect(parseParticipantWasteGrams('')).toEqual({ ok: false, issue: 'blank' });
    expect(parseParticipantWasteGrams('0')).toEqual({ ok: true, value: 0 });
    expect(parseParticipantWasteGrams('125')).toEqual({ ok: true, value: 125 });
    expect(parseParticipantWasteGrams('12.5')).toEqual({ ok: true, value: 12.5 });
    expect(parseParticipantWasteGrams('-3')).toEqual({ ok: false, issue: 'invalid' });
    expect(parseParticipantWasteGrams('abc')).toEqual({ ok: false, issue: 'invalid' });
  });

  it('exposes exactly three visible practice options', () => {
    expect(TRIM_SMART_VISIBLE_PRACTICE_OPTIONS.map((option) => option.id)).toEqual([
      'standard_practice',
      'careful_trimming',
      'whole_ingredient_use',
    ]);
  });
});
