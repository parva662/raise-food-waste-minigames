import { describe, expect, it } from 'vitest';
import {
  formatCanonicalGramsText,
  portionCompositionMassGrams,
} from '@/products/kitchen-skills-challenge/domain/session/portionCompositionMass';
import type { RecipeCompositionLine } from '@/products/kitchen-skills-challenge/domain/types';

const composition: RecipeCompositionLine[] = [
  { ingredientId: 'paprika', ingredientName: 'Paprika', actualAmount: 600, unit: 'g' },
  { ingredientId: 'onion', ingredientName: 'Onion', actualAmount: 0.5, unit: 'kg' },
  { ingredientId: 'milk', ingredientName: 'Milk', actualAmount: 2, unit: 'L' },
  { ingredientId: 'zero', ingredientName: 'Zero', actualAmount: 0, unit: 'g' },
];

describe('portionCompositionMassGrams', () => {
  it('returns grams for g and kg Portion actuals', () => {
    expect(portionCompositionMassGrams(composition, 'paprika')).toBe(600);
    expect(portionCompositionMassGrams(composition, 'onion')).toBe(500);
  });

  it('rejects volume units, missing ingredients, and non-positive amounts', () => {
    expect(portionCompositionMassGrams(composition, 'milk')).toBeNull();
    expect(portionCompositionMassGrams(composition, 'missing')).toBeNull();
    expect(portionCompositionMassGrams(composition, 'zero')).toBeNull();
  });

  it('formats canonical grams text without scientific notation for kitchen masses', () => {
    expect(formatCanonicalGramsText(600)).toBe('600');
    expect(formatCanonicalGramsText(1250.5)).toBe('1250.5');
    expect(formatCanonicalGramsText(-1)).toBe('');
  });
});
