import { describe, expect, it } from 'vitest';
import { sanitizeNonNegativeDecimalInput } from '@/products/kitchen-skills-challenge/domain/gramsInput';

describe('sanitizeNonNegativeDecimalInput', () => {
  it('strips letters and keeps digits', () => {
    expect(sanitizeNonNegativeDecimalInput('erffggv')).toBe('');
    expect(sanitizeNonNegativeDecimalInput('12a3')).toBe('123');
    expect(sanitizeNonNegativeDecimalInput('1400abc')).toBe('1400');
  });

  it('allows one decimal separator and treats comma as a decimal', () => {
    expect(sanitizeNonNegativeDecimalInput('12.5')).toBe('12.5');
    expect(sanitizeNonNegativeDecimalInput('12,5')).toBe('12.5');
    expect(sanitizeNonNegativeDecimalInput('12.3.4')).toBe('12.34');
    expect(sanitizeNonNegativeDecimalInput('.5')).toBe('.5');
  });

  it('rejects signs and exponent characters', () => {
    expect(sanitizeNonNegativeDecimalInput('-5')).toBe('5');
    expect(sanitizeNonNegativeDecimalInput('+5')).toBe('5');
    expect(sanitizeNonNegativeDecimalInput('1e4')).toBe('14');
    expect(sanitizeNonNegativeDecimalInput('1E-2')).toBe('12');
  });
});
