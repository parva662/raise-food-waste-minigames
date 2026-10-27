import { describe, expect, it } from 'vitest';
import {
  gramsTextToMassInput,
  massInputToGramsText,
  parseMassInputGrams,
  preferredMassInputUnit,
  shiftDecimalText,
} from '@/products/kitchen-skills-challenge/domain/mass';

describe('Kitchen Skills mass conversion', () => {
  it('shifts decimals without floating-point loss', () => {
    expect(shiftDecimalText('1.25', 3)).toBe('1250');
    expect(shiftDecimalText('1.0005', 3)).toBe('1000.5');
    expect(shiftDecimalText('1250', -3)).toBe('1.25');
    expect(shiftDecimalText('2', 3)).toBe('2000');
    expect(shiftDecimalText('0.5', 3)).toBe('500');
  });

  it('converts kg input to canonical grams text', () => {
    expect(massInputToGramsText('1.25', 'kg')).toBe('1250');
    expect(massInputToGramsText('2', 'kg')).toBe('2000');
    expect(massInputToGramsText('850', 'g')).toBe('850');
    expect(massInputToGramsText('', 'kg')).toBe('');
  });

  it('keeps the typed number when converting grams text back to kg', () => {
    expect(gramsTextToMassInput('1250', 'kg')).toBe('1.25');
    expect(gramsTextToMassInput('2000', 'kg')).toBe('2');
  });

  it('parses valid masses and rejects invalid values', () => {
    expect(parseMassInputGrams('1.25', 'kg')).toBe(1250);
    expect(parseMassInputGrams('0', 'g')).toBe(0);
    expect(parseMassInputGrams('999', 'g')).toBe(999);
    expect(parseMassInputGrams('1000', 'g')).toBe(1000);
    expect(parseMassInputGrams('1001', 'g')).toBe(1001);
    expect(parseMassInputGrams('', 'g')).toBeNull();
    expect(parseMassInputGrams('abc', 'g')).toBeNull();
  });

  it('prefers kg for recipe targets above 1000 g', () => {
    expect(preferredMassInputUnit(1000)).toBe('g');
    expect(preferredMassInputUnit(1001)).toBe('kg');
    expect(preferredMassInputUnit(2000)).toBe('kg');
    expect(preferredMassInputUnit(40)).toBe('g');
    expect(preferredMassInputUnit(null)).toBe('g');
  });
});
