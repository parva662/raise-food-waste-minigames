import { describe, expect, it } from 'vitest';
import {
  assertIngredientAvailableInSession,
  isIngredientAlreadyRecorded,
  isPortionRecipeAlreadyRecorded,
  isRescueAlreadyRecorded,
  isTrimAlreadyRecorded,
  normalizeRecipeId,
} from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';

describe('Kitchen Day uniqueness', () => {
  it('normalizes numeric and string recipe ids', () => {
    expect(normalizeRecipeId(5)).toBe('5');
    expect(normalizeRecipeId('5')).toBe('5');
    expect(normalizeRecipeId('')).toBeNull();
  });

  it('blocks the same Portion recipe twice in a session', () => {
    expect(isPortionRecipeAlreadyRecorded(['23', '5'], '5')).toBe(true);
    expect(isPortionRecipeAlreadyRecorded(['23', '5'], 5)).toBe(true);
    expect(isPortionRecipeAlreadyRecorded(['23'], '5')).toBe(false);
  });

  it('allows the same ingredientId in different recipes', () => {
    const entries = [
      { recipeId: '42', ingredientId: 'banaani' },
      { recipeId: '5', ingredientId: 'banaani-banaani-1kg-peru-1lk' },
    ];
    expect(isTrimAlreadyRecorded(entries, '5', 'banaani-banaani-1kg-peru-1lk')).toBe(true);
    expect(isTrimAlreadyRecorded(entries, '42', 'banaani-banaani-1kg-peru-1lk')).toBe(false);
    expect(isTrimAlreadyRecorded(entries, '42', 'banaani')).toBe(true);
  });

  it('blocks the same ingredient twice within one recipe', () => {
    expect(
      isTrimAlreadyRecorded([{ recipeId: '42', ingredientId: 'banaani' }], '42', 'banaani'),
    ).toBe(true);
    expect(
      isRescueAlreadyRecorded([{ recipeId: '5', ingredientId: 'banaani-banaani-1kg-peru-1lk' }], '5', 'banaani-banaani-1kg-peru-1lk'),
    ).toBe(true);
  });

  it('keeps the legacy session-wide helper for older call sites', () => {
    expect(isIngredientAlreadyRecorded(['carrot'], 'potato')).toBe(false);
    expect(isIngredientAlreadyRecorded(['carrot'], 'carrot')).toBe(true);
    expect(() => assertIngredientAvailableInSession(['carrot'], 'carrot')).toThrow(/already recorded/);
  });
});
