import { describe, expect, it } from 'vitest';
import { normalizeIngredientId } from './ingredientId';

describe('normalizeIngredientId', () => {
  it('slugifies simple names', () => {
    expect(normalizeIngredientId('Carrot')).toBe('carrot');
    expect(normalizeIngredientId('Red Onion')).toBe('red-onion');
    expect(normalizeIngredientId('  Red   Onion  ')).toBe('red-onion');
  });

  it('handles punctuation safely', () => {
    expect(normalizeIngredientId("Tomato (ripe)")).toBe('tomato-ripe');
  });

  it('rejects empty names', () => {
    expect(normalizeIngredientId('')).toBeNull();
    expect(normalizeIngredientId('   ')).toBeNull();
    expect(normalizeIngredientId('!!!')).toBeNull();
  });
});
